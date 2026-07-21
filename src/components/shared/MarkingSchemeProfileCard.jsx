import React from 'react';
import { useNavigate } from 'react-router-dom';

const MarkingSchemeProfileCard = ({ role = 'student' }) => {
  const navigate = useNavigate();
  
  const linkPath = role === 'counsellor' || role === 'center' 
    ? '/counsellor/marking-scheme/default' 
    : '/student/marking-scheme';

  return (
    <section className="px-8 mb-10">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Rules & Grading</h3>
      </div>
      <div 
        onClick={() => navigate(linkPath)}
        className="bg-white dark:bg-[#1E293B] rounded-[40px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)] border border-teal-200 dark:border-[#1de9b6]/20 flex items-center justify-between cursor-pointer hover:border-teal-300 dark:hover:border-[#1de9b6]/50 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] dark:bg-[#1de9b6]/10 flex items-center justify-center text-[#059669] dark:text-[#1de9b6]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <h4 className="text-[16px] font-black text-[#1e293b] dark:text-[#F8FAFC]">View Marking Scheme</h4>
            <p className="text-[12px] font-bold text-gray-400 mt-1 tracking-tight">Check your target and grading criteria</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </div>
    </section>
  );
};

export default MarkingSchemeProfileCard;
