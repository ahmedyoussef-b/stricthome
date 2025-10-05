// src/components/Whiteboard.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Trash2, Pen, Eraser, Palette, Undo2, Redo2, Square, Circle, MousePointer2, Minus, UserCheck } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Slider } from './ui/slider';

interface WhiteboardProps {
  sessionId: string;
  isControlledByCurrentUser: boolean;
  controllerName?: string | null;
}

type Tool = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';

interface Point {
    x: number;
    y: number;
}

interface DrawAction {
    type: 'draw';
    path: Point[];
    color: string;
    lineWidth: number;
}

interface ShapeAction {
    type: 'rectangle' | 'circle' | 'line';
    start: Point;
    end: Point;
    color: string;
    lineWidth: number;
}


type Action = DrawAction | ShapeAction;

interface HistoryEntry {
    id: string;
    senderId: string;
    action: Action;
}


const COLORS = [
  '#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
];

const THICKNESSES = [
    { label: 'Fin', value: 2 },
    { label: 'Moyen', value: 5 },
    { label: 'Épais', value: 10 },
    { label: 'Très épais', value: 20 },
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


export function Whiteboard({ sessionId, isControlledByCurrentUser, controllerName }: WhiteboardProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { data: session } = useSession();

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingAction = useRef<DrawAction | ShapeAction | null>(null);
  const startPoint = useRef<Point | null>(null);

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

  const drawActionOnCanvas = (ctx: CanvasRenderingContext2D, action: Action) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = action.lineWidth;
    ctx.strokeStyle = action.color;
    ctx.globalCompositeOperation = action.type === 'draw' && action.color === '#FFFFFF' ? 'destination-out' : 'source-over';


    if (action.type === 'draw') {
        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        }
        ctx.beginPath();
        action.path.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    } else if (action.type === 'rectangle' || action.type === 'circle' || action.type === 'line') {
        const width = action.end.x - action.start.x;
        const height = action.end.y - action.start.y;
        if (action.type === 'rectangle') {
             ctx.strokeRect(action.start.x, action.start.y, width, height);
        } else if (action.type === 'circle') {
             const radiusX = Math.abs(width) / 2;
             const radiusY = Math.abs(height) / 2;
             const centerX = action.start.x + width / 2;
             const centerY = action.start.y + height / 2;
             ctx.beginPath();
             ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
             ctx.stroke();
        } else if (action.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(action.start.x, action.start.y);
            ctx.lineTo(action.end.x, action.end.y);
            ctx.stroke();
        }
    }
  };


  const redrawCanvas = useCallback((canvas: HTMLCanvasElement | null, upToIndex: number) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i <= upToIndex; i++) {
            if (history[i]) {
                drawActionOnCanvas(ctx, history[i].action);
            }
        }
    }, [history, drawActionOnCanvas, tool]);
    
   useEffect(() => {
        redrawCanvas(mainCanvasRef.current, historyIndex);
   }, [historyIndex, history, redrawCanvas]);

  const pushToHistory = (action: Action) => {
    if (!session?.user?.id) return;
    const newEntry: HistoryEntry = {
        id: `${session.user.id}-${Date.now()}`,
        senderId: session.user.id,
        action,
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    broadcastEvent('history-update', { history: newHistory, index: newHistory.length - 1 });
  };


  const handleClearCanvas = () => {
    setHistory([]);
    setHistoryIndex(-1);
    broadcastEvent('history-update', { history: [], index: -1 });
    redrawCanvas(mainCanvasRef.current, -1);
  };

 const handleUndo = () => {
    if (historyIndex < 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    broadcastEvent('history-update', { history, index: newIndex });
  }

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    broadcastEvent('history-update', { history, index: newIndex });
  }

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isControlledByCurrentUser) return;
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    startPoint.current = point;

    if (tool === 'pen' || tool === 'eraser') {
        drawingAction.current = {
            type: 'draw',
            path: [point],
            color: tool === 'eraser' ? '#FFFFFF' : color,
            lineWidth: lineWidth,
        };
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint.current || !isControlledByCurrentUser) return;
    const currentPoint = getCanvasPoint(e);
    const previewCtx = previewCanvasRef.current?.getContext('2d');
    if (!previewCtx || !previewCanvasRef.current) return;

    previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    
    if (tool === 'pen' || tool === 'eraser') {
        const action = drawingAction.current as DrawAction;
        if (!action) return;
        action.path.push(currentPoint);
        drawActionOnCanvas(previewCtx, action);
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'line') {
        previewCtx.setLineDash([5, 5]);
        const shapeAction: ShapeAction = {
            type: tool,
            start: startPoint.current,
            end: currentPoint,
            color: color,
            lineWidth: lineWidth
        };
        drawActionOnCanvas(previewCtx, shapeAction);
        previewCtx.setLineDash([]);
    }
  };

  const finishDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint.current || !isControlledByCurrentUser) return;
    const endPoint = getCanvasPoint(e);

    const previewCtx = previewCanvasRef.current?.getContext('2d');
    if (previewCtx && previewCanvasRef.current) {
        previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    }

    if (tool === 'pen' || tool === 'eraser') {
        const action = drawingAction.current as DrawAction;
        if (action && action.path.length > 1) {
            pushToHistory(action);
        }
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'line') {
         const shapeAction: ShapeAction = {
            type: tool,
            start: startPoint.current,
            end: endPoint,
            color: color,
            lineWidth: lineWidth
        };
        pushToHistory(shapeAction);
    }
    
    setIsDrawing(false);
    startPoint.current = null;
    drawingAction.current = null;
  };

  useEffect(() => {
    const handleResize = () => {
        [mainCanvasRef.current, previewCanvasRef.current].forEach(canvas => {
            if (canvas) {
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.width = parent.clientWidth;
                    canvas.height = parent.clientHeight;
                }
            }
        });
        redrawCanvas(mainCanvasRef.current, historyIndex);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas, historyIndex]);

  useEffect(() => {
    if (!sessionId) return;
    const channelName = `presence-session-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);
    
    const historyUpdateHandler = (data: { history: HistoryEntry[], index: number, senderId: string }) => {
        if (data.senderId !== session?.user.id) {
            setHistory(data.history);
            setHistoryIndex(data.index);
        }
    };

    channel.bind('history-update', historyUpdateHandler);

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, session?.user.id]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className='flex-row items-center justify-between'>
        <CardTitle>Tableau Blanc</CardTitle>
        {!isControlledByCurrentUser && controllerName && (
            <div className="text-sm text-muted-foreground font-medium flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                <UserCheck className="h-4 w-4" />
                Contrôlé par {controllerName}
            </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-0 relative flex">
         {isControlledByCurrentUser && (
            <div className="p-2 border-r bg-muted/50 flex flex-col gap-1 items-center">
                <Button variant={tool === 'select' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('select')} title="Sélectionner">
                    <MousePointer2 />
                </Button>
                <Button variant={tool === 'pen' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pen')} title="Crayon">
                    <Pen />
                </Button>
                <Button variant={tool === 'eraser' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('eraser')} title="Gomme">
                    <Eraser />
                </Button>
                <Button variant={tool === 'rectangle' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('rectangle')} title="Rectangle">
                    <Square />
                </Button>
                <Button variant={tool === 'circle' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('circle')} title="Cercle">
                    <Circle />
                </Button>
                <Button variant={tool === 'line' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('line')} title="Ligne">
                    <Minus />
                </Button>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" title="Couleur"><Palette /></Button>
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
                        <Button variant="ghost" size="icon" title="Épaisseur">
                            <div className="h-full w-full flex items-center justify-center relative">
                                <div style={{width: `${lineWidth/2}px`, height: `${lineWidth/2}px`}} className="bg-foreground rounded-full"/>
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="right" className="w-auto p-2">
                        <ThicknessPicker current={lineWidth} onChange={setLineWidth} />
                    </PopoverContent>
                </Popover>
                
                <div className="mt-auto flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex < 0} title="Annuler">
                        <Undo2 />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Rétablir">
                        <Redo2 />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleClearCanvas} title="Tout effacer">
                        <Trash2 className='h-4 w-4' />
                    </Button>
                </div>
            </div>
         )}
        <div className="relative w-full h-full">
            <canvas
              ref={mainCanvasRef}
              className="absolute top-0 left-0 h-full w-full touch-none rounded-b-lg"
            />
             <canvas
                ref={previewCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={finishDrawing}
                onMouseLeave={finishDrawing}
                className={cn('absolute top-0 left-0 h-full w-full touch-none rounded-b-lg', 
                    isControlledByCurrentUser && tool === 'pen' && 'cursor-crosshair',
                    isControlledByCurrentUser && tool === 'eraser' && 'cursor-grab',
                    isControlledByCurrentUser && (tool === 'rectangle' || tool === 'circle' || tool === 'line') && 'cursor-crosshair',
                    isControlledByCurrentUser && tool === 'select' && 'cursor-default',
                    !isControlledByCurrentUser && 'cursor-not-allowed'
                )}
            />
        </div>
      </CardContent>
    </Card>
  );
}
