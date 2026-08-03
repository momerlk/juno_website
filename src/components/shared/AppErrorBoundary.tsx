import React from 'react';

interface State {
    error: Error | null;
}

/**
 * Without a boundary, one thrown render turns the whole site into a blank page —
 * the customer sees a crash with no way back and we get no signal about what broke.
 * This keeps the shell alive, shows the actual message so a shopper can report it,
 * and offers the two recoveries that work: retry the render, or reload.
 */
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Keep it in the console for remote debugging tools (Clarity captures these).
        console.error('[Juno] render crash:', error, info?.componentStack);
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] px-5 text-white">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                    <h1
                        className="text-xl font-black uppercase tracking-[-0.02em]"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        Something broke
                    </h1>
                    <p className="mt-2 text-[15px] text-white/60">
                        This page hit an error. Your bag is safe.
                    </p>
                    <p className="mt-4 break-words rounded-xl border border-white/10 bg-black/40 p-3 text-left font-mono text-[12px] text-white/50">
                        {error.message || 'Unknown error'}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => this.setState({ error: null })}
                            className="rounded-xl border border-white/15 py-3.5 text-[14px] font-bold text-white/80 transition-colors hover:text-white"
                        >
                            Try again
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.assign('/catalog')}
                            className="rounded-xl bg-gradient-to-r from-primary to-secondary py-3.5 text-[14px] font-black uppercase tracking-[0.1em] text-white"
                        >
                            Back to shop
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AppErrorBoundary;
