import React, { Component } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PixelBead ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="text-5xl">🧩</div>
            <h2 className="text-xl font-black text-white">出错了</h2>
            <p className="text-sm text-white/50">
              拼豆糕手遇到了一个意外错误，已自动记录。
            </p>
            <p className="text-xs text-white/30 font-mono bg-white/5 rounded-xl p-3 break-all">
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-black text-sm transition-all active:scale-95"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
