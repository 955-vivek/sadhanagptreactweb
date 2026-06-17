import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EditPersonalInfoModal = ({ isOpen, onClose, userInfo, onSave }) => {
  const [name, setName] = useState(userInfo.name);
  const [mobile, setMobile] = useState(userInfo.mobile);

  useEffect(() => {
    setName(userInfo.name);
    setMobile(userInfo.mobile);
  }, [userInfo, isOpen]);

  const handleSave = () => {
    if (name.trim() && mobile.trim()) {
      onSave({ name, mobile });
    }
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[201] flex justify-center"
          >
            <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-t-[40px] p-8 pb-12 shadow-2xl">
              {/* Drag Handle / Close Touch Area */}
              <div 
                onClick={onClose}
                className="w-full flex justify-center mb-8 cursor-pointer group"
              >
                <div className="w-12 h-1.5 bg-gray-100 dark:bg-[#334155] rounded-full group-hover:bg-gray-200 dark:group-hover:bg-[#475569] transition-colors" />
              </div>

              <h2 className="text-[24px] font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2 tracking-tight">Edit Info</h2>
              <p className="text-[14px] font-medium text-gray-400 dark:text-[#CBD5E1] mb-8 tracking-tight leading-relaxed">
                Update your name and mobile number below.
              </p>

              <div className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-bold text-[16px] rounded-2xl py-4 px-6 outline-none border-2 border-transparent focus:border-[#fef3c7] dark:focus:border-yellow-900/50 focus:bg-white dark:focus:bg-[#1E293B] transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                  />
                </div>

                {/* Mobile Field */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest ml-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-bold text-[16px] rounded-2xl py-4 px-6 outline-none border-2 border-transparent focus:border-[#fef3c7] dark:focus:border-yellow-900/50 focus:bg-white dark:focus:bg-[#1E293B] transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#334155] text-[#94a3b8] dark:text-[#CBD5E1] font-black text-[15px] hover:bg-gray-100 dark:hover:bg-[#475569] transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!name.trim() || !mobile.trim()}
                    className="flex-[2] py-4 rounded-2xl bg-[#f97316] text-white font-black text-[15px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditPersonalInfoModal;
