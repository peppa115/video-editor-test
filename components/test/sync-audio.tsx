"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Canvas Video + WebAudio demo (single-file React component)
 * - Placeholders for 1 video, 1 voiceover, 1 sfx (replace URLs or use file inputs)
 * - Renders the correct video frame into a <canvas> according to a unified timeline
 * - Uses Web Audio API to decode buffers and schedule playback to stay in sync
 * - Supports play / pause / seek and per-track gain controls
 *
 * Usage: drop this file into a Next.js app under /app or /components and import it.
 * Note: This is a client component and requires a browser that supports Web Audio API.
 */

type Track = {
  id: string;
  name: string;
  url: string | null; // placeholder or file object URL
  buffer: AudioBuffer | null;
  gain: number;
  startAt: number; // timeline start in seconds
  duration: number; // seconds (optional: filled after decode)
};

export default function CanvasVideoAudioDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null); // single video element used for canvas rendering

  // --- timeline state ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeline, setTimeline] = useState(0); // seconds
  const [totalDuration, setTotalDuration] = useState(30);

  // --- WebAudio ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const trackNodesRef = useRef<Record<string, { source: AudioBufferSourceNode | null; gainNode: GainNode | null }>>({});
  const scheduledRef = useRef<{ startWallClock: number; startTimeline: number } | null>(null);

  // --- placeholder sources (replace these with your own URLs or via file input) ---
  const PLACEHOLDER_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
  const PLACEHOLDER_VOICE = "https://cdn.video-ocean.com/vo_serving_data/2025/week_37/b92519e0-9039-4899-90c2-d5f1f83f1fa7.wav"; // voice placeholder
  const PLACEHOLDER_SFX = "https://cdn.video-ocean.com/vo_serving_data/2025/week_37/81b0f067-605f-40a5-a9a6-6de94047395e.wav"; // sfx placeholder (example)

  // --- tracks ---
  const [voiceTrack, setVoiceTrack] = useState<Track>({
    id: "voice",
    name: "Voiceover",
    url: PLACEHOLDER_VOICE,
    buffer: null,
    gain: 1,
    startAt: 0,
    duration: 0,
  });
  const [sfxTrack, setSfxTrack] = useState<Track>({
    id: "sfx",
    name: "SFX",
    url: PLACEHOLDER_SFX,
    buffer: null,
    gain: 1,
    startAt: 0,
    duration: 0,
  });

  const [videoUrl, setVideoUrl] = useState<string | null>(PLACEHOLDER_VIDEO);

  // --- util: load audio buffer ---
  async function loadAudioBuffer(url: string) {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const resp = await fetch(url);
    const ab = await resp.arrayBuffer();
    return await ctx.decodeAudioData(ab);
  }

  // load initial audio buffers
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        if (voiceTrack.url) {
          const buffer = await loadAudioBuffer(voiceTrack.url);
          if (!mounted) return;
          setVoiceTrack((t) => ({ ...t, buffer, duration: buffer.duration }));
          setTotalDuration((d) => Math.max(d, buffer.duration));
        }
      } catch (e) {
        console.warn("Failed to load voice buffer:", e);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [voiceTrack.url]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        if (sfxTrack.url) {
          const buffer = await loadAudioBuffer(sfxTrack.url);
          if (!mounted) return;
          setSfxTrack((t) => ({ ...t, buffer, duration: buffer.duration }));
          setTotalDuration((d) => Math.max(d, buffer.duration));
        }
      } catch (e) {
        console.warn("Failed to load sfx buffer:", e);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [sfxTrack.url]);

  // --- video metadata for totalDuration ---
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      setTotalDuration((d) => Math.max(d, v.duration));
    };
    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [videoUrl]);

  // --- render loop (draw video frame to canvas) ---
  useEffect(() => {
    let rafId = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const video = videoRef.current;

    function draw() {
      if (!ctx || !video || video.readyState < 2) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      // draw video into canvas (fit to canvas)
      const cw = canvas!.width;
      const ch = canvas!.height;
      const vw = video.videoWidth || cw;
      const vh = video.videoHeight || ch;

      // simple cover-fit calculation (center-crop)
      const scale = Math.max(cw / vw, ch / vh);
      const sw = cw / scale;
      const sh = ch / scale;
      const sx = Math.max(0, (vw - sw) / 2);
      const sy = Math.max(0, (vh - sh) / 2);

      try {
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
      } catch (e) {
        // drawImage can throw if video not ready - ignore
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // --- playback scheduling ---
  function stopAllScheduled() {
    const nodes = trackNodesRef.current;
    Object.keys(nodes).forEach((k) => {
      const entry = nodes[k];
      try {
        entry.source?.stop();
      } catch (_) {}
      entry.source = null;
      entry.gainNode = null;
    });
    scheduledRef.current = null;
  }

  function scheduleAudioAt(timelineStart: number) {
    // timelineStart: the timeline second that corresponds to audioContext.currentTime
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    stopAllScheduled();

    const now = ctx.currentTime;
    scheduledRef.current = { startWallClock: now, startTimeline: timelineStart };

    const tracks = [voiceTrack, sfxTrack];
    tracks.forEach((track) => {
      if (!track.buffer) return;
      // if track starts after the current timeline, schedule it later
      const trackStart = track.startAt; // timeline point when this track should begin
      const trackEnd = track.startAt + (track.duration || track.buffer!.duration);
      // if the current timeline is past track end, skip
      if (timelineStart >= trackEnd) return;

      // compute offset into the audio buffer where we should start
      const offset = Math.max(0, timelineStart - trackStart);
      // compute when (in wallclock seconds) to start
      const when = now; // start immediately, but the buffer offset handles position

      const source = ctx.createBufferSource();
      source.buffer = track.buffer as AudioBuffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = track.gain;
      source.connect(gainNode).connect(ctx.destination);

      // We must ensure we don't play beyond the track's remaining length
      const remaining = (track.duration || track.buffer!.duration) - offset;
      try {
        source.start(when, offset, remaining);
      } catch (e) {
        console.warn("source.start failed (maybe already started or invalid):", e);
      }

      trackNodesRef.current[track.id] = { source, gainNode };
    });
  }

  // play/pause handlers
  async function handlePlay() {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    // resume audio context if suspended
    try {
      await audioCtxRef.current.resume();
    } catch (e) {
      console.warn(e);
    }

    // sync video element playback for canvas rendering
    const video = videoRef.current;
    if (video) {
      // set video currentTime = timeline
      video.currentTime = Math.min(timeline, video.duration || timeline);
      // we intentionally do not call video.play() because we control frame-by-frame via canvas.
      // But some browsers require video.play() to update frames; so call play but mute.
      video.muted = true;
      await video.play().catch(() => {});
    }

    scheduleAudioAt(timeline);

    // record wallclock mapping
    if (audioCtxRef.current) {
      scheduledRef.current = { startWallClock: audioCtxRef.current.currentTime, startTimeline: timeline };
    }

    setIsPlaying(true);

    // start RAF-driven timeline updater
    tickLoop();
  }

  function handlePause() {
    // stop audio sources
    stopAllScheduled();
    // pause video
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch {}
    }
    setIsPlaying(false);
  }

  // timeline update loop when playing
  function tickLoop() {
    if (!isPlaying) return; // guard
    const ctx = audioCtxRef.current;
    if (!ctx || !scheduledRef.current) return;

    const { startWallClock, startTimeline } = scheduledRef.current;
    const wallNow = ctx.currentTime;
    const currentTimeline = startTimeline + (wallNow - startWallClock);
    setTimeline((_) => currentTimeline);

    // keep requestAnimationFrame for UI smoothness (but timeline source is audio clock)
    if (isPlaying) requestAnimationFrame(tickLoop);
  }

  // seek handler: jump timeline to t seconds
  function seekTo(t: number) {
    // stop existing scheduled sources
    stopAllScheduled();

    // set video currentTime
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.min(t, video.duration || t);
    }

    setTimeline(t);

    // if currently playing, reschedule
    if (isPlaying) {
      scheduleAudioAt(t);
      if (audioCtxRef.current) scheduledRef.current = { startWallClock: audioCtxRef.current.currentTime, startTimeline: t };
    }
  }

  // handle file input for video or audio replacement
  function handleReplaceVideo(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  }

  async function handleReplaceAudio(file: File | null, which: "voice" | "sfx") {
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const buffer = await loadAudioBuffer(url);
      if (which === "voice") {
        setVoiceTrack((t) => ({ ...t, url, buffer, duration: buffer.duration }));
      } else {
        setSfxTrack((t) => ({ ...t, url, buffer, duration: buffer.duration }));
      }
      setTotalDuration((d) => Math.max(d, buffer.duration));
    } catch (e) {
      console.warn("failed decode:", e);
    }
  }

  // simple effect to follow timeline when not playing (keeps canvas video frame in sync for scrubbing)
  useEffect(() => {
    if (isPlaying) return;
    const v = videoRef.current;
    if (!v) return;
    // clamp
    const t = Math.max(0, Math.min(timeline, v.duration || timeline));
    try {
      v.currentTime = t;
    } catch {}
  }, [timeline, isPlaying]);

  // helper to set canvas size to element size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function syncSize() {
      // use devicePixelRatio for crispness
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.floor(rect.width * dpr);
      canvas!.height = Math.floor(rect.height * dpr);
      const ctx = canvas!.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    syncSize();
    window.addEventListener("resize", syncSize);
    return () => window.removeEventListener("resize", syncSize);
  }, []);

  // UI -----------------------------------------------------------------
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Canvas Video + WebAudio Demo</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="w-full h-64 bg-black rounded-md overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              className="px-3 py-1 rounded bg-slate-700 text-white"
              onClick={() => {
                if (isPlaying) {
                  handlePause();
                } else {
                  handlePlay();
                }
              }}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            <label className="flex items-center gap-2">
              Seek:
              <input
                type="range"
                min={0}
                max={Math.max(1, totalDuration)}
                step={0.01}
                value={Math.max(0, Math.min(timeline, totalDuration))}
                onChange={(e) => seekTo(Number(e.target.value))}
              />
            </label>

            <div className="ml-auto text-sm text-slate-600">{timeline.toFixed(2)}s / {totalDuration.toFixed(2)}s</div>
          </div>

          <div className="mt-3">
            <div className="flex gap-2 items-center">
              <label className="text-sm">Replace video:</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleReplaceVideo(e.target.files ? e.target.files[0] : null)}
              />

              <label className="text-sm ml-4">Replace voiceover:</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleReplaceAudio(e.target.files ? e.target.files[0] : null, "voice")}
              />

              <label className="text-sm ml-4">Replace sfx:</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleReplaceAudio(e.target.files ? e.target.files[0] : null, "sfx")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-white rounded shadow">
            <div className="text-sm font-medium">Video Source</div>
            <div className="text-xs text-slate-500 break-all">{videoUrl}</div>
          </div>

          <div className="p-3 bg-white rounded shadow space-y-2">
            <div className="text-sm font-medium">Tracks</div>

            <div>
              <div className="text-xs">{voiceTrack.name}</div>
              <div className="text-xs break-all">{voiceTrack.url}</div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  value={voiceTrack.gain}
                  onChange={(e) => setVoiceTrack((t) => ({ ...t, gain: Number(e.target.value) }))}
                />
                <div className="text-xs">gain: {voiceTrack.gain.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <div className="text-xs">{sfxTrack.name}</div>
              <div className="text-xs break-all">{sfxTrack.url}</div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  value={sfxTrack.gain}
                  onChange={(e) => setSfxTrack((t) => ({ ...t, gain: Number(e.target.value) }))}
                />
                <div className="text-xs">gain: {sfxTrack.gain.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded shadow text-xs">
            Notes:
            <ul className="list-disc pl-5 mt-2">
              <li>Replace the placeholder files by uploading your own video/audio.</li>
              <li>The demo schedules audio via the WebAudio clock (audioContext.currentTime) and uses the canvas to draw the video frame at the timeline time.</li>
              <li>If the browser prevents autoplay, call play after a user gesture (the Play button is such a gesture).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* hidden video used for rendering frames to canvas */}
      <video ref={videoRef} src={videoUrl ?? undefined} style={{ display: "none" }} crossOrigin="anonymous" />
    </div>
  );
}
