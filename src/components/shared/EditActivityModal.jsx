import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EditActivityModal = ({ isOpen, onClose, onSave, onDelete, activityToEdit }) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState('AM');
  const [trackingType, setTrackingType] = useState('Duration');
  const [status, setStatus] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pre-populate data when modal opens if editing an existing activity
  useEffect(() => {
    if (isOpen && activityToEdit) {
      setName(activityToEdit.title || '');
      
      // Handle parsing target for AM/PM into 24-hr format if it's a time activity
      if ((activityToEdit.type === 'TIME' || activityToEdit.type === 'time') && typeof activityToEdit.target === 'string') {
        const timeStr = activityToEdit.target.trim();
        if (timeStr.includes(' ')) {
          const [t, p] = timeStr.split(' ');
          let [h, m] = t.split(':');
          if (h === '12') h = p.toUpperCase() === 'AM' ? '00' : '12';
          else if (p.toUpperCase() === 'PM') h = String(parseInt(h, 10) + 12);
          setTarget(`${String(h).padStart(2, '0')}:${m}`);
        } else {
          setTarget(timeStr);
        }
      } else {
        setTarget(activityToEdit.target || '');
      }
      
      // Example basic mapping (in real app, use enums)
      if (activityToEdit.type === 'COUNT') setTrackingType('Count');
      else if (activityToEdit.type === 'DURATION') setTrackingType('Duration');
      else if (activityToEdit.type === 'TIME') setTrackingType('Time');
      else if (activityToEdit.type === 'YES/NO') setTrackingType('Yes/No');

      setStatus(String(activityToEdit.visibility || '0'));
      setShowDeleteConfirm(false);
    }
  }, [isOpen, activityToEdit]);

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
      ) 
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
    if (!name.trim()) return;
    setIsSubmitting(true);
    if (onSave) {
      await onSave({
        ...activityToEdit,
        id: activityToEdit.id,
        name: name,
        target: target,
        trackingType: trackingType,
        status: status
      });
    }
    setIsSubmitting(false);
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

            <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col h-full">
              
              <div className="flex-grow space-y-6">
                <h2 className="text-[24px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">Edit Activity</h2>

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
                      className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-medium text-[15px] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 dark:focus:border-blue-800 placeholder-gray-400 dark:placeholder-gray-500 transition-all cursor-pointer"
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
                          className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-medium text-[15px] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 dark:focus:border-blue-800 placeholder-gray-400 dark:placeholder-gray-500 transition-all cursor-pointer font-mono"
                          style={{ colorScheme: 'dark light' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 pb-2">
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
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Delete Button */}
              <div className="w-full pt-4 mt-2 mb-2 flex justify-center border-t border-gray-300 dark:border-[#334155]">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-500 font-bold hover:text-red-600 transition-colors py-2 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30"
                  aria-label="Delete Activity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Activity
                </button>
              </div>

            </div>
          </motion.div>

          {/* Centered Delete Confirmation Popup */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white dark:bg-[#1E293B] rounded-[24px] p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <h3 className="text-[18px] font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2">Delete Activity?</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-[#94A3B8] mb-6">Are you sure you want to delete this activity? This action cannot be undone.</p>
                  
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3.5 bg-gray-100 dark:bg-[#334155] hover:bg-gray-200 dark:hover:bg-[#475569] text-[#0f172a] dark:text-[#F8FAFC] rounded-xl font-bold transition-colors active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        if (onDelete) onDelete(activityToEdit?.id);
                      }}
                      className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-colors active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditActivityModal;
