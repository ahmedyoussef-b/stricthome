// src/components/Whiteboard.tsx
'use client';

import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export function Whiteboard() {
  return (
    <div className="w-full h-full relative">
      <Tldraw persistenceKey="classroom-whiteboard" assetUrls={{}} />
    </div>
  );
}
