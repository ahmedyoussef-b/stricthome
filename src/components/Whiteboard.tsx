// src/components/Whiteboard.tsx
'use client';

import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Card } from './ui/card';
import { FrenchTranslation } from '@/lib/tldraw-fr';

export function Whiteboard() {
  return (
    <Card className="w-full h-full flex-1 relative bg-background/80">
      <Tldraw persistenceKey="classroom-whiteboard" assetUrls={{}}>
        <FrenchTranslation />
      </Tldraw>
    </Card>
  );
}
