import { Clip } from './clip';

interface TrackProps {
  id: string;
  clips: { id: string; start: number; end: number }[];
  subTracks?: TrackProps[];
}

export function Track({ id, clips, subTracks }: TrackProps) {
  return (
    <div className="relative border-t border-border min-h-[50px]">
      {clips.map((clip) => (
        <Clip key={clip.id} {...clip} trackId={id} />
      ))}
      {subTracks?.length && (
        <div className="ml-4 mt-2">
          {subTracks.map((sub) => (
            <Track key={sub.id} {...sub} />
          ))}
        </div>
      )}
    </div>
  );
}
