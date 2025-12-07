'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white border border-gray-200 shadow-lg',
          title: 'text-gray-900 font-medium',
          description: 'text-gray-500',
          actionButton: 'bg-blue-600 text-white',
          cancelButton: 'bg-gray-100 text-gray-600',
          error: 'bg-red-50 border-red-200',
          success: 'bg-green-50 border-green-200',
        },
      }}
    />
  );
}

export { toast };
