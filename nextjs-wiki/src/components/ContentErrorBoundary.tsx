'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error Boundary specifically for content/page errors
 * Catches errors in MDX content rendering and media player
 * 
 * @class ContentErrorBoundary
 * @extends {Component}
 */
interface Props {
  children: ReactNode;
  pagePath?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorStack?: string;
}

export class ContentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorStack: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorStack: error.stack,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Content error:', {
      page: this.props.pagePath,
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-900">
                Failed to Load Page
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                There was an error loading this page. Please try refreshing or go back.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 p-2 bg-white rounded border border-yellow-300">
                  <summary className="cursor-pointer font-mono text-sm">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto bg-gray-900 text-gray-100 p-2 rounded">
                    {this.state.error?.message}
                  </pre>
                </details>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
