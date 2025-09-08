import { Upload, Link as LinkIcon, FileText } from "lucide-react";

export default function SourceButtons({
  onFile,
  onWebsite,
  onText,
  sourceCount,
  sourceCountLimit,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        // disabled={sourceCount >= sourceCountLimit}
        onClick={onFile}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-semibold"
      >
        <Upload className="w-5 h-5" /> Upload File
      </button>
      <button
        // disabled={sourceCount >= sourceCountLimit}
        onClick={onWebsite}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-semibold"
      >
        <LinkIcon className="w-5 h-5" /> Add Website Links
      </button>
      <button
        // disabled={sourceCount >= sourceCountLimit}
        onClick={onText}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-semibold"
      >
        <FileText className="w-5 h-5" /> Paste Text
      </button>
    </div>
  );
}
