// src/components/Whiteboard.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

interface WhiteboardProps {
  sessionId: string;
}

interface DrawData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  senderId?: string;
}

export function Whiteboard({ sessionId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const { data: session } = useSession();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color] = useState('#000000'); // La couleur est fixe pour l'instant

  const broadcastDraw = useCallback(async (data: Omit<DrawData, 'senderId'>) => {
    try {
      await fetch('/api/whiteboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          event: 'draw',
          data,
        }),
      });
    } catch (error) {
      console.error('Failed to broadcast draw event:', error);
    }
  }, [sessionId]);

  const onDraw = useCallback((data: DrawData) => {
    if (!contextRef.current) return;
    const context = contextRef.current;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    context.beginPath();
    context.moveTo(data.x0 * w, data.y0 * h);
    context.lineTo(data.x1 * w, data.y1 * h);
    context.strokeStyle = data.color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
  }, []);

  const handleClearCanvas = async () => {
    if(!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if(!context) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Broadcast clear event
    try {
      await fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, event: 'clear', data: {} }),
      });
    } catch (error) {
      console.error('Failed to broadcast clear event:', error);
    }
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions based on parent container size
    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);


    const context = canvas.getContext('2d');
    if (!context) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    return () => {
        window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const channelName = `presence-whiteboard-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);
    
    const drawHandler = (data: DrawData) => {
      // Don't draw events sent by the current user
      if (data.senderId !== session?.user.id) {
        onDraw(data);
      }
    };

    const clearHandler = () => {
        if(canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
        }
    }

    channel.bind('draw', drawHandler);
    channel.bind('clear', clearHandler);

    return () => {
      channel.unbind('draw', drawHandler);
      channel.unbind('clear', clearHandler);
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, session?.user.id, onDraw]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    if (contextRef.current) {
      contextRef.current.closePath();
    }
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) {
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    const data: Omit<DrawData, 'senderId'> = {
      x0: (offsetX - nativeEvent.movementX) / w,
      y0: (offsetY - nativeEvent.movementY) / h,
      x1: offsetX / w,
      y1: offsetY / h,
      color,
    };
    
    onDraw({ ...data, color: data.color, senderId: session?.user.id });
    broadcastDraw(data);
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader className='flex-row items-center justify-between'>
        <CardTitle>Tableau Blanc</CardTitle>
        <Button variant="destructive" size="icon" onClick={handleClearCanvas}>
            <Trash2 className='h-4 w-4' />
            <span className='sr-only'>Effacer le tableau</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseOut={finishDrawing}
          onMouseMove={draw}
          className={cn('h-full w-full touch-none rounded-b-lg')}
        />
      </CardContent>
    </Card>
  );
}
