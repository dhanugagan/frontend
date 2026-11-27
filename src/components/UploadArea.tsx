import { DragEvent, KeyboardEvent, useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { fmtBytes } from "@/utils/format";

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
  maxBytes: number | null;
  disabled?: boolean;
  progress?: number | null;
}

export function UploadArea({ file, onFile, maxBytes, disabled, progress }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const pick = () => !disabled && input.current?.click();

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };
  const onKey = (e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick());

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload a CSV file: drop it here or press Enter to browse"
        aria-disabled={disabled}
        onKeyDown={onKey}
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          !disabled && setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        data-testid="upload-dropzone"
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-9 text-center transition ${drag ? "border-brand-400 bg-brand-400/[0.07]" : "border-white/10 bg-ink-900/60 hover:border-brand-400/40"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <div className="rounded-full bg-brand-400/10 p-3 text-brand-300">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-slate-100">Drag &amp; drop a CSV file, or <span className="text-brand-300 underline underline-offset-2">browse</span></p>
        <p className="text-xs text-slate-400">.csv only{maxBytes ? ` · up to ${fmtBytes(maxBytes)}` : ""}</p>
        <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" data-testid="file-input" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </div>
      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-ink-900/70 px-3 py-2.5">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-brand-300" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-slate-100" data-testid="file-name">{file.name}</p>
            <p className="num text-xs text-slate-400">{fmtBytes(file.size)}</p>
            {progress !== null && progress !== undefined && (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                <div className="h-full rounded-full bg-brand-400 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
          </div>
          {!disabled && (
            <button aria-label="Remove file" onClick={() => onFile(null)} className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
