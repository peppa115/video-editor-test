"use client"

import { useRef, useEffect, useState, useCallback } from "react"

export default function VideoEditorPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // 载入视频获取时长
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  // 绘制当前帧
  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setCurrentTime(video.currentTime)

    if (!video.paused && !video.ended) {
      requestAnimationFrame(drawFrame)
    }
  }, [])

  // 点击按钮控制播放/暂停
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
      requestAnimationFrame(drawFrame)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  // 拖拽时间指针
  const handlePointerDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    movePointer(e)
  }

  const handlePointerMove = (e: React.MouseEvent) => {
    if (isDragging) {
      movePointer(e)
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  const movePointer = (e: React.MouseEvent) => {
    if (!timelineRef.current || !videoRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.min(Math.max(x / rect.width, 0), 1)
    const newTime = ratio * duration
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    drawFrame()
  }

  // 指针位置百分比
  const pointerLeft = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex flex-col h-screen">
      {/* 预览区 */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <canvas ref={canvasRef} width={640} height={360} className="border" />
      </div>

      {/* 视频（隐藏播放源，用于抽帧） */}
      <video
        ref={videoRef}
        src="https://cdn.video-ocean.com/video_ocean_backend/2025/06/16/240d988f-3b91-4c0c-964b-aff8353cc337.mp4" // 换成你的视频路径
        onLoadedMetadata={handleLoadedMetadata}
        className="hidden"
      />

      {/* 播放控制 */}
      <div className="flex justify-center items-center py-2 bg-gray-800">
        <button
          onClick={togglePlay}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          {isPlaying ? "暂停" : "播放"}
        </button>
      </div>

      {/* 时间轨道 */}
      <div
        ref={timelineRef}
        className="relative h-24 bg-gray-900 cursor-pointer"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      >
        {/* 时间线背景 */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center">
          <div className="w-full h-[2px] bg-gray-600" />
        </div>

        {/* 指针 */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500"
          style={{ left: `${pointerLeft}%` }}
        />

        {/* 时间刻度（每 10s） */}
        {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 text-white text-xs"
            style={{ left: `${(i * 10 * 100) / duration}%` }}
          >
            {i * 10}s
          </div>
        ))}
      </div>
    </div>
  )
}
