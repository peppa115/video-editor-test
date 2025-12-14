// import TimelineEditorDemo from '@/components/test/clip-resize';
import { Masonry2 } from "@/components/masonry/masonry2";
import MasonryDemo from "@/components/masonry/virtual-list";
import AudioVolumeDemo from "@/components/test/audio-volume";
import TimelineEditorDemo from "@/components/test/clip-resize";
import CanvasWithForm from "@/components/test/drag-canvas";
import CanvasVideoEditor from "@/components/test/full-screen";
import WaterfallVirtualListDemo from "@/components/test/masonry";
import Timeline from "@/components/test/reorder";
import TimelineNew from "@/components/test/reorder2";
import CanvasZoomDemo from "@/components/test/scale-resize";
import CanvasDragResizeDemo from "@/components/test/scale-resize2";
import CanvasDragResizeDemoNew from "@/components/test/scale-resize3";
import SubtitleDragResize from "@/components/test/subtitle-drag-resize";
import SubtitleResize from "@/components/test/subtitle-resize";
import SubtitleResize2 from "@/components/test/subtitle-resize2";
import SubtitleTest from "@/components/test/subtitle-test";
import CanvasVideoAudioDemo from "@/components/test/sync-audio";
import TimelineZoomDemo from "@/components/test/zoom-timeline";
import React from "react";

const TestPage: React.FC = () => (
  <div className="size-full">
    {/* <TimelineZoomDemo/>
        <div className='w-full h-1 bg-amber-400'></div>
        <Timeline/>
        <div className='w-full h-1 bg-amber-400'></div>
        <TimelineNew/>
        <div className='w-full h-1 bg-amber-400 my-3'></div>
        <CanvasVideoAudioDemo/> */}
    {/* <TimelineEditorDemo /> */}
    {/* <SubtitleTest/> */}
    {/* <AudioVolumeDemo/> */}
    {/* <CanvasWithForm/> */}
    {/* <CanvasZoomDemo/> */}
    {/* <CanvasDragResizeDemo/> */}
    {/* <CanvasDragResizeDemoNew/> */}

    {/* <SubtitleDragResize/> */}

    {/* <SubtitleResize2/> */}

    {/* <CanvasVideoEditor/> */}
    <div className="w-1/2"> <WaterfallVirtualListDemo/> </div>

    {/* <Masonry2 /> */}
    {/* <MasonryDemo/> */}
  </div>
);

export default TestPage;
