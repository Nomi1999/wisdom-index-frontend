'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Specifically handle DOM removal errors that occur during navigation
    if (error.message.includes('removeChild') && error.message.includes('not a child of this node')) {
      console.warn('DOM removal error detected - this is likely a React navigation issue and can be safely ignored');
      // Don't show the error boundary for this specific known issue
      this.setState({ hasError: false });
      return;
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  // Don't render anything for DOM removal errors
  if (error?.message.includes('removeChild') && error?.message.includes('not a child of this node')) {
    return null;
  }
  
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>Something went wrong</h2>
      <p style={{ color: '#7f1d1d', marginBottom: '15px' }}>
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        style={{
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}

export default ErrorBoundary;