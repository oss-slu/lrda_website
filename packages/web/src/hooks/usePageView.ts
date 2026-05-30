import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { API_URL } from '@/services/api';

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
  const location = useLocation();

  useEffect(() => {
    const utm = getUtmParams();

    fetch(`${API_URL}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: location.pathname,
        pageTitle: document.title,
        referrer: document.referrer || null,
        screenWidth: getScreenWidthBucket(),
        language: navigator.language,
        ...utm,
      }),
      keepalive: true,
    }).catch(() => {
      // Silently ignore errors - tracking failures shouldn't affect app
    });
  }, [location.pathname]);
}
