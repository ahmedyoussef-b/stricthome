// src/components/chatroom/session/Whiteboard.tsx
'use client';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eraser } from 'lucide-react';

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions to match container
    const container = canvas.parentElement;
    if (container) {
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
    }

    const context = canvas.getContext('2d');
    if (!context) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;
  }, []);

  useEffect(() => {
    const context = contextRef.current;
    if (context) {
        context.strokeStyle = color;
        context.lineWidth = brushSize;
    }
  }, [color, brushSize]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex-shrink-0 flex items-center justify-center gap-4 p-2 rounded-lg bg-card border">
        <div className="flex items-center gap-2">
            <label htmlFor="color-picker" className="text-sm">Couleur:</label>
            <Input id="color-picker" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 p-1" />
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="brush-size" className="text-sm">Taille:</label>
            <Input id="brush-size" type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-32" />
        </div>
        <Button variant="outline" onClick={clearCanvas}>
          <Eraser className="w-4 h-4 mr-2" />
          Effacer
        </Button>
      </div>
      <div className="flex-1 bg-white rounded-lg shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing} // Stop drawing if mouse leaves canvas
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
