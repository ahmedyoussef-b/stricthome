

// src/components/Whiteboard.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { pusherClient } from '@/lib/pusher/client';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { 
  Trash2, 
  Pen, 
  Eraser, 
  Palette, 
  Undo2, 
  Redo2, 
  Square, 
  Circle, 
  MousePointer2, 
  Minus, 
  UserCheck,
  ZoomIn,
  ZoomOut,
  Navigation,
  Hand
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';

interface WhiteboardProps {
  sessionId: string;
  isControlledByCurrentUser: boolean;
  controllerName?: string | null;
}

type Tool = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'pan';

interface Point {
  x: number;
  y: number;
}

interface ViewportState {
  x: number;
  y: number;
  scale: number;
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
];

// Ramer-Douglas-Peucker algorithm for path simplification
function simplifyPath(points: Point[], tolerance: number): Point[] {
    if (points.length < 3) return points;

    const getSquareDistance = (p1: Point, p2: Point) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;

    const getSquareSegmentDistance = (p: Point, p1: Point, p2: Point) => {
        let { x, y } = p1;
        let dx = p2.x - x;
        let dy = p2.y - y;

        if (dx !== 0 || dy !== 0) {
            const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                ({ x, y } = p2);
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p.x - x;
        dy = p.y - y;

        return dx * dx + dy * dy;
    };

    const simplifyRecursive = (start: number, end: number): Point[] => {
        let maxSqDist = 0;
        let index = 0;

        for (let i = start + 1; i < end; i++) {
            const sqDist = getSquareSegmentDistance(points[i], points[start], points[end]);
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > tolerance * tolerance) {
            const left = simplifyRecursive(start, index);
            const right = simplifyRecursive(index, end);
            return left.slice(0, -1).concat(right);
        } else {
            return [points[start], points[end]];
        }
    };

    return simplifyRecursive(0, points.length - 1);
}


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
              <div className="rounded-full bg-foreground" style={{width: `${'value'}px`, height: `${'value'}px`}} />
            </div>
            <span className="text-xs">{label}</span>
          </div>
        </Button>
      ))}
    </div>
  );
}

export function Whiteboard({ sessionId, isControlledByCurrentUser, controllerName }: WhiteboardProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingAction = useRef<DrawAction | ShapeAction | null>(null);
  const startPoint = useRef<Point | null>(null);
  const lastPanPoint = useRef<Point | null>(null);

  const broadcastEvent = useCallback(async (event: string, data: any) => {
    try {
      await fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, event, data }),
        keepalive: true,
      });
    } catch (error) {
      console.error(`❌ [Whiteboard] Échec de la diffusion de l'événement ${event}:`, error);
    }
  }, [sessionId]);

  const drawActionOnCanvas = (ctx: CanvasRenderingContext2D, action: Action) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = action.lineWidth;
    ctx.strokeStyle = action.color;
    
    if (action.type === 'draw') {
      ctx.globalCompositeOperation = action.color === '#FFFFFF' ? 'destination-out' : 'source-over';
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

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 50;
    
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1 / viewport.scale;
    
    const startX = Math.floor(-viewport.x / viewport.scale / gridSize) * gridSize;
    const startY = Math.floor(-viewport.y / viewport.scale / gridSize) * gridSize;
    const endX = startX + (width / viewport.scale) + gridSize;
    const endY = startY + (height / viewport.scale) + gridSize;
    
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }, [viewport.scale, viewport.x, viewport.y]);


  const redrawCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);
    
    drawGrid(ctx, canvas.width, canvas.height);
    
    for (let i = 0; i <= historyIndex; i++) {
      if (history[i]) {
        drawActionOnCanvas(ctx, history[i].action);
      }
    }
    
    ctx.restore();
  }, [history, historyIndex, viewport, drawGrid]);


  const pushToHistory = (action: Action) => {
    if (!session?.user?.id) return;

    if (action.type === 'draw' && action.path.length > 2) {
        action.path = simplifyPath(action.path, 1.5);
    }

    const newEntry: HistoryEntry = {
      id: `${session.user.id}-${Date.now()}`,
      senderId: session.user.id,
      action,
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    broadcastEvent('new-action', newEntry);
  };

  const handleClearCanvas = () => {
    setHistory([]);
    setHistoryIndex(-1);
    broadcastEvent('clear-history', {});
  };

  const handleUndo = () => {
    if (historyIndex < 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    broadcastEvent('index-update', { index: newIndex });
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    broadcastEvent('index-update', { index: newIndex });
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;
    
    return { x, y };
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    setViewport(prev => {
      let newScale = prev.scale;
      
      switch (direction) {
        case 'in':
          newScale = Math.min(5, prev.scale * 1.2);
          break;
        case 'out':
          newScale = Math.max(0.1, prev.scale / 1.2);
          break;
        case 'reset':
          return { x: 0, y: 0, scale: 1 };
      }
      
      return { ...prev, scale: newScale };
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!isControlledByCurrentUser) return;
    
    e.preventDefault();
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * zoomIntensity);
    
    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale * zoom))
    }));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isControlledByCurrentUser) return;
    
    const point = getCanvasPoint(e);
    
    if (tool === 'pan') {
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
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
    if (!isControlledByCurrentUser) return;
    
    if (isPanning && lastPanPoint.current) {
      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;
      
      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    if (!isDrawing || !startPoint.current) return;
    
    const currentPoint = getCanvasPoint(e);
    const previewCtx = previewCanvasRef.current?.getContext('2d');
    if (!previewCtx || !previewCanvasRef.current) return;

    previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    
    previewCtx.save();
    previewCtx.translate(viewport.x, viewport.y);
    previewCtx.scale(viewport.scale, viewport.scale);
    
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
    
    previewCtx.restore();
  };

  const finishDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      lastPanPoint.current = null;
      return;
    }
    
    if (!isDrawing || !startPoint.current) return;
    
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

  const setupCanvas = useCallback(() => {
    [mainCanvasRef.current, previewCanvasRef.current].forEach(canvas => {
      if (canvas && containerRef.current) {
        const parent = containerRef.current;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    });
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    setupCanvas();
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);
  
  useEffect(() => {
      redrawCanvas();
  }, [historyIndex, redrawCanvas, viewport]);

  useEffect(() => {
    if (!sessionId) return;
    const channelName = `presence-session-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);
    
    const newActionHandler = (newEntry: HistoryEntry) => {
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newEntry]);
        setHistoryIndex(prev => prev + 1);
    };

    const clearHistoryHandler = () => {
        setHistory([]);
        setHistoryIndex(-1);
    };
    
    const indexUpdateHandler = (data: { index: number }) => {
        setHistoryIndex(data.index);
    };

    channel.bind('new-action', newActionHandler);
    channel.bind('clear-history', clearHistoryHandler);
    channel.bind('index-update', indexUpdateHandler);

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, historyIndex]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      handleWheel(e as any);
    };

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlledByCurrentUser]);

  const getCursor = () => {
    if (!isControlledByCurrentUser) return 'not-allowed';
    if (tool === 'pan' || isPanning) return 'grab';
    if (tool === 'pen' || tool === 'eraser') return 'crosshair';
    if (tool === 'rectangle' || tool === 'circle' || tool === 'line') return 'crosshair';
    return 'default';
  };

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
      <CardContent className="flex-1 p-0 relative flex">
        {isControlledByCurrentUser ? (
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
            <Button variant={tool === 'pan' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pan')} title="Déplacer">
              <Hand />
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
        ) : (
          <div className="p-2 border-r bg-muted/30 flex flex-col gap-1 items-center justify-center">
            <div className="text-xs text-muted-foreground text-center">
              <UserCheck className="h-4 w-4 mx-auto mb-1" />
              En observation
            </div>
          </div>
        )}

        <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-white">
          <canvas
            ref={mainCanvasRef}
            className="absolute top-0 left-0 h-full w-full touch-none"
            style={{ cursor: getCursor() }}
          />
          <canvas
            ref={previewCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={finishDrawing}
            onMouseLeave={finishDrawing}
            // onWheel is handled by useEffect
            className="absolute top-0 left-0 h-full w-full touch-none"
            style={{ cursor: getCursor() }}
          />
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-background/80 p-2 rounded-lg border">
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => handleZoom('in')} title="Zoomer">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleZoom('out')} title="Dézoomer">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleZoom('reset')} title="Reset vue">
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-center px-2 py-1 bg-muted rounded">
              {Math.round(viewport.scale * 100)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
