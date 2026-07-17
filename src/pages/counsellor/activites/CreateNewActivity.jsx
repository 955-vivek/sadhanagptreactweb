import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateNewActivity = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [trackingType, setTrackingType] = useState('Duration');
  const [target, setTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trackingTypes = [
    {
      id: 'Count',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[10px] tracking-wider mb-2 transition-colors ${isSelected ? 'bg-[rgba(29,233,182,0.12)] text-[#1de9b6]' : 'bg-[rgba(255,255,255,0.03)] text-[#6b7a99]'}`}>
          123
        </div>
      )
    },
    {
      id: 'Duration',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isSelected ? 'bg-[rgba(29,233,182,0.12)] text-[#1de9b6]' : 'bg-[rgba(255,255,255,0.03)] text-[#6b7a99]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      )
    },
    {
      id: 'Time',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isSelected ? 'bg-[rgba(29,233,182,0.12)] text-[#1de9b6]' : 'bg-[rgba(255,255,255,0.03)] text-[#6b7a99]'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
      )
    },
    {
      id: 'Yes/No',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${isSelected ? 'bg-[rgba(29,233,182,0.12)] text-[#1de9b6]' : 'bg-[rgba(255,255,255,0.03)] text-[#6b7a99]'}`}>
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
        name: name,
        trackingType: trackingType,
        target: target
      });
    }
    setIsSubmitting(false);
    
    setName('');
    setTrackingType('Duration');
    setTarget('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-[2px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[400px] bg-[#0b1628] rounded-[28px] shadow-2xl border border-[rgba(255,255,255,0.06)] flex flex-col z-10"
          >
            {/* Drag Handle Area */}
            <div 
              className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-[#0b1628] rounded-t-[28px] z-10 cursor-pointer sm:hidden"
              onClick={onClose}
            >
              <div className="w-[36px] h-[4px] rounded-full bg-[rgba(255,255,255,0.15)]"></div>
            </div>

            <div className="px-6 pb-6 pt-2 sm:pt-6 max-h-[85vh] overflow-y-auto custom-scrollbar space-y-5">
              <h2 className="text-[20px] font-extrabold text-white">New Activity</h2>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#6b7a99] uppercase tracking-wider">Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-[#6b7a99]">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Morning Yoga"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#112240] text-white font-medium text-[14px] rounded-[14px] py-3.5 pl-11 pr-4 outline-none border border-[rgba(255,255,255,0.1)] focus:border-[#1de9b6] placeholder-[rgba(255,255,255,0.3)] transition-colors"
                  />
                </div>
              </div>


              {/* Tracking Type Grid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#6b7a99] uppercase tracking-wider">Tracking Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {trackingTypes.map((type) => {
                    const isSelected = trackingType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setTrackingType(type.id)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-[16px] border transition-all ${
                          isSelected 
                            ? 'border-[#1de9b6] bg-[rgba(29,233,182,0.05)]' 
                            : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-[#1de9b6]">
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {type.icon(isSelected)}
                        <span className={`text-[13px] font-bold ${isSelected ? 'text-white' : 'text-[#6b7a99]'}`}>
                          {type.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Input */}
              {trackingType.toLowerCase() !== 'yes/no' && (
                <div className="space-y-1.5 mb-2">
                  <label className="text-[11px] font-bold text-[#6b7a99] uppercase tracking-wider">Target</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow flex items-center">
                      <span className="absolute left-4 text-[#6b7a99]">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
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
                        className="w-full bg-[#112240] text-white font-medium text-[14px] rounded-[14px] py-3.5 pl-11 pr-4 outline-none border border-[rgba(255,255,255,0.1)] focus:border-[#1de9b6] placeholder-[rgba(255,255,255,0.3)] transition-colors font-mono"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <button 
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium rounded-[12px] hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting || !name.trim()}
                  className="flex-[1.5] py-3.5 bg-[#1de9b6] text-[#042C53] text-[14px] font-semibold rounded-[12px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#1de9b6]/20 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-[2px] border-[#042C53] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Save Activity"
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateNewActivity;
