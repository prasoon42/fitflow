import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('FitFlow render error:', error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                        background: 'var(--bg-primary, #f2f0ef)',
                        color: 'var(--text-primary, #1d1d1f)',
                        fontFamily: 'system-ui, sans-serif',
                        textAlign: 'center',
                        gap: 12,
                    }}
                >
                    <strong>Something went wrong</strong>
                    <span style={{ fontSize: 14, opacity: 0.85 }}>
                        Open DevTools (F12) → Console for details, then refresh the page.
                    </span>
                </div>
            );
        }
        return this.props.children;
    }
}
