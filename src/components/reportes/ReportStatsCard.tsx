'use client';

import React from 'react';
import { Card } from 'primereact/card';

interface ReportStatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  description?: string;
}

const ReportStatsCard: React.FC<ReportStatsCardProps> = ({
  title,
  value,
  icon,
  color,
  description
}) => {
  return (
    <Card className={`bg-${color}-50 border-${color}-200 h-full`}>
      <div className="flex align-items-center">
        <div className="flex-shrink-0">
          <i className={`pi ${icon} text-4xl text-${color}-500`}></i>
        </div>
        <div className="flex-1 ml-4">
          <div className={`text-2xl font-bold text-${color}-700`}>
            {value}
          </div>
          <div className="text-sm font-medium text-900">
            {title}
          </div>
          {description && (
            <div className={`text-xs text-${color}-600 mt-1`}>
              {description}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ReportStatsCard;