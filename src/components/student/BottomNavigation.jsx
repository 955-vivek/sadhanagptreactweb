import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to determine active state. Defaulting Home to /student/dashboard for now.
  const isActive = (path) => {
    return location.pathname === path || (path === '/' && location.pathname === '/student/dashboard');
  };

  const navItems = [
    {
      name: 'Home',
      path: '/student/dashboard', // Target route
      icon: (
        <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      )
    },
    {
      name: 'Analytics',
      path: '/student/analytics',
      icon: (
        <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      name: 'Inspiration',
      path: '/student/inspiration',
      icon: (
        <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
        </svg>
      )
    },
    {
      name: 'Profile',
      path: '/student/profile',
      icon: (
        <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <div className="fixed bottom-0 w-full left-0 right-0 flex justify-center z-50">
      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-t-[32px] shadow-[0_-8px_30px_rgba(15,23,42,0.12)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-gray-400/70 dark:border-[#334155] px-6 py-4 flex justify-between items-center">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center transition-colors ${
                active ? 'text-[#1a73e8]' : 'text-[#94a3b8] hover:text-[#64748b] dark:hover:text-[#CBD5E1]'
              }`}
            >
              {item.icon}
              <span className="text-[11px] font-bold">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
