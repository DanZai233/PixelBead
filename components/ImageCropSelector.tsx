import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCropSelectorProps {
  imageSrc: string;
  gridWidth: number;
  gridHeight: number;
  onConfirm: (x: number, y: number, width: number, height: number) => void;
  onCancel: () => void;
}

export const ImageCropSelector: React.FC<ImageCropSelectorProps> = ({
  imageSrc,
  gridWidth,
  gridHeight,
  onConfirm,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [createStart, setCreateStart] = useState({ x: 0, y: 0 });

  const handleSize = 600;
  const cornerSize = 15;

  const loadImage = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      setImageInfo({ width: img.width, height: img.height });

      // 计算初始显示缩放比例，使图片适应画布
      const canvasWidth = containerRef.current?.clientWidth || handleSize;
      const canvasHeight = containerRef.current?.clientHeight || handleSize;
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const initialScale = Math.min(scaleX, scaleY, 1);

      setScale(initialScale);

      // 初始不设置裁切框，让用户自己选择
      setCrop(null);
      setPanOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, gridWidth, gridHeight]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageInfo) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = containerRef.current?.clientWidth || handleSize;
    const canvasHeight = containerRef.current?.clientHeight || handleSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制图片
    const displayWidth = imageInfo.width * scale;
    const displayHeight = imageInfo.height * scale;
    const displayX = (canvasWidth - displayWidth) / 2 + panOffset.x;
    const displayY = (canvasHeight - displayHeight) / 2 + panOffset.y;

    ctx.save();
    ctx.drawImage(
      canvasRef.current ? new Image() : new Image(),
      displayX,
      displayY,
      displayWidth,
      displayHeight
    );
    ctx.restore();

    // 绘制裁切区域（需要重新加载图片）
    const img = new Image();
    img.src = imageSrc;
    ctx.drawImage(
      img,
      0,
      0,
      imageInfo.width,
      imageInfo.height,
      displayX,
      displayY,
      displayWidth,
      displayHeight
    );

    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0,0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 如果没有裁切框，直接显示提示文字
    if (!crop) {
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('在图片上拖动创建选区', canvasWidth / 2, canvasHeight / 2);
      return;
    }

    // 清除裁切区域的遮罩
    const cropDisplayX = displayX + crop.x * scale;
    const cropDisplayY = displayY + crop.y * scale;
    const cropDisplayWidth = crop.width * scale;
    const cropDisplayHeight = crop.height * scale;

    ctx.clearRect(cropDisplayX, cropDisplayY, cropDisplayWidth, cropDisplayHeight);

    // 重新绘制裁切区域的图片
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      cropDisplayX,
      cropDisplayY,
      cropDisplayWidth,
      cropDisplayHeight
    );

    // 绘制裁切框边框
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.strokeRect(cropDisplayX, cropDisplayY, cropDisplayWidth, cropDisplayHeight);

    // 绘制网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    const gridCols = Math.min(10, gridWidth);
    const gridRows = Math.min(10, gridHeight);
    for (let i = 1; i < gridCols; i++) {
      const x = cropDisplayX + (cropDisplayWidth * i) / gridCols;
      ctx.beginPath();
      ctx.moveTo(x, cropDisplayY);
      ctx.lineTo(x, cropDisplayY + cropDisplayHeight);
      ctx.stroke();
    }
    for (let i = 1; i < gridRows; i++) {
      const y = cropDisplayY + (cropDisplayHeight * i) / gridRows;
      ctx.beginPath();
      ctx.moveTo(cropDisplayX, y);
      ctx.lineTo(cropDisplayX + cropDisplayWidth, y);
      ctx.stroke();
    }

    // 绘制角标
    const cornerSize = 12;
    ctx.fillStyle = '#6366f1';
    const corners = [
      { x: cropDisplayX, y: cropDisplayY },
      { x: cropDisplayX + cropDisplayWidth, y: cropDisplayY },
      { x: cropDisplayX, y: cropDisplayY + cropDisplayHeight },
      { x: cropDisplayX + cropDisplayWidth, y: cropDisplayY + cropDisplayHeight },
    ];
    corners.forEach((h) => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, cornerSize / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [imageInfo, crop, scale, panOffset, imageSrc, gridWidth, gridHeight, handleSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

   const handleMouseDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageInfo) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvasWidth = containerRef.current?.clientWidth || handleSize;
    const canvasHeight = containerRef.current?.clientHeight || handleSize;
    const displayWidth = imageInfo.width * scale;
    const displayHeight = imageInfo.height * scale;
    const displayX = (canvasWidth - displayWidth) / 2 + panOffset.x;
    const displayY = (canvasHeight - displayHeight) / 2 + panOffset.y;

    // 如果没有裁切框，开始创建新的裁切框
    if (!crop) {
      setIsCreating(true);
      setCreateStart({ x, y });
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const cropDisplayX = displayX + crop.x * scale;
    const cropDisplayY = displayY + crop.y * scale;
    const cropDisplayWidth = crop.width * scale;
    const cropDisplayHeight = crop.height * scale;

    // 检查是否点击了角标
    if (
      Math.abs(x - cropDisplayX) < cornerSize &&
      Math.abs(y - cropDisplayY) < cornerSize
    ) {
      setIsResizing(true);
      setResizeHandle('top-left');
      return;
    }
    if (
      Math.abs(x - (cropDisplayX + cropDisplayWidth)) < cornerSize &&
      Math.abs(y - cropDisplayY) < cornerSize
    ) {
      setIsResizing(true);
      setResizeHandle('top-right');
      return;
    }
    if (
      Math.abs(x - cropDisplayX) < cornerSize &&
      Math.abs(y - (cropDisplayY + cropDisplayHeight)) < cornerSize
    ) {
      setIsResizing(true);
      setResizeHandle('bottom-left');
      return;
    }
    if (
      Math.abs(x - (cropDisplayX + cropDisplayWidth)) < cornerSize &&
      Math.abs(y - (cropDisplayY + cropDisplayHeight)) < cornerSize
    ) {
      setIsResizing(true);
      setResizeHandle('top-left');
      return;
    }
    if (
      Math.abs(x - (cropDisplayX + cropDisplayWidth)) < handleSize &&
      Math.abs(y - cropDisplayY) < handleSize
    ) {
      setIsResizing(true);
      setResizeHandle('top-right');
      return;
    }
    if (
      Math.abs(x - cropDisplayX) < handleSize &&
      Math.abs(y - (cropDisplayY + cropDisplayHeight)) < handleSize
    ) {
      setIsResizing(true);
      setResizeHandle('bottom-left');
      return;
    }
    if (
      Math.abs(x - (cropDisplayX + cropDisplayWidth)) < handleSize &&
      Math.abs(y - (cropDisplayY + cropDisplayHeight)) < handleSize
    ) {
      setIsResizing(true);
      setResizeHandle('bottom-right');
      return;
    }

    // 检查是否在裁切框内
    if (
      x >= cropDisplayX &&
      x <= cropDisplayX + cropDisplayWidth &&
      y >= cropDisplayY &&
      y <= cropDisplayY + cropDisplayHeight
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropDisplayX, y: y - cropDisplayY });
    } else {
      // 在图片外部拖动，平移图片
      setIsDragging(true);
      setResizeHandle('pan');
      setDragStart({ x, y });
    }
  };

   const handleMouseMove = (e: React.PointerEvent) => {
     if (!imageInfo) return;

    // 处理创建选区
    if (isCreating) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const canvasWidth = containerRef.current?.clientWidth || handleSize;
      const canvasHeight = containerRef.current?.clientHeight || handleSize;
      const displayWidth = imageInfo.width * scale;
      const displayHeight = imageInfo.height * scale;
      const displayX = (canvasWidth - displayWidth) / 2 + panOffset.x;
      const displayY = (canvasHeight - displayHeight) / 2 + panOffset.y;

      // 计算选区
      const startX = Math.max(displayX, Math.min(createStart.x, mouseX));
      const startY = Math.max(displayY, Math.min(createStart.y, mouseY));
      const endX = Math.min(displayX + displayWidth, Math.max(createStart.x, mouseX));
      const endY = Math.min(displayY + displayHeight, Math.max(createStart.y, mouseY));

      const newCropX = (startX - displayX) / scale;
      const newCropY = (startY - displayY) / scale;
      const newCropWidth = (endX - startX) / scale;
      const newCropHeight = (endY - startY) / scale;

      // 保持宽高比
      const targetRatio = gridWidth / gridHeight;
      let finalCropX = newCropX;
      let finalCropY = newCropY;
      let finalCropWidth = newCropWidth;
      let finalCropHeight = newCropHeight;

      const currentRatio = newCropWidth / newCropHeight;
      if (currentRatio > targetRatio) {
        finalCropHeight = newCropWidth / targetRatio;
      } else {
        finalCropWidth = newCropHeight * targetRatio;
      }

      setCrop({
        x: finalCropX,
        y: finalCropY,
        width: finalCropWidth,
        height: finalCropHeight,
      });
      return;
    }

    if (isResizing && resizeHandle && !isDragging) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const canvasWidth = containerRef.current?.clientWidth || handleSize;
      const canvasHeight = containerRef.current?.clientHeight || handleSize;
      const displayWidth = imageInfo.width * scale;
      const displayHeight = imageInfo.height * scale;
      const displayX = (canvasWidth - displayWidth) / 2 + panOffset.x;
      const displayY = (canvasHeight - displayHeight) / 2 + panOffset.y;

      const newCrop = { ...crop };

      switch (resizeHandle) {
        case 'top-left':
          newCrop.x = Math.max(0, (mouseX - displayX) / scale);
          newCrop.y = Math.max(0, (mouseY - displayY) / scale);
          newCrop.width = crop.x + crop.width - newCrop.x;
          newCrop.height = crop.y + crop.height - newCrop.y;
          break;
        case 'top-right':
          newCrop.y = Math.max(0, (mouseY - displayY) / scale);
          newCrop.width = (mouseX - displayX) / scale - newCrop.x;
          newCrop.height = crop.y + crop.height - newCrop.y;
          break;
        case 'bottom-left':
          newCrop.x = Math.max(0, (mouseX - displayX) / scale);
          newCrop.width = crop.x + crop.width - newCrop.x;
          newCrop.height = (mouseY - displayY) / scale - newCrop.y;
          break;
        case 'bottom-right':
          newCrop.width = (mouseX - displayX) / scale - newCrop.x;
          newCrop.height = (mouseY - displayY) / scale - newCrop.y;
          break;
      }

      // 保持宽高比
      const targetRatio = gridWidth / gridHeight;
      if (resizeHandle === 'bottom-right' || resizeHandle === 'top-left') {
        const ratio = newCrop.width / newCrop.height;
        if (ratio > targetRatio) {
          newCrop.height = newCrop.width / targetRatio;
        } else {
          newCrop.width = newCrop.height * targetRatio;
        }
      }

      // 确保不超出图片边界
      newCrop.width = Math.min(newCrop.width, imageInfo.width - newCrop.x);
      newCrop.height = Math.min(newCrop.height, imageInfo.height - newCrop.y);

      // 最小尺寸限制
      newCrop.width = Math.max(newCrop.width, 10);
      newCrop.height = Math.max(newCrop.height, 10);

      setCrop(newCrop);
    } else if (isDragging) {
      if (resizeHandle === 'pan') {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const canvasWidth = containerRef.current?.clientWidth || handleSize;
        const canvasHeight = containerRef.current?.clientHeight || handleSize;
        const displayWidth = imageInfo.width * scale;
        const displayHeight = imageInfo.height * scale;
        const displayX = (canvasWidth - displayWidth) / 2 + panOffset.x;
        const displayY = (canvasHeight - displayHeight) / 2 + panOffset.y;

        const newCropX = (mouseX - displayX - dragStart.x) / scale;
        const newCropY = (mouseY - displayY - dragStart.y) / scale;

        setCrop(prev => ({
          ...prev,
          x: Math.max(0, Math.min(newCropX, imageInfo.width - prev.width)),
          y: Math.max(0, Math.min(newCropY, imageInfo.height - prev.height)),
        }));
      }
    }
  };

   const handleMouseUp = () => {
     setIsDragging(false);
     setIsResizing(false);
     setIsCreating(false);
     setResizeHandle(null);
   };

   const handleResetCrop = () => {
     setCrop(null);
   };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

   const handleConfirm = () => {
     if (!crop) return;
     onConfirm(crop.x, crop.y, crop.width, crop.height);
   };

  if (!imageInfo) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 max-w-lg w-full shadow-2xl">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">加载图片中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 max-w-4xl w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">裁切选择</h3>
            <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
              选择要转换的区域 ({gridWidth}×{gridHeight})
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative bg-slate-100 rounded-2xl overflow-hidden"
          style={{ height: 'min(500px, 60vh)' }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handleMouseDown}
            onPointerMove={handleMouseMove}
            onPointerUp={handleMouseUp}
            onPointerLeave={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full cursor-crosshair touch-none"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold">
            {crop ? '拖动裁切框 • 拖动角标调整大小' : '在图片上拖动创建选区'}
          </div>
        </div>

         <div className="flex items-center gap-4 text-xs md:text-sm text-slate-600">
           <div className="flex items-center gap-2">
             <span className="font-bold">图片尺寸:</span>
             <span className="font-mono">{imageInfo.width} × {imageInfo.height}</span>
           </div>
           <div className="h-4 w-px bg-slate-300"></div>
           <div className="flex items-center gap-2">
             <span className="font-bold">裁切区域:</span>
             <span className="font-mono">{crop ? `${Math.round(crop.width)} × ${Math.round(crop.height)}` : '未选择'}</span>
           </div>
           <div className="h-4 w-px bg-slate-300"></div>
           <div className="flex items-center gap-2">
             <span className="font-bold">缩放:</span>
             <span className="font-mono">{Math.round(scale * 100)}%</span>
           </div>
         </div>

         <div className="flex gap-3">
           {crop && (
             <button
               onClick={handleResetCrop}
               className="py-3 md:py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
             >
               重新选区
             </button>
           )}
           <button
             onClick={onCancel}
             className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-500 rounded-xl md:rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
           >
             取消
           </button>
           <button
             onClick={handleConfirm}
             disabled={!crop}
             className="flex-[2] py-3 md:py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-xl md:rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
           >
             确认并转换
           </button>
         </div>
      </div>
    </div>
  );
};
