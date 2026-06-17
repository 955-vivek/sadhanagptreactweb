import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MentorDetailsModal = ({ isOpen, onClose, mentor }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!isOpen || !mentor) return null;

  console.log("Mentor Data:", mentor);
  console.log("Mentor Image:", mentor?.profile_image || mentor?.avatar || mentor?.mentor_profile_image);
  console.log("Mentor Email:", mentor?.email || mentor?.mentor_email);
  console.log("Mentor DOB:", mentor?.dob || mentor?.mentor_dob);

  // Format DOB safely
  let formattedDob = 'Not provided';
  const rawDob = mentor.dob || mentor.mentor_dob;
  if (rawDob) {
    try {
      const date = new Date(rawDob);
      if (!isNaN(date.getTime())) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        formattedDob = `${dd}-${mm}-${yyyy}`;
      }
    } catch (e) {
      console.error("Invalid DOB format:", rawDob);
    }
  }

  // Use correct image URL logic matching Profile.jsx
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_IMAGE_URL}${path}`;
  };

  const displayName = mentor.name || mentor.mentor_name || 'Not provided';
  const displayEmail = mentor.email || mentor.mentor_email || 'Not provided';
  const displayImage = mentor.mentor_profile_image || mentor.profile_image || mentor.avatar;
  const hasImage = !!displayImage;

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName !== 'Not provided' ? displayName : displayEmail)}&background=f97316&color=fff&size=400`;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-[90%] max-w-[360px] bg-white dark:bg-[#1E293B] rounded-[32px] shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Floating Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-gray-100/80 dark:bg-[#334155]/80 text-gray-500 dark:text-[#CBD5E1] hover:bg-gray-200 dark:hover:bg-[#475569] hover:text-gray-700 dark:hover:text-[#F8FAFC] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {/* Scrollable Content */}
              <div className="p-6 md:p-8 flex flex-col items-center overflow-y-auto custom-scrollbar">
                
                {/* Profile Header Section */}
                <div className="flex flex-col items-center w-full mt-2 mb-6">
                  {/* Circular Avatar */}
                  <div 
                    onClick={() => hasImage && setIsPreviewOpen(true)}
                    className={`w-[90px] h-[90px] md:w-[110px] md:h-[110px] rounded-full overflow-hidden bg-[#f8fafc] dark:bg-[#334155] border-4 border-white dark:border-[#1E293B] flex flex-shrink-0 items-center justify-center mb-4 ${hasImage ? 'cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95' : ''}`}
                    style={{
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                    }}
                  >
                    <img
                      src={getImageUrl(displayImage) || fallbackAvatar}
                      className="w-full h-full object-cover"
                      alt="Mentor Profile"
                    />
                  </div>
                  
                  {/* Name & Role */}
                  <h3 className="text-xl font-black text-slate-800 dark:text-[#F8FAFC] tracking-tight text-center mb-1">
                    {displayName}
                  </h3>
                  <div className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest rounded-full">
                    Counsellor
                  </div>
                </div>

                {/* Compact Details Section */}
                <div className="w-full space-y-3">
                  
                  {/* Name Row */}
                  <div className="flex items-center gap-4 p-3.5 bg-gray-50/80 dark:bg-[#334155]/80 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-2xl transition-colors border border-gray-100/50 dark:border-[#475569]/50">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest mb-0.5">Name</p>
                      <p className="text-[14px] font-bold text-slate-800 dark:text-[#F8FAFC] truncate">{displayName}</p>
                    </div>
                  </div>

                  {/* Email Row */}
                  <div className="flex items-center gap-4 p-3.5 bg-gray-50/80 dark:bg-[#334155]/80 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-2xl transition-colors border border-gray-100/50 dark:border-[#475569]/50">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest mb-0.5">Email</p>
                      <p className="text-[14px] font-bold text-slate-800 dark:text-[#F8FAFC] break-all">{displayEmail}</p>
                    </div>
                  </div>

                  {/* DOB Row */}
                  <div className="flex items-center gap-4 p-3.5 bg-gray-50/80 dark:bg-[#334155]/80 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-2xl transition-colors border border-gray-100/50 dark:border-[#475569]/50">
                    <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-8v2m3 6v2M9 11h.01M12 11h.01M15 11h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest mb-0.5">Date of Birth</p>
                      <p className="text-[14px] font-bold text-slate-800 dark:text-[#F8FAFC] truncate">{formattedDob}</p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPreviewOpen && hasImage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[600px] flex flex-col items-center justify-center z-10"
            >
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute -top-12 right-0 sm:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="w-full max-h-[80vh] bg-black/20 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 p-2">
                <img
                  src={getImageUrl(displayImage)}
                  alt="Mentor Full Preview"
                  className="w-full h-full max-h-[75vh] object-contain rounded-2xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MentorDetailsModal;
