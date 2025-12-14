'use client';
import FramePreviewTrack from '@/components/test/cut-frame';
import { VideoFrameTimeline } from '@/components/test/frame-timeline';
import { useState } from 'react';

// 时间轴缩放计算函数
const sliderMin = 0;
const sliderMax = 9;
const duration = 120; // 视频总长度 120s

function getBaseSecond(sliderValue: number): number {
  const maxSecond = 20;
  const minSecond = 1;

  // 先线性映射
  let value = maxSecond - ((maxSecond - minSecond) / (sliderMax - sliderMin)) * sliderValue;

  // 小于5可以直接返回
  if (value < 5) return value;

  // >=5的值，四舍五入到最接近的 0 或 5
  const remainder = value % 5;

  if (remainder < 2.5) {
    value = value - remainder; // 向下取整到 5 的倍数
  } else {
    value = value - remainder + 5; // 向上取整到 5 的倍数
  }

  return value;
}


function getBaseWidth(sliderValue: number): number {
  const minWidth = 150;
  const maxWidth = 300;
  return minWidth + ((maxWidth - minWidth) / (sliderMax - sliderMin)) * sliderValue;
}

interface TimelineScale {
  baseSecond: number;
  baseWidth: number;
  smallCount: number;
}

// 计算时间轴 scale
function getTimelineScale(sliderValue: number): TimelineScale {
  return {
    baseSecond: getBaseSecond(sliderValue),
    baseWidth: getBaseWidth(sliderValue),
    smallCount: 10,
  };
}

// 时间轴组件
interface TimelineProps {
  scale: TimelineScale;
  duration: number;
}

function Timeline({ scale, duration }: TimelineProps) {
  const { baseSecond, baseWidth, smallCount } = scale;
  const totalGrids = Math.ceil(duration / baseSecond);
  const grids = Array.from({ length: totalGrids });

    const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  return (
    <div className="flex items-end gap-0">
      {grids.map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          {/* 大格 */}
          <div
            // className="border-l border-black"
            style={{ width: `${baseWidth}px`, height: '30px' }}
          ></div>
          {/* 小格 */}
          <div className="flex justify-between w-full">
            {Array.from({ length: smallCount }).map((_, j) => (
              <div
                key={j}
                className="border-l border-gray-300 first:border-black"
                style={{ height: '10px' }}
              ></div>
            ))}
          </div>
          {/* 时间标注 */}
          <div className="text-xs mt-1 w-full">{formatTime(Math.round(i * baseSecond))}</div>
        </div>
      ))}
    </div>
  );
}

// 主组件
export default function TimelineZoomDemo() {
  const [sliderValue, setSliderValue] = useState(0);
  const scale = getTimelineScale(sliderValue);

  return (
    <div className="p-4 space-y-4">
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        value={sliderValue}
        onChange={(e) => setSliderValue(Number(e.target.value))}
        className="w-full"
      />
      <Timeline scale={scale} duration={duration} />
      <div>
        <span className="mr-2">Slider Value:</span> {sliderValue} |{' '}
        <span>Base Second: {scale.baseSecond.toFixed(1)}s</span> |{' '}
        <span>Base Width: {scale.baseWidth.toFixed(1)}px</span>
      </div>
      {/* <FramePreviewTrack scale={sliderValue}></FramePreviewTrack> */}
      <VideoFrameTimeline
            videoUrl="https://cdn.video-ocean.com/vo_serving_data/2025/week_39/97492c9c-620f-43c1-8e6d-431dfa187f86.mp4"
            trackHeight={120}
            frameWidth={212}
          />
    </div>
  );
}
