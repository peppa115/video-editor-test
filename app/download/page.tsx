"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DownloadTestPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [youtubeData, setYoutubeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    console.log("%c Line:15 🍓", "color:#fca650");
    if (!videoUrl.trim()) {
      setError("请输入视频链接");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(videoUrl, {
        method: "GET",
        headers: {
          Accept: "video/*",
        },
      });

      const responseData = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        ok: res.ok,
        redirected: res.redirected,
        type: res.type,
        url: res.url,
      };

      setResponse(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const handleServerFetch = async () => {
    if (!videoUrl.trim()) {
      setError("请输入视频链接");
      return;
    }

    setServerLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/fetch-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.data);
      } else {
        setError(data.error || "服务端请求失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setServerLoading(false);
    }
  };

  const handleYoutubeFetch = async () => {
    if (!videoUrl.trim()) {
      setError("请输入视频 ID");
      return;
    }

    setYoutubeLoading(true);
    setError(null);
    setYoutubeData(null);

    try {
      const res = await fetch(`/api/youtube?video_id=${encodeURIComponent(videoUrl.trim())}`);

      const data = await res.json();

      if (res.ok) {
        setYoutubeData(data);
      } else {
        setError(data.error || "YouTube API 请求失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setYoutubeLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">视频链接 Fetch 测试</h1>

      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="请输入视频链接 URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFetch();
              }
            }}
          />
          <Button onClick={handleFetch} disabled={loading || serverLoading || youtubeLoading}>
            {loading ? "请求中..." : "客户端 Fetch"}
          </Button>
          <Button onClick={handleServerFetch} disabled={loading || serverLoading || youtubeLoading} variant="outline">
            {serverLoading ? "请求中..." : "服务端 Fetch"}
          </Button>
          <Button onClick={handleYoutubeFetch} disabled={loading || serverLoading || youtubeLoading} variant="secondary">
            {youtubeLoading ? "请求中..." : "YouTube API"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <h2 className="font-semibold text-destructive mb-2">错误信息</h2>
          <pre className="text-sm text-destructive whitespace-pre-wrap break-words">
            {error}
          </pre>
        </div>
      )}

      {response && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Response 信息</h2>
          <div className="p-4 bg-muted rounded-md border">
            <div className="space-y-2 mb-4">
              <div>
                <span className="font-semibold">状态码: </span>
                <span
                  className={
                    response.ok
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {response.status} {response.statusText}
                </span>
              </div>
              <div>
                <span className="font-semibold">请求成功: </span>
                <span className={response.ok ? "text-green-600" : "text-red-600"}>
                  {response.ok ? "是" : "否"}
                </span>
              </div>
              <div>
                <span className="font-semibold">重定向: </span>
                <span>{response.redirected ? "是" : "否"}</span>
              </div>
              <div>
                <span className="font-semibold">响应类型: </span>
                <span>{response.type}</span>
              </div>
              <div>
                <span className="font-semibold">最终 URL: </span>
                <span className="text-sm break-all">{response.url}</span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">响应头:</h3>
              <pre className="text-sm bg-background p-3 rounded border overflow-auto max-h-96">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {youtubeData && (
        <div className="space-y-4 mt-6">
          <h2 className="text-xl font-semibold">YouTube API 响应</h2>
          <div className="p-4 bg-muted rounded-md border">
            <div className="space-y-2 mb-4">
              <div>
                <span className="font-semibold">视频流 URL: </span>
                {youtubeData?.streamingData?.adaptiveFormats?.[0]?.url ? (
                  <div className="mt-2">
                    <a
                      href={youtubeData.streamingData.adaptiveFormats[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm"
                    >
                      {youtubeData.streamingData.adaptiveFormats[0].url}
                    </a>
                  </div>
                ) : (
                  <span className="text-muted-foreground">未找到视频流 URL</span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">完整响应数据:</h3>
              <pre className="text-sm bg-background p-3 rounded border overflow-auto max-h-96">
                {JSON.stringify(youtubeData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadTestPage;

