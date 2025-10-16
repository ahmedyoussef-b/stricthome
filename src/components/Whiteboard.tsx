// src/components/Whiteboard.tsx
'use client';

import { Tldraw, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Card } from './ui/card';
import { useEffect } from 'react';
import { FrenchTranslation } from '@/lib/tldraw-fr';


function EditorWrapper() {
    const editor = useEditor();
    useEffect(() => {
        editor.updateInstanceState({
            locale: 'fr',
        });
    }, [editor]);
    return null;
}


export function Whiteboard() {
  return (
    <Card className="w-full h-full flex-1 relative bg-background/80">
      <Tldraw persistenceKey="classroom-whiteboard" assetUrls={{}} >
         <EditorWrapper />
         <FrenchTranslation />
      </Tldraw>
    </Card>
  );
}
