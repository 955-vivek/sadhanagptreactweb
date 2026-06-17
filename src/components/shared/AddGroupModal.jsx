import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AddGroupModal = ({ isOpen, onClose, onSave }) => {
  const [groupName, setGroupName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    setError('');
    onSave({ name: groupName, city: city });
    setGroupName('');
    setCity('');
    onClose();
  };

  const handleClose = () => {
    setError('');
    setGroupName('');
    setCity('');
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-50 transition-opacity"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                handleClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white dark:bg-[#1E293B] rounded-t-[32px] z-50 px-6 pb-8 pt-4 shadow-2xl"
          >
            {/* Drag Handle Base - clickable area */}
            <div 
              onClick={handleClose}
              className="w-full h-6 absolute top-0 left-0 flex items-center justify-center cursor-pointer cursor-grab active:cursor-grabbing"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#334155] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6 mt-4">
              <h2 className="text-[20px] font-bold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight">Add New Group</h2>
              <button 
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#334155] flex items-center justify-center text-gray-400 dark:text-[#CBD5E1] hover:text-gray-600 dark:hover:text-[#F8FAFC] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-[#1e293b] dark:text-[#CBD5E1] mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    if (e.target.value.trim()) setError('');
                  }}
                  placeholder="Enter group name"
                  className={`w-full border ${error && !groupName.trim() ? 'border-red-200 dark:border-red-900/50 focus:border-red-400 focus:ring-red-400' : 'border-[#e2e8f0] dark:border-[#334155] focus:border-[#1a73e8] dark:focus:border-blue-500 focus:ring-[#1a73e8] dark:focus:ring-blue-500'} bg-white dark:bg-[#0F172A] rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 outline-none transition-all`}
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#1e293b] dark:text-[#CBD5E1] mb-2">
                  City
                  <span className="ml-1 text-[12px] font-normal text-gray-400 dark:text-[#94a3b8]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="w-full border border-[#e2e8f0] dark:border-[#334155] focus:border-[#1a73e8] dark:focus:border-blue-500 focus:ring-[#1a73e8] dark:focus:ring-blue-500 bg-white dark:bg-[#0F172A] rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-1 outline-none transition-all"
                />
              </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="flex items-center gap-1.5 text-red-500 overflow-hidden"
                    >
                      <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[13px] font-medium">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <button 
                onClick={handleSubmit}
                className="w-full py-4 rounded-full bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold text-[16px] shadow-lg shadow-[#1a73e8]/30 active:scale-[0.98] transition-all"
              >
                Submit
              </button>
              <button 
                onClick={handleClose}
                className="w-full py-4 rounded-full text-[#475569] dark:text-[#CBD5E1] font-bold text-[16px] hover:bg-gray-50 dark:hover:bg-[#334155] active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddGroupModal;
