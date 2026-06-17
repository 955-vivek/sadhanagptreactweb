import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Remove", 
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isLoading ? onClose : undefined}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        ></motion.div>
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-[360px] bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col p-6 items-center text-center"
        >
          {/* Warning Icon Container */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${isDestructive ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-[20px] font-black text-slate-800 dark:text-[#F8FAFC] tracking-tight mb-2">
            {title}
          </h3>
          
          <p className="text-[14px] text-gray-500 dark:text-[#CBD5E1] font-medium leading-relaxed mb-8 px-2">
            {description}
          </p>

          <div className="w-full flex gap-3">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 bg-gray-50 dark:bg-[#334155] hover:bg-gray-100 dark:hover:bg-[#475569] text-gray-600 dark:text-[#F8FAFC] rounded-xl font-bold text-[15px] transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3.5 rounded-xl font-bold text-[15px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                isDestructive 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20' 
                  : 'bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm shadow-orange-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
