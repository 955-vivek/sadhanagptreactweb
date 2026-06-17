import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NewActivityModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [trackingType, setTrackingType] = useState('Duration'); // Default select
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState('AM');
  const [status, setStatus] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trackingTypes = [
    {
      id: 'Count',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#1E293B] flex items-center justify-center text-gray-400 dark:text-[#CBD5E1] font-bold text-[10px] tracking-wider mb-2">
          123
        </div>
      )
    },
    {
      id: 'Duration',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#1E293B] flex items-center justify-center text-gray-400 dark:text-[#CBD5E1] mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      )
    },
    {
      id: 'Time',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#1E293B] flex items-center justify-center text-gray-400 dark:text-[#CBD5E1] mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
      ) // Reusing icon style from image visually
    },
    {
      id: 'Yes/No',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#1E293B] flex items-center justify-center text-gray-400 dark:text-[#CBD5E1] mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
      )
    }
  ];

  const handleSave = async () => {
    // Basic validation
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    if (onSave) {
      await onSave({
        name: name,
        trackingType: trackingType,
        target: target,
        status: status
      });
    }
    setIsSubmitting(false);
    
    // Reset form
    setName('');
    setTrackingType('Duration');
    setTarget('');
    setStatus('0');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] w-full max-w-md mx-auto"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 w-full max-w-md mx-auto bg-white dark:bg-[#1E293B] rounded-t-[32px] shadow-2xl z-[90] flex flex-col"
            style={{
              left: 'auto',
              right: 'max(0px, calc(50% - 224px))'
            }}
          >
            {/* Drag Handle Area - Clickable to close as requested */}
            <div 
              className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white dark:bg-[#1E293B] rounded-t-[32px] z-10 cursor-pointer"
              onClick={onClose}
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#334155] rounded-full"></div>
            </div>

            <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar space-y-6">
              <h2 className="text-[24px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">New Activity</h2>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-gray-500 dark:text-[#CBD5E1] uppercase tracking-wider">Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Morning Yoga"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-medium text-[15px] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 dark:focus:border-blue-800 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  />
                </div>
              </div>


              {/* Tracking Type Grid */}
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-gray-500 dark:text-[#CBD5E1] uppercase tracking-wider">Tracking Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {trackingTypes.map((type) => {
                    const isSelected = trackingType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setTrackingType(type.id)}
                        className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                          isSelected 
                            ? 'border-[#1a73e8] dark:border-blue-500 bg-[#f0f7ff] dark:bg-blue-900/30' 
                            : 'border-gray-100 dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-gray-200 dark:hover:border-[#475569]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-[#1a73e8] dark:text-blue-400">
                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {type.icon}
                        <span className={`text-[14px] font-bold ${isSelected ? 'text-[#0f172a] dark:text-[#F8FAFC]' : 'text-gray-500 dark:text-[#CBD5E1]'}`}>
                          {type.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Input */}
              {trackingType.toLowerCase() !== 'yes/no' && (
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-gray-500 dark:text-[#CBD5E1] uppercase tracking-wider">Target</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow flex items-center">
                      <span className="absolute left-4 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                      </span>
                      <input
                        key={trackingType}
                        type={trackingType.toLowerCase() === 'time' ? 'time' : 'number'}
                        min="0"
                        placeholder={
                          trackingType.toLowerCase() === 'count' ? 'Enter target rounds' :
                          trackingType.toLowerCase() === 'duration' ? 'Enter target duration (mins)' :
                          trackingType.toLowerCase() === 'time' ? '05:00' :
                          'Enter target'
                        }
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-medium text-[15px] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 dark:focus:border-blue-800 placeholder-gray-400 dark:placeholder-gray-500 transition-all font-mono"
                        style={{ colorScheme: 'dark light' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Visibility Options */}
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-gray-500 dark:text-[#CBD5E1] uppercase tracking-wider flex items-center gap-2">
                  Visibility
                  <div className="group relative flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-[#334155] text-gray-500 dark:text-[#CBD5E1] text-[10px] cursor-help">
                    ?
                    <div className="absolute bottom-full mb-2 w-48 p-2 bg-gray-800 dark:bg-[#F8FAFC] text-white dark:text-[#0F172A] text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg text-center z-50 normal-case font-medium">
                      Private activities are unlisted and hidden from your mentor completely.
                    </div>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStatus('0')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      status === '0' 
                        ? 'border-[#1a73e8] bg-[#eff6ff] text-[#1a73e8] dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400' 
                        : 'border-transparent bg-[#f8fafc] dark:bg-[#0F172A] text-gray-500 dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#334155]'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-bold text-[14px]">Public</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5 text-center">Share with Mentor</span>
                  </button>

                  <button
                    onClick={() => setStatus('1')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      status === '1' 
                        ? 'border-[#f59e0b] bg-[#fffbeb] text-[#f59e0b] dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-400' 
                        : 'border-transparent bg-[#f8fafc] dark:bg-[#0F172A] text-gray-500 dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#334155]'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    <span className="font-bold text-[14px]">Private</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5 text-center">Unlisted / Hidden</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 pb-4">
                <button 
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-4 text-[15px] font-bold text-gray-500 dark:text-[#CBD5E1] hover:text-gray-700 dark:hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-[#1a73e8] hover:bg-[#155fc3] text-white text-[15px] font-bold rounded-full transition-all active:scale-[0.98] shadow-lg shadow-[#1a73e8]/30 flex flex-col items-center justify-center h-[56px] disabled:opacity-70 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-[2px] border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Save Activity"
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewActivityModal;
