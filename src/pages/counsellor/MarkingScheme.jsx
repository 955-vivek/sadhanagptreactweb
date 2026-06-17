import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';

const MarkingScheme = () => {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState('default');

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1628] font-sans pb-28 transition-colors duration-300 flex flex-col">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b1628]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#112240] flex items-center justify-between px-6 py-4 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#6b7a99] hover:bg-gray-50 dark:hover:bg-[#112240] active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[15px] font-medium text-[#0f172a] dark:text-[#ffffff] leading-none tracking-tight">Marking Scheme</h1>
            <p className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6] mt-1">Manage grading and evaluation criteria</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
          
          {/* Card 1 — Default Scheme */}
          <div
            onClick={() => setSelectedCard('default')}
            className={`relative bg-white dark:bg-[#112240] rounded-[14px] p-[16px] shadow-sm flex flex-col cursor-pointer active:scale-[0.98] transition-all ${
              selectedCard === 'default' 
                ? 'border-[1.5px] border-teal-500 dark:border-[#1de9b6]' 
                : 'border-[1.5px] border-transparent'
            }`}
          >
            {/* Selected Indicator */}
            {selectedCard === 'default' && (
              <div className="absolute top-[16px] right-[16px] w-[18px] h-[18px] rounded-full bg-teal-500 dark:bg-[#1de9b6] flex items-center justify-center">
                <svg className="w-3 h-3 text-white dark:text-[#042C53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Top section */}
            <div className="flex items-center gap-[12px] mb-[16px]">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-teal-50 dark:bg-[rgba(29,233,182,0.12)] flex items-center justify-center shrink-0 text-teal-500 dark:text-[#1de9b6]">
                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-[13px] text-[#0f172a] dark:text-[#ffffff] leading-tight">Default Scheme</h2>
                <p className="text-[11px] font-normal text-gray-500 dark:text-[#6b7a99] mt-0.5">Standard marking criteria</p>
              </div>
            </div>

            {/* Preview block */}
            <div className="bg-gray-50 dark:bg-[rgba(0,0,0,0.2)] rounded-[8px] p-[10px] mb-[16px]">
              {/* Row 1 */}
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] pb-2 mb-2">
                 <span className="text-[11px] font-normal text-gray-500 dark:text-[#8899bb]">Chanting</span>
                 <div className="text-right leading-tight">
                   <div className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6]">25 pts</div>
                   <div className="text-[10px] font-normal text-gray-400 dark:text-[#6b7a99]">max 25 pts</div>
                 </div>
              </div>
              {/* Row 2 */}
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] pb-2 mb-2">
                 <span className="text-[11px] font-normal text-gray-500 dark:text-[#8899bb]">Reading</span>
                 <div className="text-right leading-tight">
                   <div className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6]">20 pts</div>
                   <div className="text-[10px] font-normal text-gray-400 dark:text-[#6b7a99]">max 20 pts</div>
                 </div>
              </div>
              {/* Row 3 */}
              <div className="flex justify-between items-center">
                 <span className="text-[11px] font-normal text-gray-500 dark:text-[#8899bb]">Hearing</span>
                 <div className="text-right leading-tight">
                   <div className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6]">20 pts</div>
                   <div className="text-[10px] font-normal text-gray-400 dark:text-[#6b7a99]">max 20 pts</div>
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between">
               <span className={`px-2.5 py-1 rounded-[20px] text-[10px] font-normal transition-colors ${
                 selectedCard === 'default' 
                  ? 'bg-teal-100 dark:bg-[#1de9b6] text-teal-800 dark:text-[#042C53]' 
                  : 'bg-gray-100 dark:bg-[rgba(255,255,255,0.07)] text-gray-500 dark:text-[#6b7a99]'
               }`}>
                 System Default
               </span>
               <div 
                  onClick={(e) => { e.stopPropagation(); navigate('/counsellor/marking-scheme/default'); }} 
                  className="flex items-center text-teal-600 dark:text-[#1de9b6] font-normal text-[11px] hover:opacity-80 transition-opacity"
                >
                 View all
                 <svg className="w-[14px] h-[14px] ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                 </svg>
               </div>
            </div>
          </div>

          {/* Card 2 — Custom Scheme */}
          <div
            onClick={() => setSelectedCard('custom')}
            className={`relative group bg-white dark:bg-[#112240] rounded-[14px] p-[16px] shadow-sm flex flex-col cursor-pointer active:scale-[0.98] transition-all ${
              selectedCard === 'custom' 
                ? 'border-[1.5px] border-purple-500 dark:border-[#AFA9EC]' 
                : 'border-[1.5px] border-transparent'
            }`}
          >
            {/* Selected Indicator */}
            {selectedCard === 'custom' && (
              <div className="absolute top-[16px] right-[16px] w-[18px] h-[18px] rounded-full bg-purple-500 dark:bg-[#AFA9EC] flex items-center justify-center">
                <svg className="w-3 h-3 text-white dark:text-[#042C53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Top section */}
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-purple-50 dark:bg-[rgba(127,119,221,0.15)] flex items-center justify-center shrink-0 text-purple-500 dark:text-[#AFA9EC]">
                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-[13px] text-[#0f172a] dark:text-[#ffffff] leading-tight">Custom Scheme</h2>
                <p className="text-[11px] font-normal text-gray-500 dark:text-[#6b7a99] mt-0.5">Create your own grading rules</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <svg className="w-[28px] h-[28px] text-purple-400 dark:text-[#AFA9EC] opacity-60 mb-[12px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-[11px] font-normal text-gray-500 dark:text-[#6b7a99] text-center max-w-[180px]">
                Build a personalized scheme to match your goals
              </p>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between">
               <span className="px-2.5 py-1 rounded-[20px] text-[10px] font-normal bg-gray-100 dark:bg-[rgba(255,255,255,0.07)] text-gray-500 dark:text-[#6b7a99]">
                 Coming Soon
               </span>
               <div className="flex items-center text-gray-400 dark:text-[#6b7a99] font-normal text-[11px]">
                 + Create
               </div>
            </div>
          </div>

        </div>

        {/* Hint text */}
        <p className="text-center text-[11px] text-gray-500 dark:text-[#3d4f70] mt-6">
          Tap a card to select it as active
        </p>

      </div>
    </div>
  );
};

export default MarkingScheme;
