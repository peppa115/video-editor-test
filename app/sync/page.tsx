"use client"

import { useRef, useState, useEffect } from "react"

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 音频管理
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null)
  const gainNode = useRef<GainNode | null>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null) // 背景音乐
  const bgSourceNode = useRef<MediaElementAudioSourceNode | null>(null)
  const voiceBuffer = useRef<AudioBuffer | null>(null) // 视频旁白
  const voiceSource = useRef<AudioBufferSourceNode | null>(null)

  const startTime = useRef<number | null>(null)
  const pauseOffset = useRef<number>(0)
  const rafId = useRef<number | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [volume, setVolume] = useState<number>(1)

  // 加载旁白
  const loadVoice = async () => {
    if (!audioCtx) return
    const res = await fetch("/audio2.mp3")
    const arrBuf = await res.arrayBuffer()
    voiceBuffer.current = await audioCtx.decodeAudioData(arrBuf)
  }

  // 渲染循环
  const startRenderLoop = () => {
    const render = () => {
      if (!videoRef.current || !canvasRef.current || !audioCtx) return
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      if (startTime.current !== null) {
        const t = audioCtx.currentTime - startTime.current
        setCurrentTime(t)
        pauseOffset.current = t
      }
      rafId.current = requestAnimationFrame(render)
    }
    render()
  }

  // Play / Resume
  const startPlayback = async () => {
    if (!audioCtx) {
      const ctx = new AudioContext()
      setAudioCtx(ctx)
      gainNode.current = ctx.createGain()
      gainNode.current.gain.value = volume
      gainNode.current.connect(ctx.destination)

      // 背景音乐
      const bgAudio = new Audio("/audio1.mp3")
      bgAudio.loop = true
      bgAudio.crossOrigin = "anonymous"
      bgAudioRef.current = bgAudio
      const bgNode = ctx.createMediaElementSource(bgAudio)
      bgNode.connect(gainNode.current)
      bgSourceNode.current = bgNode

      // 加载旁白
      await loadVoice()
    }

    if (!audioCtx) return
    if (audioCtx.state === "suspended") await audioCtx.resume()

    // 视频时间与旁白同步
    startTime.current = audioCtx.currentTime - pauseOffset.current
    if (videoRef.current) videoRef.current.currentTime = pauseOffset.current
    await videoRef.current?.play()

    // 播放旁白
    if (voiceBuffer.current) {
      if (voiceSource.current) {
        try { voiceSource.current.stop() } catch {}
        voiceSource.current = null
      }
      const source = audioCtx.createBufferSource()
      source.buffer = voiceBuffer.current
      source.connect(gainNode.current!)

      // 从视频当前时间开始播放旁白
      const offset = pauseOffset.current
      const durationLeft = voiceBuffer.current.duration - offset
      if (durationLeft > 0) {
        source.start(0, offset, durationLeft)
        voiceSource.current = source
      }
    }

    // 播放背景音乐（只 resume，不重复 start）
    if (bgAudioRef.current && bgAudioRef.current.paused) {
      await bgAudioRef.current.play()
    }

    startRenderLoop()
  }

  // Pause
  const pausePlayback = () => {
    if (!audioCtx || !videoRef.current) return
    videoRef.current.pause()
    if (audioCtx.state === "running") audioCtx.suspend()
    if (startTime.current !== null) {
      pauseOffset.current = audioCtx.currentTime - startTime.current
      setCurrentTime(pauseOffset.current)
    }

    // 停止旁白
    if (voiceSource.current) {
      try { voiceSource.current.stop() } catch {}
      voiceSource.current = null
    }

    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
  }

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    pauseOffset.current = t
    setCurrentTime(t)
    if (videoRef.current) videoRef.current.currentTime = t

    // 重新播放旁白到新位置
    if (audioCtx && voiceBuffer.current) {
      if (voiceSource.current) {
        try { voiceSource.current.stop() } catch {}
        voiceSource.current = null
      }
      const source = audioCtx.createBufferSource()
      source.buffer = voiceBuffer.current
      source.connect(gainNode.current!)
      const durationLeft = voiceBuffer.current.duration - t
      if (durationLeft > 0) {
        source.start(0, t, durationLeft)
        voiceSource.current = source
      }
    }
  }

  // 音量调节
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (gainNode.current) gainNode.current.gain.value = v
  }

  return (
    <div className="p-4 space-y-4">
      <video ref={videoRef} src="/demo.mp4" className="hidden"
             onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} crossOrigin="anonymous" />
      <canvas ref={canvasRef} width={480} height={270} className="border rounded" />
      <input type="range" min="0" max={duration || 0} step="0.01"
             value={currentTime} onChange={handleSeek} className="w-full" />
      <div className="flex items-center space-x-2">
        <label>🔊 Volume</label>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume} className="w-40" />
        <span>{Math.round(volume*100)}%</span>
      </div>
      <div className="space-x-2">
        <button onClick={startPlayback} className="px-4 py-2 bg-blue-500 text-white rounded">
          Play / Resume
        </button>
        <button onClick={pausePlayback} className="px-4 py-2 bg-gray-500 text-white rounded">
          Pause
        </button>
      </div>
    </div>
  )
}
