import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CiDark, CiLight } from "react-icons/ci";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full bg-white dark:bg-[#1E293B] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 mr-3 border border-gray-100 dark:border-[#475569]"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <CiDark className="text-[24px] text-[#0f172a] dark:text-[#F8FAFC]" />
      ) : (
        <CiLight className="text-[24px] text-[#0f172a] dark:text-[#F8FAFC]" />
      )}
    </button>
  );
};

export default ThemeToggle;
