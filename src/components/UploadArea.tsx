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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition duration-200 ${
          drag
            ? "border-brand-500 bg-ink-750/40 shadow-glow"
            : "border-white/15 bg-ink-950/70 hover:border-brand-500/55 hover:bg-ink-900"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-br from-ink-750/70 to-ink-800/90 p-3.5 text-brand-500 animate-floatSlow">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-cloud">
          Drag &amp; drop a CSV file, or <span className="text-brand-400 underline underline-offset-2">browse</span>
        </p>
        <p className="text-xs text-silver">.csv only{maxBytes ? ` · up to ${fmtBytes(maxBytes)}` : ""}</p>
        <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" data-testid="file-input" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </div>
      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-ink-900/85 px-3.5 py-3 shadow-card">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-cloud" data-testid="file-name">{file.name}</p>
            <p className="num text-xs text-silver">{fmtBytes(file.size)}</p>
            {progress !== null && progress !== undefined && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                <div className="tri-gradient-bar h-full rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
          </div>
          {!disabled && (
            <button aria-label="Remove file" onClick={() => onFile(null)} className="rounded-lg p-1.5 text-silver transition hover:bg-white/5 hover:text-cloud">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
