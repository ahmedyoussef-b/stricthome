// src/components/Whiteboard.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Trash2, Pen, Eraser, Palette, Minus, Plus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Slider } from './ui/slider';

interface WhiteboardProps {
  sessionId: string;
}

type Tool = 'pen' | 'eraser';

interface DrawData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  lineWidth: number;
  tool: Tool;
  senderId?: string;
}

const COLORS = [
  '#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
];

export function Whiteboard({ sessionId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const { data: session } = useSession();

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  
  const currentPos = useRef<{x:number, y:number} | null>(null);

  const broadcastDraw = useCallback(async (data: Omit<DrawData, 'senderId'>) => {
    try {
      await fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, event: 'draw', data }),
      });
    } catch (error) {
      console.error('Failed to broadcast draw event:', error);
    }
  }, [sessionId]);

  const onDraw = useCallback((data: DrawData) => {
    if (!contextRef.current || !canvasRef.current) return;
    const context = contextRef.current;
    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;

    context.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = data.color;
    context.lineWidth = data.lineWidth;

    context.beginPath();
    context.moveTo(data.x0 * w, data.y0 * h);
    context.lineTo(data.x1 * w, data.y1 * h);
    context.stroke();
    context.closePath();
  }, []);

  const handleClearCanvas = async () => {
    if(!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if(!context) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
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

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const channelName = `presence-whiteboard-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);
    
    const drawHandler = (data: DrawData) => {
      if (data.senderId !== session?.user.id) onDraw(data);
    };

    const clearHandler = () => {
        if(canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }

    channel.bind('draw', drawHandler);
    channel.bind('clear', clearHandler);

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, session?.user.id, onDraw]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    currentPos.current = { x: offsetX, y: offsetY };
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    currentPos.current = null;
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current || !currentPos.current) return;
    
    const { offsetX, offsetY } = nativeEvent;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    const data: Omit<DrawData, 'senderId'> = {
      x0: currentPos.current.x / w,
      y0: currentPos.current.y / h,
      x1: offsetX / w,
      y1: offsetY / h,
      color,
      lineWidth,
      tool,
    };
    
    onDraw({ ...data, senderId: session?.user.id });
    broadcastDraw(data);

    currentPos.current = { x: offsetX, y: offsetY };
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
      <CardContent className="flex-grow p-0 relative flex">
         <div className="p-2 border-r bg-muted/50 flex flex-col gap-2 items-center">
            <Button variant={tool === 'pen' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pen')}>
                <Pen />
            </Button>
            <Button variant={tool === 'eraser' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('eraser')}>
                <Eraser />
            </Button>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon"><Palette /></Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-auto p-2">
                    <div className="flex gap-1">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn("h-6 w-6 rounded-full border-2", color === c ? 'border-primary' : 'border-transparent')}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <div className="h-full w-full flex items-center justify-center relative">
                            <div style={{width: `${lineWidth/2}px`, height: `${lineWidth/2}px`}} className="bg-foreground rounded-full"/>
                        </div>
                    </Button>
                </PopoverTrigger>
                 <PopoverContent side="right" className="w-40 p-2">
                    <Slider 
                        min={1} 
                        max={20} 
                        step={1}
                        value={[lineWidth]}
                        onValueChange={(value) => setLineWidth(value[0])}
                    />
                </PopoverContent>
            </Popover>
        </div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseOut={finishDrawing}
          onMouseMove={draw}
          className={cn('h-full w-full touch-none rounded-b-lg', tool === 'pen' ? 'cursor-crosshair' : 'cursor-grab')}
        />
      </CardContent>
    </Card>
  );
}
