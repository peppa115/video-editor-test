'use client';

import { useEffect, useRef, useState } from 'react';

export default function AudioVolumeDemo() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [linearGain, setLinearGain] = useState(1);
  const [dbValue, setDbValue] = useState(0);

  // 👇 这里换成你的音频资源链接
  const AUDIO_URL =     'https://cdn.video-ocean.com/vo_serving_data/2025/week_37/614cc738-3f10-49ea-becc-2532ff43e63b.wav';


  async function setupAudio() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    const ctx = audioCtxRef.current;
    const res = await fetch(AUDIO_URL);
    const arr = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arr);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const gainNode = ctx.createGain();
    src.connect(gainNode).connect(ctx.destination);

    sourceRef.current = src;
    gainNodeRef.current = gainNode;
  }

  async function handlePlay() {
    if (isPlaying) {
      audioCtxRef.current?.suspend();
      setIsPlaying(false);
    } else {
      if (!audioCtxRef.current) {
        await setupAudio();
      }
      const ctx = audioCtxRef.current!;
      if (ctx.state === 'suspended') await ctx.resume();
      if (!sourceRef.current) {
        await setupAudio();
      }
      sourceRef.current?.start?.(0);
      setIsPlaying(true);
    }
  }

  function handleLinearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setLinearGain(val);
    gainNodeRef.current && (gainNodeRef.current.gain.value = val);
  }

  function handleDbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const db = parseFloat(e.target.value);
    setDbValue(db);
    const gain = Math.pow(10, db / 20);
    gainNodeRef.current && (gainNodeRef.current.gain.value = gain);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-10 space-y-6">
      <h1 className="text-2xl font-bold">🎧 Web Audio Volume Demo</h1>

      <button
        onClick={handlePlay}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="block mb-1 font-medium">
            Linear Gain: {linearGain.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={linearGain}
            onChange={handleLinearChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Decibel (dB): {dbValue} dB
          </label>
          <input
            type="range"
            min="-50"
            max="20"
            step="1"
            value={dbValue}
            onChange={handleDbChange}
            className="w-full"
          />
        </div>
      </div>

      <p className="text-gray-500 text-sm mt-4 text-center max-w-md">
        🔊 左边的滑动条控制线性增益（数学上均匀变化）。<br />
        📈 右边的滑动条控制对数增益（符合人耳听感的音量变化）。
      </p>
    </div>
  );
}
