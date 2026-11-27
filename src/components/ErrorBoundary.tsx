import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="grid min-h-screen place-items-center bg-ink-900 p-6 text-center">
        <div className="card animated-border max-w-md p-6 shadow-elevated">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl border border-fraud-400/30 bg-fraud-500/15 text-fraud-300">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <p className="font-display text-base font-semibold text-cloud">Something went wrong in the interface</p>
          <p className="mt-2 text-sm text-silver">{this.state.error.message}</p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-model-500 px-4 py-2 text-sm font-semibold text-ink-900 shadow-glow transition hover:brightness-105"
            onClick={() => location.reload()}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reload
          </button>
        </div>
      </div>
    );
  }
}
