import React from 'react';
import { motion } from 'framer-motion';

const DailyScoreIndicator = ({ scoreData, isLoading }) => {
  const percentage = scoreData?.percentage || 0;
  const earned = scoreData?.earnedMarks || 0;
  const max = scoreData?.maxMarks || 0;

  // Determine color based on rules
  let colorClass = 'text-red-500';
  let strokeColor = '#ef4444'; // Red

  if (percentage >= 90) {
    colorClass = 'text-green-500';
    strokeColor = '#22c55e'; // Green
  } else if (percentage >= 70) {
    colorClass = 'text-teal-500';
    strokeColor = '#14b8a6'; // Teal
  } else if (percentage >= 50) {
    colorClass = 'text-orange-500';
    strokeColor = '#f97316'; // Orange
  }

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fixed bottom-[100px] right-6 lg:right-10 z-40 group cursor-pointer">
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none">
        <div className="bg-[#0f172a] text-white text-xs rounded-xl p-3 shadow-xl border border-gray-700">
          <p className="font-bold text-center mb-2 text-sm text-gray-200">Today's Sadhana Score</p>
          <div className="flex justify-between items-center py-1 border-b border-gray-700">
            <span className="text-gray-400 font-medium">Earned Marks</span>
            <span className="font-bold text-white text-sm">{earned}</span>
          </div>
          <div className="flex justify-between items-center py-1 pt-2">
            <span className="text-gray-400 font-medium">Possible Marks</span>
            <span className="font-bold text-white text-sm">{max}</span>
          </div>
        </div>
        {/* Tooltip arrow */}
        <div className="w-3 h-3 bg-[#0f172a] rotate-45 absolute -bottom-1.5 right-7 border-r border-b border-gray-700"></div>
      </div>

      {/* Circular Indicator */}
      <div className={`w-[68px] h-[68px] lg:w-[76px] lg:h-[76px] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] relative overflow-hidden active:scale-95 transition-transform`}>
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        ) : (
          <>
            {/* Background Circle SVG */}
            <svg className="w-full h-full -rotate-90 absolute top-0 left-0" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                className="stroke-gray-100 dark:stroke-[#334155]"
                strokeWidth="5"
              />
              <motion.circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="5"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Percentage Text */}
            <div className="relative z-10 flex flex-col items-center justify-center mt-0.5">
              <span className={`text-[18px] lg:text-[20px] font-black leading-none ${colorClass}`}>
                {percentage}<span className="text-[12px]">%</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyScoreIndicator;
