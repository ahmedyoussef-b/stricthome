// src/components/Whiteboard.tsx
'use client';

import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Card } from './ui/card';

export function Whiteboard() {
  return (
    <Card className="w-full h-full min-h-[400px] lg:min-h-0 flex-1 relative bg-background/80">
      <Tldraw persistenceKey="classroom-whiteboard">
        {/* On peut ajouter des composants personnalisés à l'interface ici si nécessaire */}
      </Tldraw>
    </Card>
  );
}
