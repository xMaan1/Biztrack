'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

export type ErrorType = 'dialog' | 'toast' | 'inline';

interface ErrorHandlerContextType {
  showError: (message: string, type?: ErrorType, details?: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  clearError: () => void;
  handleAsyncError: (
    asyncFn: () => Promise<any>,
    errorMessage?: string,
    type?: ErrorType
  ) => Promise<any>;
}

const ErrorHandlerContext = createContext<ErrorHandlerContextType | undefined>(undefined);

interface ErrorHandlerProviderProps {
  children: ReactNode;
  defaultErrorType?: ErrorType;
}

export function ErrorHandlerProvider({ 
  children, 
  defaultErrorType = 'toast' 
}: ErrorHandlerProviderProps) {
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    message: '',
    details: undefined,
  });

  const [inlineError, setInlineError] = useState<string | null>(null);

  const showError = useCallback((message: string, type: ErrorType = defaultErrorType, details?: string) => {
    switch (type) {
      case 'dialog':
        setErrorDialog({
          isOpen: true,
          message,
          details,
        });
        break;
      case 'toast':
        toast.error(message);
        break;
      case 'inline':
        setInlineError(message);
        break;
    }
  }, [defaultErrorType]);

  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorDialog({ isOpen: false, message: '', details: undefined });
    setInlineError(null);
  }, []);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    errorMessage?: string,
    type: ErrorType = defaultErrorType
  ): Promise<any> => {
    try {
      return await asyncFn();
    } catch (error) {
      const message = errorMessage || 
        (error instanceof Error ? error.message : 'An unexpected error occurred');
      
      showError(message, type);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Async error:', error);
      }
      
      return null;
    }
  }, [showError, defaultErrorType]);

  const contextValue: ErrorHandlerContextType = {
    showError,
    showSuccess,
    showWarning,
    clearError,
    handleAsyncError,
  };

  return (
    <ErrorHandlerContext.Provider value={contextValue}>
      {children}
      
      {/* Error Dialog */}
      <Dialog open={errorDialog.isOpen} onOpenChange={(open) => 
        !open && setErrorDialog(prev => ({ ...prev, isOpen: false }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Error
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          
          {errorDialog.details && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-gray-600">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded overflow-auto">
                  {errorDialog.details}
                </pre>
              </details>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setErrorDialog(prev => ({ ...prev, isOpen: false }))}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline Error */}
      {inlineError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{inlineError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInlineError(null)}
                className="text-red-600 hover:text-red-800 p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </ErrorHandlerContext.Provider>
  );
}

export function useErrorHandler() {
  const context = useContext(ErrorHandlerContext);
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorHandlerProvider');
  }
  return context;
}

// Hook for easy async error handling
export function useAsyncErrorHandler() {
  const { handleAsyncError, showSuccess, showError } = useErrorHandler();
  
  return {
    handleAsync: handleAsyncError,
    showSuccess,
    showError,
  };
}

// Higher-order component for wrapping pages
export function withErrorHandler<P extends object>(
  Component: React.ComponentType<P>,
  defaultErrorType: ErrorType = 'toast'
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorHandlerProvider defaultErrorType={defaultErrorType}>
        <Component {...props} />
      </ErrorHandlerProvider>
    );
  };
}