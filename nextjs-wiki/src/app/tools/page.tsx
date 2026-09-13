/**
 * @file src/app/tools/page.tsx
 * @description Redirect page for /tools → /tools/music-export.
 *
 * Currently "Tools" has only one entry (Music Export). Rather than show a
 * blank page when the user clicks the "Tools" parent link in the sidebar,
 * we redirect immediately to the first tool.
 *
 * When more tools are added in the future, this page can be converted into
 * a proper tools index/listing page without changing any links.
 */

import { redirect } from 'next/navigation';

export default function ToolsIndexPage() {
  redirect('/tools/music-export');
}
