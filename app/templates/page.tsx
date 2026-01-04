export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import TemplatesClient from './TemplatesClient';

export default function TemplatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-purple-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">Loading templates...</div>
      </div>
    }>
      <TemplatesClient />
    </Suspense>
  );
}
