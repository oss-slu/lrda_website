'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

function getScreenWidthBucket(): string {
  const w = window.innerWidth;
  if (w < 640) return 'sm';
  if (w < 1024) return 'md';
  if (w < 1440) return 'lg';
  return 'xl';
}

function getUtmParams(): Record<string, string | null> {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
  };
}

export function usePageView() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track in development
    if (process.env.NODE_ENV !== 'production') return;

    const utm = getUtmParams();

    fetch(`${API_URL}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        pageTitle: document.title,
        referrer: document.referrer || null,
        screenWidth: getScreenWidthBucket(),
        language: navigator.language,
        ...utm,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
}
