// src/components/Whiteboard.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Trash2, Pen, Eraser, Palette, Undo2, Redo2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';

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
}

interface HistoryEntry {
    type: 'draw' | 'clear' | 'undo' | 'redo';
    data?: DrawData | DrawData[];
    senderId: string;
}


const COLORS = [
  '#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
];

const THICKNESSES = [
    { label: 'Fin', value: 2 },
    { label: 'Moyen', value: 5 },
    { label: 'Épais', value: 10 },
    { label: 'Très épais', value: 15 },
]

function ThicknessPicker({ current, onChange }: { current: number, onChange: (value: number) => void }) {
    return (
        <div className="flex flex-col gap-2">
            {THICKNESSES.map(({label, value}) => (
                 <Button
                    key={value}
                    variant={current === value ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-auto p-2"
                    onClick={() => onChange(value)}
                >
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted border flex items-center justify-center">
                            <div className="rounded-full bg-foreground" style={{width: `${value}px`, height: `${value}px`}} />
                        </div>
                        <span className="text-xs">{label}</span>
                    </div>
                </Button>
            ))}
        </div>
    )
}


export function Whiteboard({ sessionId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const { data: session } = useSession();

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const currentLine = useRef<DrawData[]>([]);

  const currentPos = useRef<{x:number, y:number} | null>(null);

  const broadcastEvent = useCallback(async (event: string, data: any) => {
    try {
      await fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, event, data }),
      });
    } catch (error) {
      console.error(`Failed to broadcast ${event} event:`, error);
    }
  }, [sessionId]);
  
  
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i <= historyIndex; i++) {
        const entry = history[i];
        if (entry.type === 'draw' && entry.data) {
             const lines = Array.isArray(entry.data) ? entry.data : [entry.data];
             lines.forEach(line => onDraw(line, false));
        } else if (entry.type === 'clear') {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
  }, [history, historyIndex]);

  const onDraw = useCallback((data: DrawData, addToHistory: boolean) => {
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

  const handleClearCanvas = () => {
    if (!session?.user.id) return;
    const newEntry: HistoryEntry = { type: 'clear', senderId: session.user.id };
    
    // Truncate history if we are in the middle of it
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newEntry]);
    setHistoryIndex(newHistory.length);

    broadcastEvent('history-update', { history: [...newHistory, newEntry], index: newHistory.length });
    redrawCanvas();
  };

 const handleUndo = () => {
    if (historyIndex < 0 || !session?.user.id) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    broadcastEvent('history-update', { history, index: newIndex });
    redrawCanvas();
  }

  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || !session?.user.id) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    broadcastEvent('history-update', { history, index: newIndex });
    redrawCanvas();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
        redrawCanvas();
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const context = canvas.getContext('2d');
    if (!context) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas]);

  useEffect(() => {
    if (!sessionId) return;
    const channelName = `presence-whiteboard-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);
    
    const historyUpdateHandler = (data: { history: HistoryEntry[], index: number, senderId: string }) => {
        if (data.senderId !== session?.user.id) {
            setHistory(data.history);
            setHistoryIndex(data.index);
            redrawCanvas();
        }
    };

    channel.bind('history-update', historyUpdateHandler);

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, session?.user.id, redrawCanvas]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    currentPos.current = { x: offsetX, y: offsetY };
    currentLine.current = [];
  };

  const finishDrawing = () => {
    if (!isDrawing || !session?.user.id || currentLine.current.length === 0) {
      setIsDrawing(false);
      return;
    }
    setIsDrawing(false);
    currentPos.current = null;
    
    const newEntry: HistoryEntry = { type: 'draw', data: currentLine.current, senderId: session.user.id };
    
    const newHistory = history.slice(0, historyIndex + 1);
    const finalHistory = [...newHistory, newEntry];

    setHistory(finalHistory);
    const newIndex = finalHistory.length - 1;
    setHistoryIndex(newIndex);
    
    broadcastEvent('history-update', { history: finalHistory, index: newIndex });

    currentLine.current = [];
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current || !currentPos.current) return;
    
    const { offsetX, offsetY } = nativeEvent;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    const data: DrawData = {
      x0: currentPos.current.x / w,
      y0: currentPos.current.y / h,
      x1: offsetX / w,
      y1: offsetY / h,
      color,
      lineWidth,
      tool,
    };
    
    onDraw(data, false);
    currentLine.current.push(data);

    currentPos.current = { x: offsetX, y: offsetY };
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader className='flex-row items-center justify-between'>
        <CardTitle>Tableau Blanc</CardTitle>
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
                 <PopoverContent side="right" className="w-auto p-2">
                    <ThicknessPicker current={lineWidth} onChange={setLineWidth} />
                </PopoverContent>
            </Popover>
            
            <div className="mt-auto flex flex-col gap-2">
                 <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex < 0}>
                    <Undo2 />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                    <Redo2 />
                </Button>
                 <Button variant="destructive" size="icon" onClick={handleClearCanvas}>
                    <Trash2 className='h-4 w-4' />
                    <span className='sr-only'>Effacer le tableau</span>
                </Button>
            </div>
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
