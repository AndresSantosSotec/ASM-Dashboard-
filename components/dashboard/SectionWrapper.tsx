"use client";

import React from "react";

export interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ children, className = "" }: SectionWrapperProps) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm ${className}`.trim()}>
      {children}
    </div>
  );
}
