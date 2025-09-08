export default function ProgressBar({ sourceCount }: { sourceCount: number }) {
  const progressPercent = (sourceCount / 10) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>Source Limit</span>
        <span>{sourceCount}/10</span>
      </div>
      <div className="w-full h-3 bg-black/50 rounded overflow-hidden">
        <div
          className="h-full bg-cyan-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
