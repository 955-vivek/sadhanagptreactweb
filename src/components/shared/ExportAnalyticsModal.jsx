import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ExportAnalyticsModal = ({ isOpen, onClose, onExportCSV, onExportExcel, onExportPDF, hideDuration = false }) => {
  const [exportDuration, setExportDuration] = useState('7');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  if (!isOpen) return null;

  const handleExport = (handler) => {
    if (hideDuration) {
      handler(null);
    } else {
      handler({ duration: exportDuration, startDate: exportStartDate, endDate: exportEndDate });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0F172A] rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative border border-[#1E293B]"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <h2 className="text-[24px] font-extrabold text-white mb-6 tracking-tight">Export Analytics</h2>

          <div className="space-y-4">
            {!hideDuration && (
              <>
                <div className="flex items-center gap-3 w-full bg-[#1E293B] p-2 rounded-xl border border-gray-700">
                  <span className="text-gray-400 font-bold px-2 text-sm flex-shrink-0">Duration:</span>
                  <select 
                    value={exportDuration} 
                    onChange={(e) => setExportDuration(e.target.value)}
                    className="bg-[#0F172A] text-[#F8FAFC] font-bold px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer border border-transparent hover:border-gray-600 transition-colors w-full"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {exportDuration === 'custom' && (
                  <div className="flex gap-2 items-center text-sm font-bold bg-[#1E293B] p-3 rounded-xl border border-gray-700">
                    <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full bg-transparent outline-none text-white [color-scheme:dark]" />
                    <span className="text-gray-400">to</span>
                    <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full bg-transparent outline-none text-white [color-scheme:dark]" />
                  </div>
                )}
              </>
            )}

            <div className="pt-2 space-y-3">
              {/* Excel Button */}
              <button
                onClick={() => handleExport(onExportExcel)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-[#1E293B] hover:bg-[#334155] active:scale-[0.98] transition-all group border border-transparent hover:border-gray-700"
              >
                <span className="text-white font-bold text-[16px]">Excel (.xls)</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>

              {/* CSV Button */}
              <button
                onClick={() => handleExport(onExportCSV)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-[#1E293B] hover:bg-[#334155] active:scale-[0.98] transition-all group border border-transparent hover:border-gray-700"
              >
                <span className="text-white font-bold text-[16px]">CSV (.csv)</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>

              {/* Print PDF Button */}
              <button
                onClick={() => handleExport(onExportPDF)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-[#1E293B] hover:bg-[#334155] active:scale-[0.98] transition-all group border border-transparent hover:border-gray-700"
              >
                <span className="text-white font-bold text-[16px]">Print PDF</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportAnalyticsModal;
