import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/shared/ThemeToggle';

const UnderConstruction = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F172A] font-sans flex flex-col items-center justify-center p-6 text-center relative overflow-hidden transition-colors duration-300">
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-100 dark:bg-blue-900/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
      <div className="absolute top-20 right-10 w-32 h-32 bg-purple-100 dark:bg-purple-900/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-32 h-32 bg-indigo-100 dark:bg-indigo-900/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-sm mx-auto relative z-10 flex flex-col items-center mt-[-10vh]">
        
        {/* Animated Icon Container */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-32 h-32 bg-white dark:bg-[#1E293B] rounded-full shadow-2xl flex items-center justify-center relative mb-8 border-[6px] border-[#f1f5f9] dark:border-[#334155] transition-colors duration-300"
        >
          {/* Construction SVG */}
          <div className="absolute inset-0 flex items-center justify-center text-[#1a73e8]">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.75 3.5a1.25 1.25 0 0 0-1.5 0l-7.75 5.5A1.25 1.25 0 0 0 4.25 11h15.5a1.25 1.25 0 0 0 .75-2l-7.75-5.5z" opacity="0.3" />
              <path d="M4 11a1 1 0 0 0-1 1v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a1 1 0 0 0-1-1H4zm3 7a1 1 0 1 1 0-2h10a1 1 0 1 1 0 2H7z" />
              <path fillRule="evenodd" d="M12.75 3.5a1.25 1.25 0 0 0-1.5 0l-7.75 5.5A1.25 1.25 0 0 0 4.25 11h15.5a1.25 1.25 0 0 0 .75-2l-7.75-5.5zm-1.02.43a.5.5 0 0 1 .54 0l7.75 5.5a.5.5 0 0 1-.27.92H4.25a.5.5 0 0 1-.27-.92l7.75-5.5z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Rotating Gears */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute -top-4 -right-4 w-12 h-12 bg-[#f97316] rounded-full shadow-lg flex items-center justify-center text-white"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[28px] font-black text-[#0f172a] dark:text-[#F8FAFC] tracking-tight leading-tight mb-3 transition-colors duration-300"
        >
          Coming Soon
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[15px] font-medium text-[#64748b] dark:text-[#94A3B8] mb-10 leading-relaxed px-4 transition-colors duration-300"
        >
          We are currently working hard behind the scenes to build this feature. It will be available very soon!
        </motion.p>

        {/* Buttons */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full flex justify-center gap-4 px-2"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-white dark:bg-[#1E293B] border-2 border-gray-400/70 dark:border-[#334155] hover:border-gray-400/70 dark:hover:border-[#475569] hover:bg-gray-50 dark:hover:bg-[#334155] text-[#475569] dark:text-[#CBD5E1] font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 shadow-sm outline-none flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 outline-none"
          >
            Go Home
          </button>
        </motion.div>
        
      </div>
    </div>
  );
};

export default UnderConstruction;
