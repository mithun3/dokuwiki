import { describe, expect, it } from 'vitest';
import { generateBatchScript } from '@/lib/exportUtils';
import type { ParsedTrack } from '@/lib/types';

const MANIFEST_MARKER = '__MUSIC_EXPORT_MANIFEST__\r\n';
const RUNNER_MARKER = '__MUSIC_EXPORT_RUNNER__\r\n';

function track(sourcePath: string, playlistName = 'Windows Mix'): ParsedTrack {
  return {
    sourcePath,
    filename: sourcePath.split(/[\\/]/).pop() ?? sourcePath,
    detectedFrom: 'm3u8',
    playlistName,
  };
}

function readManifest(script: string): {
  destination: string;
  tracks: Array<{ sourcePath: string; playlistName: string }>;
} {
  const markerIndex = script.lastIndexOf(MANIFEST_MARKER);
  if (markerIndex < 0) throw new Error('Manifest marker not found');
  return JSON.parse(script.slice(markerIndex + MANIFEST_MARKER.length).trim());
}

function readPowerShellRunner(script: string): string {
  const runnerStart = script.indexOf(RUNNER_MARKER);
  const manifestStart = script.lastIndexOf(MANIFEST_MARKER);
  if (runnerStart < 0 || manifestStart <= runnerStart) throw new Error('PowerShell runner not found');
  return script.slice(runnerStart + RUNNER_MARKER.length, manifestStart);
}

describe('generateBatchScript', () => {
  it('uses cmd.exe only as a static PowerShell launcher', () => {
    const script = generateBatchScript(
      [track('H:\\Music Library\\Artist\\track.mp3')],
      'I:\\Music Export',
    );
    const launcher = script.slice(0, script.indexOf(RUNNER_MARKER));

    expect(launcher).toContain('set "MUSIC_EXPORT_SCRIPT=%~f0"');
    expect(launcher).toContain(
      'powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ',
    );
    expect(launcher).not.toMatch(/^\s*(call|copy|xcopy|pause|time)\b/im);
    expect(launcher).not.toMatch(/^\s*if\s+(?:not\s+)?exist\b/im);
  });

  it('stores normalized paths and metacharacters losslessly in JSON', () => {
    const sourcePath = 'H:/Music/time & date! 100% ^test^/Pilato & Yousif – Track.flac';
    const script = generateBatchScript([track(sourcePath, 'Mix (A&B) 100%')], 'I:/Exports & More');
    const manifest = readManifest(script);

    expect(manifest).toEqual({
      destination: 'I:\\Exports & More',
      tracks: [{
        sourcePath: 'H:\\Music\\time & date! 100% ^test^\\Pilato & Yousif – Track.flac',
        playlistName: 'Mix (A&B) 100%',
      }],
    });
  });

  it('canonicalizes a bare destination drive for a large export', () => {
    const tracks = Array.from({ length: 11_738 }, (_, index) =>
      track(`H:\\Music\\Artist ${index}\\Track ${index}.mp3`),
    );
    const script = generateBatchScript(tracks, 'H:');
    const manifest = readManifest(script);
    const runner = readPowerShellRunner(script);

    expect(manifest.destination).toBe('H:\\');
    expect(manifest.tracks).toHaveLength(11_738);
    expect(runner).toContain("Test-Path -LiteralPath $job.destination -PathType Container");
    expect(runner).toContain("$job.destination[1] -ne ':'");
    expect(runner).toContain("$job.destination[2] -ne '\\'");
  });

  it('keeps all user-derived values beyond cmd.exe execution', () => {
    const script = generateBatchScript(
      [track('H:\\Music\\Pilato & Yousif.flac', 'Crossover & Time')],
      'I:\\Export & Archive',
    );
    const launcher = script.slice(0, script.indexOf(RUNNER_MARKER));

    expect(launcher).not.toMatch(/Pilato|Yousif|Crossover|Archive/);
  });

  it('uses literal-path PowerShell operations and prints exact missing paths safely', () => {
    const runner = readPowerShellRunner(
      generateBatchScript([track('H:\\Music\\track.mp3')], 'I:\\Export'),
    );

    expect(runner).toContain('Test-Path -LiteralPath $track.sourcePath -PathType Leaf');
    expect(runner).toContain('Copy-Item -LiteralPath $track.sourcePath');
    expect(runner).toContain("Write-Host $track.sourcePath");
    expect(runner).toContain("ConvertFrom-Json");
    expect(runner).not.toMatch(/\bInvoke-Expression\b/);
  });

  it('aborts a global source mismatch and scans mounted drives before copying', () => {
    const runner = readPowerShellRunner(
      generateBatchScript([track('H:\\Music\\track.mp3')], 'I:\\Export'),
    );
    const preflightIndex = runner.indexOf('$configuredMatches');
    const copyIndex = runner.indexOf('foreach ($track in $job.tracks)');

    expect(preflightIndex).toBeGreaterThan(0);
    expect(copyIndex).toBeGreaterThan(preflightIndex);
    expect(runner).toContain('[Math]::Min(50, [int]$job.tracks.Count)');
    expect(runner).toContain('Get-PSDrive -PSProvider FileSystem');
    expect(runner).toContain("$sampleTrack.sourcePath[2] -eq '\\'");
    expect(runner).not.toMatch(/-(?:not)?match\b/i);
    expect(runner).toContain('Likely source drive: ');
    expect(runner).toContain('No mounted drive matched the sampled playlist paths.');
  });

  it('keeps the fixed PowerShell command below cmd.exe command length limits', () => {
    const tracks = Array.from({ length: 500 }, (_, index) =>
      track(`H:\\Music\\Artist ${index}\\Track ${index}.mp3`),
    );
    const script = generateBatchScript(tracks, 'I:\\Export');
    const powerShellLine = script.split('\r\n').find((line) => line.startsWith('powershell.exe'));

    expect(powerShellLine).toBeDefined();
    expect(powerShellLine!.length).toBeLessThan(8191);
  });

  it('uses native CRLF throughout the hybrid batch file', () => {
    const script = generateBatchScript([track('H:\\Music\\track.mp3')], 'I:\\Export');

    expect(script).not.toMatch(/(?<!\r)\n/);
    expect(script).toContain(MANIFEST_MARKER);
  });
});
