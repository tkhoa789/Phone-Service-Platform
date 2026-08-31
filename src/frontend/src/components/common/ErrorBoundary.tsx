import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI Component:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl glass-panel border border-red-500/30 text-slate-100 max-w-2xl mx-auto my-12 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-red-400 border-b border-red-500/20 pb-3">
            <AlertOctagon className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="font-heading font-extrabold text-lg text-white">Đã Xảy Ra Lỗi Hiển Thị Giao Diện!</h2>
              <p className="text-xs text-red-300">Thành phần giao diện này gặp ngoại lệ chưa được xử lý.</p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="font-mono text-xs font-bold text-red-400">{this.state.error.name}: {this.state.error.message}</p>
              {this.state.error.stack && (
                <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto max-h-40 p-2 bg-slate-900 rounded-lg">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Tải Lại Trang Web
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay Về Trang Chủ Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
