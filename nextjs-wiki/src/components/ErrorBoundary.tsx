'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error Boundary component for graceful error handling
 * Catches errors in child components and displays fallback UI
 * 
 * @class ErrorBoundary
 * @extends {Component}
 * 
 * @example
 * <ErrorBoundary fallback={<ErrorPage />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-red-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600 mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-700 mb-4">
                {this.state.error?.message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
