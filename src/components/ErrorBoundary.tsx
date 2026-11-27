import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card max-w-md p-6">
          <p className="text-base font-semibold text-white">Something went wrong in the interface</p>
          <p className="mt-2 text-sm text-slate-400">{this.state.error.message}</p>
          <button className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950" onClick={() => location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
