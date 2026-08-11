'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Main navigation structure for the wiki
 * Includes expandable sections with nested links
 * Stored in state to allow client-side modifications
 */
const navigationItems = [
  { href: '/', label: 'Home' },
  {
    href: '/recording',
    label: 'Recording',
    children: [
      { href: '/recording/techniques', label: 'Techniques' },
      { href: '/recording/best-practices', label: 'Best Practices' },
      { href: '/recording/equipment-guide', label: 'Equipment Guide' },
      { href: '/recording/my-equipment', label: 'My Equipment' },
      { href: '/recording/urban-ambience', label: 'Urban Ambience' },
      { href: '/recording/foley-essentials', label: 'Foley Essentials' },
    ],
  },
  { href: '/sounds', label: 'Sounds' },
  { href: '/video', label: 'Video' },
  { href: '/equipment', label: 'Equipment' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/faq', label: 'FAQ' },

  // ─── Tools section ─────────────────────────────────────────────────────────
  // Expandable group for utility pages. The parent href redirects to the first
  // tool; the expand/collapse chevron is handled by the existing toggleExpanded
  // logic using '/tools' as the key in localStorage 'sidebar-expanded'.
  {
    href: '/tools',
    label: 'Tools',
    children: [
      { href: '/tools/music-export', label: 'Music Export' },
    ],
  },
];

/**
 * Navigation sidebar component
 * 
 * Features:
 * - Expandable sections for nested navigation
 * - Active link highlighting based on current pathname
 * - Auto-expand parent when viewing child page
 * - Persistent expansion state (localStorage)
 * - Responsive toggle for mobile
 * 
 * @component
 * @returns {JSX.Element} Vertical navigation sidebar
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [skipAutoExpand, setSkipAutoExpand] = useState(true);

  // Load expanded state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    setExpandedItems(saved ? JSON.parse(saved) : []);
    setIsLoaded(true);
    setSkipAutoExpand(false);
  }, []);

  // Auto-expand parent if viewing a child page (only after initial load)
  useEffect(() => {
    if (!isLoaded || skipAutoExpand) return;
    
    navigationItems.forEach((item) => {
      if (item.children) {
        const isViewingChild = item.children.some(
          (child) => pathname === child.href
        );
        if (isViewingChild && !expandedItems.includes(item.href)) {
          setExpandedItems((prev) => {
            const updated = [...prev, item.href];
            localStorage.setItem('sidebar-expanded', JSON.stringify(updated));
            return updated;
          });
        }
      }
    });
  }, [pathname, isLoaded, expandedItems, skipAutoExpand]);

  // Save expanded state to localStorage
  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) => {
      const updated = prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href];
      localStorage.setItem('sidebar-expanded', JSON.stringify(updated));
      return updated;
    });
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isExpanded = (href: string) => expandedItems.includes(href);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm lg:hidden"
        aria-label="Open navigation"
        aria-expanded={isMobileOpen}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={[
        'fixed left-0 top-0 z-50 h-screen w-64 overflow-y-auto border-r border-gray-200 bg-white',
        'transform transition-transform duration-200 lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
      <div className="p-6">
        <div className="mb-8 flex items-start justify-between gap-3">
          <Link href="/" className="block" onClick={() => setIsMobileOpen(false)}>
          <h1 className="text-xl font-bold text-gray-900">
            Audio / Recording
          </h1>
          <p className="text-sm text-gray-500">Sounds / Technology</p>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            aria-label="Close navigation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav>
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex-1 block px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>

                  {item.children && (
                    <button
                      onClick={() => toggleExpanded(item.href)}
                      className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={
                        isExpanded(item.href) ? 'Collapse' : 'Expand'
                      }
                    >
                      <span className="inline-block transition-transform">
                        {isExpanded(item.href) ? '▼' : '▶'}
                      </span>
                    </button>
                  )}
                </div>

                {item.children && isExpanded(item.href) && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`block px-3 py-2 rounded-md text-sm transition ${
                            pathname === child.href
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      </aside>
    </>
  );
}
