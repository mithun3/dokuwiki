'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

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
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="block mb-8">
          <h1 className="text-xl font-bold text-gray-900">
            Audio / Recording
          </h1>
          <p className="text-sm text-gray-500">Sounds / Technology</p>
        </Link>

        <nav>
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
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
  );
}
