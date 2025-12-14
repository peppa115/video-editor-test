"use client"

import { useState, useCallback } from "react"
import { VideoPreview } from "@/components/video-preview"
import { Timeline } from "@/components/timeline"
import { PlaybackControls } from "@/components/playback-controls"
import { TimelineZoomControl } from "@/components/timeline-zoom-control"
import { SubtitleTrack } from "@/components/subtitle-track"
import { VideoTrack } from "@/components/video-track"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Subtitle {
  id: string
  start: number
  end: number
  text: string
}

interface VideoClip {
  id: string
  src: string
  name: string
  start: number
  end: number
  duration: number
  offset: number
}

export default function VideoEditor() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [trackStart, setTrackStart] = useState(0)
  const [trackEnd, setTrackEnd] = useState(30)
  const [zoomLevel, setZoomLevel] = useState(50)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([
    { id: "1", start: 2, end: 5, text: "Welcome to the video editor" },
    { id: "2", start: 6, end: 10, text: "You can drag the timeline to navigate" },
    { id: "3", start: 12, end: 16, text: "The orange handles control the active track" },
  ])

  const [videoClips, setVideoClips] = useState<VideoClip[]>([])

  const videoSrc = "https://cdn.video-ocean.com/video_ocean_backend/2025/06/16/87bbca41-420e-4cf0-ae07-905390a7e29a.mp4"

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleLoadedMetadata = useCallback((videoDuration: number) => {
    setDuration(videoDuration)

    console.log("%c Line:59 🍞", "color:#42b983", Math.min(30, videoDuration));
    // setTrackEnd(Math.min(30, videoDuration))
    setTrackEnd(((prev) => {
      return Math.min(30, videoDuration + prev)
    }))
  }, [])

  const handleTrackChange = useCallback(
    (start: number, end: number) => {
      console.log("%c Line:68 🍑 end", "color:#93c0a4", end);
      setTrackStart(start)
      setTrackEnd(end)

      if (currentTime < start || currentTime > end) {
        setCurrentTime(start)
      }
    },
    [currentTime],
  )

  const handlePlaybackEnd = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(trackStart, currentTime - 5)
    setCurrentTime(newTime)
  }, [currentTime, trackStart])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(trackEnd, currentTime + 5)
    setCurrentTime(newTime)
  }, [currentTime, trackEnd])

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom)
  }, [])

  const handleSubtitlesChange = useCallback((newSubtitles: Subtitle[]) => {
    setSubtitles(newSubtitles)
  }, [])

  const handleSubtitleToggle = useCallback((checked: boolean) => {
    setShowSubtitles(checked)
  }, [])

  const handleVideoClipsChange = useCallback(
    (newClips: VideoClip[]) => {
      setVideoClips(newClips)

      // Update duration based on clips
      if (newClips.length > 0) {
        const maxDuration = Math.max(...newClips.map((clip) => clip.offset + clip.duration))
        if (maxDuration > duration) {
          setDuration(maxDuration)

          console.log("%c Line:109 🍌", "color:#93c0a4", Math.min(trackEnd, maxDuration));
          setTrackEnd(Math.min(trackEnd, maxDuration))
        }
      }
    },
    [duration, trackEnd],
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-balance">Video Editor</h1>
            <p className="text-muted-foreground text-pretty">
              Professional video editing with multi-video support, timeline controls and subtitle support
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="subtitle-toggle" checked={showSubtitles} onCheckedChange={handleSubtitleToggle} />
            <Label htmlFor="subtitle-toggle">Show Subtitles</Label>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(40vh-80px)]">
        <div className="flex-1 p-6">
          <div className="max-w-sm mx-auto h-full">
            <VideoPreview
              videoSrc={videoSrc}
              videoClips={videoClips}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeUpdate={handleTimeChange}
              onLoadedMetadata={handleLoadedMetadata}
              trackStart={trackStart}
              trackEnd={trackEnd}
              onPlaybackEnd={handlePlaybackEnd}
              subtitles={showSubtitles ? subtitles : []}
            />
          </div>
        </div>

        <div className="border-t border-border bg-card/50 p-6 space-y-4">
          <div className="max-w-4xl mx-auto">
            <PlaybackControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSkipBackward={handleSkipBackward}
              onSkipForward={handleSkipForward}
              currentTime={currentTime}
              duration={duration}
            />
          </div>

          <div className="max-w-4xl mx-auto">
            <TimelineZoomControl zoomLevel={zoomLevel} onZoomChange={handleZoomChange} />
          </div>

          <div className="max-w-4xl mx-auto">
            <Timeline
              duration={duration}
              currentTime={currentTime}
              onTimeChange={handleTimeChange}
              trackStart={trackStart}
              trackEnd={trackEnd}
              onTrackChange={handleTrackChange}
              videoSrc={videoSrc}
              videoClips={videoClips} // Pass video clips to timeline
              zoomLevel={zoomLevel}
            />
          </div>

          <div className="max-w-4xl mx-auto">
            <VideoTrack
              duration={duration}
              currentTime={currentTime}
              clips={videoClips}
              onClipsChange={handleVideoClipsChange}
              trackStart={trackStart}
              trackEnd={trackEnd}
              zoomLevel={zoomLevel}
            />
          </div>

          <div className="max-w-4xl mx-auto">
            <SubtitleTrack
              duration={duration}
              currentTime={currentTime}
              subtitles={subtitles}
              onSubtitlesChange={handleSubtitlesChange}
              trackStart={trackStart}
              trackEnd={trackEnd}
              zoomLevel={zoomLevel}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
