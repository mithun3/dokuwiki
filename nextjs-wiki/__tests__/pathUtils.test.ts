import { describe, expect, it } from 'vitest';
import {
  normalizeWindowsDriveLetter,
  replaceWindowsDriveLetter,
} from '../src/lib/pathUtils';

describe('normalizeWindowsDriveLetter', () => {
  it.each([
    ['d', 'D'],
    ['D', 'D'],
    [' d ', 'D'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeWindowsDriveLetter(input)).toBe(expected);
  });

  it.each(['', ':', 'D:', 'DD', '1', 'D:\\', '/Volumes/Music'])('rejects %s', (input) => {
    expect(normalizeWindowsDriveLetter(input)).toBe('');
  });
});

describe('replaceWindowsDriveLetter', () => {
  it.each([
    ['G:\\Music\\Artist\\track.mp3', 'D', 'D:\\Music\\Artist\\track.mp3'],
    ['h:/Music/Artist/track.flac', 'd', 'D:/Music/Artist/track.flac'],
    ['C:\\track.wav', 'z', 'Z:\\track.wav'],
  ])('replaces only the drive in %s', (inputPath, sourceDrive, expected) => {
    expect(replaceWindowsDriveLetter(inputPath, sourceDrive)).toBe(expected);
  });

  it.each([
    '/Volumes/Music/track.mp3',
    'Music/track.mp3',
    './Music/track.mp3',
    '../Music/track.mp3',
    '~/Music/track.mp3',
    '\\\\server\\share\\track.mp3',
    'https://example.com/track.mp3',
    '',
  ])('leaves non-drive path %s unchanged', (inputPath) => {
    expect(replaceWindowsDriveLetter(inputPath, 'D')).toBe(inputPath);
  });

  it('leaves paths unchanged when the override is empty or invalid', () => {
    const inputPath = 'G:\\Music\\track.mp3';

    expect(replaceWindowsDriveLetter(inputPath, '')).toBe(inputPath);
    expect(replaceWindowsDriveLetter(inputPath, '12')).toBe(inputPath);
  });
});