"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ 
  message = "Cargando...", 
  progress,
  size = "md" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center max-w-md w-full px-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto mb-4 text-primary`} />
        
        {message && (
          <p className="text-gray-600 mb-4">{message}</p>
        )}
        
        {typeof progress === 'number' && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
          </>
        )}
      </div>
    </div>
  );
}

export default LoadingSpinner;
