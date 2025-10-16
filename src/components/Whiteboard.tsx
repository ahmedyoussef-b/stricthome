// src/components/Whiteboard.tsx
'use client';

import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { FrenchTranslation } from '@/lib/tldraw-fr';

export function Whiteboard() {
  return (
    <div className="w-full h-full relative">
      <Tldraw persistenceKey="classroom-whiteboard" assetUrls={{}}>
        <FrenchTranslation />
      </Tldraw>
    </div>
  );
}
