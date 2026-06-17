import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/shared/ThemeToggle';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {

    
    // Maintain user as json.{} for role and other details
    // const userDetailsStr = sessionStorage.getItem('user_details');
    // const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};
    // userDetails.role = role;
    // sessionStorage.setItem('user_details', JSON.stringify(userDetails));
    const existingUser = JSON.parse(localStorage.getItem("user_details")) || {};
    const updatedUser = {
    ...existingUser,
    user_type: role
};

localStorage.setItem("user_details", JSON.stringify(updatedUser));

    if (role === 'student') {
      navigate('/student/onboarding-step-2');
    } else if(role === 'counsellor') {
      navigate('/counsellor/onboarding-step-2');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0F172A] px-6 font-sans transition-colors duration-300 relative">
      
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Heading */}
      <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-10 tracking-tight transition-colors duration-300">
        Tell us your role
      </h1>

      {/* Cards Container */}
      <div className="w-full max-w-sm flex flex-col gap-5">
        
        {/* Student Card */}
        <button 
          onClick={() => handleRoleSelect('student')}
          className="flex flex-col items-center justify-center py-7 px-8 bg-white dark:bg-[#1E293B] border border-[#edf2f7] dark:border-[#475569] rounded-[16px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:border-[#4285F4] dark:hover:bg-[#334155] dark:hover:border-[#64748b] hover:shadow-md transition-all duration-300 outline-none group active:scale-[0.98]"
        >
          <div className="text-[#4285F4] mb-3">
            {/* List/Document with Pen Icon */}
            <svg 
              className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h8v2H4z" />
              <path d="M19.41 12.59l2 2-6.59 6.59-2.83.83.83-2.83z" />
            </svg>
          </div>
          <span className="text-[16px] font-semibold text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">
            I am a Student
          </span>
        </button>

        {/* Counselor Card */}
        <button 
          onClick={() => handleRoleSelect('counsellor')}
          className="flex flex-col items-center justify-center py-7 px-8 bg-white dark:bg-[#1E293B] border border-[#edf2f7] dark:border-[#475569] rounded-[16px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:border-[#4285F4] dark:hover:bg-[#334155] dark:hover:border-[#64748b] hover:shadow-md transition-all duration-300 outline-none group active:scale-[0.98]"
        >
          <div className="text-[#4285F4] mb-3">
            {/* Counselor/Group Icon */}
            <svg 
              className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
            >
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span className="text-[16px] font-semibold text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">
            I am a Counselor
          </span>
        </button>

      </div>
    </div>
  );
};

export default RoleSelection;
