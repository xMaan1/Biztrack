'use client';

import Script from 'next/script';
import LeadGuide from '@/src/components/crm/leads/leadguide';

export default function LeadGuidePage() {
  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        strategy="afterInteractive"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <LeadGuide />
    </>
  );
}
