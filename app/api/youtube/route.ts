/*
 * @Author: luxiangqiang
 * @Date: 2025-12-05 11:50:30
 * @LastEditors: luxiangqiang
 * @LastEditTime: 2025-12-05 14:01:01
 */
import { NextRequest, NextResponse } from "next/server";

/**
 * TikTok 视频信息 API 代理
 * 作为中间层代理请求，避免客户端跨域问题
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("video_id");

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "video_id 参数缺失" },
        { status: 400 }
      );
    }

    // 从环境变量获取 TikTok API 服务地址
    const apiUrl = 'https://api.tikhub.io';

    // 转发请求到 TikTok API 服务
    const API = `${apiUrl}/api/v1/youtube/web/get_video_info_v2?video_id=${videoId}`
    console.log("%c Line:30 🍓 API", "color:#fca650", API);
    const response = await fetch(
      API,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer p49bNtoAjA+5mFDPMtq6wiL/OGeBXr075wnaimG8fKO8u3iHHyGkVgWbHQ==`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("%c Line:38 🍻 errorText", "color:#ea7e5c", errorText);
      return NextResponse.json(
        {
          status: 500,
          error: `Request failed: ${response.status} - ${errorText}`,
        },
        { status: response.status }
      );
    }
    const data = await response.json();

    console.log("%c Line:45 🍫", "color:#b03734");
    console.error("data", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API 代理错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "服务器错误",
      },
      { status: 500 }
    );
  }
}
