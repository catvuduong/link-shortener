'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { LinkStatsSkeleton, LinkStatsView } from '@/components/link-stats';

export default function LinkStatsPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <LinkStatsSkeleton />
        </main>
      }
    >
      <LinkStatsFromRoute />
    </Suspense>
  );
}

// useParams() is only known at request time, so it lives under the Suspense boundary above.
function LinkStatsFromRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <LinkStatsView slug={slug} />;
}
