"use client";

import React from "react";

export interface QuickAccessCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function QuickAccessCard({
  href,
  icon,
  title,
  description,
}: QuickAccessCardProps) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-[#0f2744]/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className="w-11 h-11 rounded-xl bg-[#0f2744]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0f2744] transition-colors">
        <span className="text-[#0f2744] group-hover:text-white transition-colors">
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-gray-900 group-hover:text-[#0f2744] transition-colors truncate">
          {title}
        </p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      <span className="text-gray-300 group-hover:text-[#0f2744] group-hover:translate-x-1 transition-all flex-shrink-0 text-lg">
        →
      </span>
    </a>
  );
}
