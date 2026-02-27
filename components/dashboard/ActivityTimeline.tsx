"use client";

import React from "react";

export interface ActivityItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}

export interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-4 relative pl-10">
            <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-[#0f2744] shadow-sm" />
            <div className="flex-1 min-w-0 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-gray-800">
                  {activity.title}
                </p>
                <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                  {activity.time}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
