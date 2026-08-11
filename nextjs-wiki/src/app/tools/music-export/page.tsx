/**
 * @file src/app/tools/music-export/page.tsx
 * @description Server component for the Music Export Tool page.
 *
 * Why this is a server component (and specifically a dynamic one)
 * ────────────────────────────────────────────────────────────────
 * We need to know the HTTP `host` header at render time so we can pass
 * `isLocalhost` down to MusicExportTool as a prop. This allows the client
 * component to conditionally disable the "Copy via Server" button without
 * an extra client-side fetch or a visible layout shift.
 *
 * `export const dynamic = 'force-dynamic'` opts this route out of static
 * generation. This only affects /tools/music-export — all other pages
 * continue to be statically generated as before.
 *
 * Routing note
 * ─────────────
 * Because this file is at a concrete path (src/app/tools/music-export/page.tsx),
 * Next.js App Router will serve it for /tools/music-export BEFORE falling
 * through to the [...slug] catch-all route. No conflict arises.
 */

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import MusicExportTool from '@/components/tools/MusicExportTool';

// Force dynamic rendering so `headers()` is evaluated on every request.
// Without this, Next.js would attempt to statically render the page at
// build time and `headers()` would throw.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Music Export Tool — Audio Wiki',
  description:
    'Parse .m3u8 and .csv playlist files, review detected audio paths, ' +
    'and copy files to a destination — locally or via a generated shell script.',
  keywords: ['music export', 'playlist', 'm3u8', 'csv', 'audio', 'DJ', 'copy'],
};

export default function MusicExportPage() {
  // `headers()` is only available in server components.
  // The returned ReadonlyHeaders object is synchronous in Next.js 14.
  const headersList = headers();
  const host = headersList.get('host') ?? '';

  /**
   * True when the page is accessed via the loopback interface.
   * This is the ONLY condition under which the server-side copy API works
   * (the route enforces the same check independently).
   */
  const isLocalhost =
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('[::1]');

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Music Export Tool
        </h1>
        <p className="text-gray-600">
          Parse playlist files exported from your DJ software, review the
          detected audio paths, then copy or script-download them to any
          destination.
        </p>
      </div>

      {/* ── Hosted-environment notice ────────────────────────────────────────── */}
      {/*
        When running on Vercel (or any other non-localhost host) the server-side
        file copy is unavailable because the server has no access to the user's
        local filesystem. Script download and the browser-based standalone tool
        remain fully functional.
      */}
      {!isLocalhost && (
        <div
          role="note"
          className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6 text-sm text-amber-800"
        >
          <strong className="font-semibold">Running on a hosted server.</strong>{' '}
          Script download and the browser-based copy tool work from anywhere.
          The &ldquo;Copy Files via Server&rdquo; button requires cloning this
          repository and running{' '}
          <code className="bg-amber-100 px-1 py-0.5 rounded text-xs font-mono">
            npm run dev
          </code>{' '}
          on your local machine.
          <br />
          <span className="mt-1 block text-amber-700">
            CLI alternative:{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded text-xs font-mono">
              node scripts/export-music.js playlist.m3u8 /path/to/dest
            </code>
          </span>
        </div>
      )}

      {/* ── Main tool component (client-side) ───────────────────────────────── */}
      <MusicExportTool isLocalhost={isLocalhost} />
    </div>
  );
}
