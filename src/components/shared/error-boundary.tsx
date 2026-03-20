import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <Button variant="outline" onClick={this.resetErrorBoundary}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
