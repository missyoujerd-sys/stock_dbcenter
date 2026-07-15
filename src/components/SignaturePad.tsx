import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onEnd: (signatureDataUrl: string) => void;
  initialSignature?: string;
  readOnly?: boolean;
}

export default function SignaturePad({ onEnd, initialSignature, readOnly = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && initialSignature) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = initialSignature;
      }
    }
  }, [initialSignature]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    // Prevent scrolling when touching the canvas
    if (e.type === 'touchstart') {
      // It's a bit tricky to prevent default in React synthetic events for touch,
      // usually handled by CSS touch-action: none.
    }
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onEnd(canvas.toDataURL('image/png'));
    }
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.PointerEvent<HTMLCanvasElement>).clientX;
      clientY = (e as React.PointerEvent<HTMLCanvasElement>).clientY;
    }

    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onEnd(''); // Pass empty string to clear
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="border-b-2 border-dashed border-slate-300 w-full relative mb-1 flex justify-center bg-slate-50/50 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={300}
          height={80}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
          className="cursor-crosshair w-full"
        />
        {readOnly && initialSignature && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/50">
                {/* Visual feedback if readonly and signed */}
            </div>
        )}
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={clearCanvas}
          className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
        >
          [ล้างลายเซ็น]
        </button>
      )}
    </div>
  );
}
