import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State { hasError: boolean }

export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Wearza failed to render', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <section className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-xl font-black text-gray-900">Wearza could not load</h1>
          <p className="mt-2 text-sm text-gray-500">Refresh the page to reconnect to the store.</p>
          <button onClick={() => window.location.reload()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white">
            <RefreshCw size={16} /> Refresh Wearza
          </button>
        </section>
      </main>
    );
  }
}