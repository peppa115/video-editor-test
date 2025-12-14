"use client"
import React, { useState, useRef, useEffect, useCallback, FC, MouseEvent } from 'react';
// 假设 Tailwind CSS 已经加载

// 字幕文本 (示例)
const SAMPLE_TEXT = "你好，世界！这是一个字幕演示组件，它展示了文本如何根据容器的宽度自动进行换行。无论你如何拖动边框，字体大小都不会改变，只有换行效果会变化。";
const FONT_SIZE = 24; // 固定的字体大小
const FONT_FAMILY = 'Inter, sans-serif';

// 定义几何状态的接口
interface GeometryState {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 定义起始数据的接口
interface StartData {
  x: number;
  y: number;
  w: number;
  h: number;
  boxX: number;
  boxY: number;
}

// 定义缩放方向的类型
type ResizeDirection = 'tr' | 'tl' | 'br' | 'bl';

/**
 * 核心函数：在 Canvas 上绘制带边框和阴影的换行文本
 * @param {HTMLCanvasElement} canvas - 目标 Canvas 元素
 * @param {string} text - 要绘制的文本
 * @param {number} maxWidth - 文本的最大宽度 (Canvas 的宽度)
 */
const drawWrappedText = (canvas: HTMLCanvasElement, text: string, maxWidth: number): void => {
  const ctx = canvas.getContext('2d');
  
  // 确保上下文存在
  if (!ctx) return;
  
  // 清空 Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 设置字体样式 (固定大小)
  const font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const lineHeight: number = FONT_SIZE * 1.5; // 行高
  const lines: string[] = [];
  const words: string[] = text.split(''); // 按字符分割，以便精确控制中文字符
  let currentLine: string = '';

  // 1. 文本换行逻辑 (Word Wrap)
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + word;
    const testWidth = ctx.measureText(testLine).width;

    // 如果测试行宽度超过最大宽度，则将当前行推入数组，并开始新行
    if (testWidth > maxWidth && i > 0) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim()); // 推入最后一行

  // 2. 绘制文本
  const startX: number = canvas.width / 2;
  const startY: number = (canvas.height - (lines.length * lineHeight)) / 2; // 垂直居中

  lines.forEach((line, index) => {
    const lineY: number = startY + index * lineHeight;

    // 绘制白色边框/描边 (Stroke Text)
    ctx.strokeStyle = '#000000'; // 黑色边框
    ctx.lineWidth = 4;
    ctx.strokeText(line, startX, lineY);

    // 绘制文本主体 (Fill Text)
    ctx.fillStyle = '#FFFFFF'; // 白色字幕
    ctx.fillText(line, startX, lineY);
  });
};

const SubtitleResize2: FC = () => {
  // 基础状态：控制字幕框的位置和尺寸
  const [geometry, setGeometry] = useState<GeometryState>({
    x: 100,
    y: 100,
    width: 500,
    height: 120,
  });

  // 新增状态：控制字幕框是否被选中（显示边框和手柄）
  const [isSelected, setIsSelected] = useState<boolean>(true);

  // Ref 类型定义
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 交互状态
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<ResizeDirection | null>(null);
  // StartData 包含拖拽和缩放所需的初始几何数据
  const [startData, setStartData] = useState<StartData>({ x: 0, y: 0, w: 0, h: 0, boxX: 0, boxY: 0 });

  // =================================
  // 1. Canvas 绘制效果
  // =================================

  const renderCanvas = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 调整 Canvas 元素的实际尺寸以匹配容器
    canvas.width = geometry.width;
    canvas.height = geometry.height;

    // 只有宽度变化会影响换行
    drawWrappedText(canvas, SAMPLE_TEXT, geometry.width * 0.9); // 留出 10% 的边距
  }, [geometry.width, geometry.height]);

  useEffect(() => {
    // 在 geometry 变化时重新绘制 Canvas
    renderCanvas();
  }, [geometry.width, geometry.height, renderCanvas]);
  
  // =================================
  // 2. 外部点击 (Deselect) 逻辑
  // =================================
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent): void => {
      // 检查点击事件是否发生在容器外部
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // 如果当前是选中的状态，则取消选中
        if (isSelected) {
            setIsSelected(false);
        }
      }
    };

    // 监听全局 mousedown 事件
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelected]); // 依赖 isSelected 以获取最新状态

  // =================================
  // 3. 拖拽 (Dragging) 逻辑
  // =================================

  const handleDragStart = (e: MouseEvent<HTMLDivElement>): void => {
    if (isResizing) return; // 如果正在缩放，不启动拖拽
    
    setIsSelected(true); // 点击容器时，确保它是选中状态

    setIsDragging(true);
    
    // 记录鼠标初始位置和框的初始位置
    setStartData({
      x: e.clientX,
      y: e.clientY,
      w: geometry.width,
      h: geometry.height,
      boxX: geometry.x,
      boxY: geometry.y,
    });
  };
  
  // =================================
  // 4. 缩放 (Resizing) 逻辑
  // =================================

  const handleResizeStart = (e: MouseEvent<HTMLDivElement>, direction: ResizeDirection): void => {
    e.stopPropagation(); // 阻止事件冒泡到父级，防止同时触发拖拽
    setIsResizing(direction);

    // 记录鼠标初始位置和框的初始几何属性
    setStartData({
      x: e.clientX,
      y: e.clientY,
      w: geometry.width,
      h: geometry.height,
      boxX: geometry.x,
      boxY: geometry.y,
    });
  };

  // =================================
  // 5. 全局 Mouse Events 监听 (拖拽/缩放移动和结束)
  // =================================

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent): void => {
      const dx: number = e.clientX - startData.x;
      const dy: number = e.clientY - startData.y;

      if (isDragging) {
        // 更新位置
        setGeometry(prev => ({
          ...prev,
          x: startData.boxX + dx,
          y: startData.boxY + dy,
        }));
      } else if (isResizing) {
        // 更新尺寸和位置
        setGeometry(prev => {
          let newX: number = prev.x;
          let newY: number = prev.y;
          let newW: number = prev.width;
          let newH: number = prev.height;
          
          const minSize: number = 100; // 最小尺寸限制

          // 根据不同的角来计算新的几何属性
          switch (isResizing) {
            case 'br': // 右下角 (Right-Bottom)
              newW = Math.max(minSize, startData.w + dx);
              newH = Math.max(minSize, startData.h + dy);
              break;
            case 'bl': // 左下角 (Left-Bottom)
              newW = Math.max(minSize, startData.w - dx);
              newH = Math.max(minSize, startData.h + dy);
              newX = startData.boxX + dx;
              if (newW === minSize) newX = startData.boxX + startData.w - minSize; // 最小尺寸边界修正
              break;
            case 'tr': // 右上角 (Top-Right)
              newW = Math.max(minSize, startData.w + dx);
              newH = Math.max(minSize, startData.h - dy);
              newY = startData.boxY + dy;
              if (newH === minSize) newY = startData.boxY + startData.h - minSize; // 最小尺寸边界修正
              break;
            case 'tl': // 左上角 (Top-Left)
              newW = Math.max(minSize, startData.w - dx);
              newH = Math.max(minSize, startData.h - dy);
              newX = startData.boxX + dx;
              newY = startData.boxY + dy;
              if (newW === minSize) newX = startData.boxX + startData.w - minSize;
              if (newH === minSize) newY = startData.boxY + startData.h - minSize;
              break;
            default:
              return prev;
          }

          // 返回新的几何属性，确保位置和尺寸正确关联
          return { x: newX, y: newY, width: newW, height: newH };
        });
      }
    };

    const handleMouseUp = (): void => {
      setIsDragging(false);
      setIsResizing(null);
    };

    // 注册全局事件监听器
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      // 清理事件监听器
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, startData]);


  // 根据当前交互状态设置鼠标样式
  const getCursor = (): string => {
    if (isResizing) {
      if (isResizing.includes('t') && isResizing.includes('l')) return 'nwse-resize';
      if (isResizing.includes('t') && isResizing.includes('r')) return 'nesw-resize';
      if (isResizing.includes('b') && isResizing.includes('l')) return 'nesw-resize';
      if (isResizing.includes('b') && isResizing.includes('r')) return 'nwse-resize';
    }
    // 当选中时，显示抓取手势，否则显示默认
    return isDragging ? 'grabbing' : isSelected ? 'grab' : 'default'; 
  };
  
  // 缩放手柄组件
  const ResizeHandle: FC<{ direction: ResizeDirection }> = ({ direction }) => (
    <div
      className={`absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg cursor-${
        direction.includes('t') && direction.includes('l') ? 'nwse' :
        direction.includes('t') && direction.includes('r') ? 'nesw' :
        direction.includes('b') && direction.includes('l') ? 'nesw' :
        'nwse'
      }-resize z-20`}
      style={{
        top: direction.includes('t') ? '-6px' : direction.includes('b') ? 'auto' : '50%',
        bottom: direction.includes('b') ? '-6px' : 'auto',
        left: direction.includes('l') ? '-6px' : direction.includes('r') ? 'auto' : '50%',
        right: direction.includes('r') ? '-6px' : 'auto',
      }}
      onMouseDown={(e: MouseEvent<HTMLDivElement>) => handleResizeStart(e, direction)}
    />
  );

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">Canvas 字幕编辑器演示 (TypeScript)</h1>
      <p className="mb-8 text-center text-gray-600">
        拖动中央区域可移动，拖动红色小圆点可缩放。注意观察文字换行效果随宽度变化，但字体大小始终保持 {FONT_SIZE}px。
        <strong className='text-blue-500'>点击边框外的任何区域，边框和手柄将消失。</strong>
      </p>

      {/* 拖拽和缩放的容器 */}
      <div
        ref={containerRef}
        className="relative shadow-2xl transition-shadow duration-300 ease-in-out"
        style={{
          position: 'absolute',
          left: geometry.x,
          top: geometry.y,
          width: geometry.width,
          height: geometry.height,
          // 边框效果 (由 DIV 绘制)，根据 isSelected 状态显示或隐藏
          border: isSelected ? '4px solid #4F46E5' : '4px solid transparent', 
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', // 半透明背景
          cursor: getCursor(),
          zIndex: isSelected ? 10 : 1, // 选中时提升层级
        }}
        onMouseDown={handleDragStart}
      >
        {/* 核心 Canvas 区域 */}
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ 
            borderRadius: '4px',
            // Canvas 本身透明，仅用于渲染文字
            backgroundColor: 'transparent'
          }}
        />

        {/* 四角缩放手柄 - 仅在选中时渲染 */}
        {isSelected && (
          <>
            <ResizeHandle direction="tl" />
            <ResizeHandle direction="tr" />
            <ResizeHandle direction="bl" />
            <ResizeHandle direction="br" />
          </>
        )}
      </div>

      {/* 底部信息卡片 */}
      <div className="fixed bottom-0 w-full p-4 bg-white shadow-inner text-sm text-gray-500">
        <div className="max-w-xl mx-auto flex justify-between">
          <span>X: {Math.round(geometry.x)} | Y: {Math.round(geometry.y)}</span>
          <span>W: {Math.round(geometry.width)} | H: {Math.round(geometry.height)}</span>
          <span>选中状态: {isSelected ? '是' : '否'}</span>
        </div>
      </div>
    </div>
  );
};

export default SubtitleResize2;
