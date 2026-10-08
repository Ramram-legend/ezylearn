'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
}

export default function AdBanner({
  dataAdSlot,
  dataAdFormat = 'auto',
  dataFullWidthResponsive = true,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
        // Prevent duplicate push if it's already initialized
        if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Use a fallback for dev mode or when the user is premium
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    return (
      <div className="w-full min-h-[100px] flex items-center justify-center bg-slate-900/50 border border-slate-700/50 rounded-xl my-4 text-slate-500 text-sm">
        [AdSense Banner Placeholder - Slot {dataAdSlot}]
      </div>
    );
  }

  return (
    <div className="w-full my-4 overflow-hidden rounded-xl">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7555332282799741"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
        ref={adRef}
      />
    </div>
  );
}
