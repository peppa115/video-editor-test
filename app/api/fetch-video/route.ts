import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { error: "请提供有效的视频链接" },
        { status: 400 }
      );
    }

    // 在服务端 fetch 视频链接
    const response = await fetch(videoUrl, {
      method: "GET",
      headers: {
        Accept: "video/*",
        "User-Agent": "Mozilla/5.0 (compatible; Next.js Video Fetcher)",
        Authorization: `Bearer p49bNtoAjA+5mFDPMtq6wiL/OGeBXr075wnaimG8fKO8u3iHHyGkVgWbHQ==`,

      },
    });

    if (!response.ok) {
      
      console.log("%c Line:26 🥖", "color:#33a5ff");
    }

    // 获取响应信息
    const responseData = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
      redirected: response.redirected,
      type: response.type,
      url: response.url,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.log("%c Line:45 🍅 error", "color:#4fff4B", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "请求失败",
      },
      { status: 500 }
    );
  }
}

