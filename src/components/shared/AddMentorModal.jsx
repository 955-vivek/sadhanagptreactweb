import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest } from '../../services/api';

const AddMentorModal = ({ isOpen, onClose, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [counselors, setCounselors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState(null);

  // Clear modal state when opened/closed status changes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setCounselors([]);
      setSelectedCounselor(null);
    }
  }, [isOpen]);

  const fetchCounselors = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setCounselors([]);
      return;
    }

    setIsSearching(true);
    getRequest(`/counsellor-list`, { search_text: searchText }, (response) => {
      const res = response.data;
      if (res && res.data && Array.isArray(res.data)) {
        setCounselors(res.data);
      } else if (Array.isArray(res)) {
        setCounselors(res);
      } else {
        setCounselors([]);
      }
      setIsSearching(false);
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (selectedCounselor) {
      setSelectedCounselor(null);
    }
    
    fetchCounselors(value);
  };

  const handleSelectCounselor = (counselor) => {
    setSelectedCounselor(counselor);
    setSearchQuery(counselor.name || counselor.email);
    setCounselors([]);
  };

  const handleAdd = () => {
    // If a specific counselor isn't clicked, we could allow the text as fallback, but typically we want the selected object 
    if (selectedCounselor) {
      onAdd(selectedCounselor);
    } else if (searchQuery.trim()) {
      // Fallback: pass raw string like before (for backwards compatibility if no API matches)
      onAdd(searchQuery);
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center"
          >
            <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-t-[40px] p-8 pb-12 shadow-2xl">
              {/* Drag Handle / Close Touch Area */}
              <div 
                onClick={onClose}
                className="w-full flex justify-center mb-8 cursor-pointer group"
              >
                <div className="w-12 h-1.5 bg-gray-100 dark:bg-[#334155] rounded-full group-hover:bg-gray-200 dark:group-hover:bg-[#475569] transition-colors" />
              </div>

              <h2 className="text-[24px] font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2 tracking-tight">Add Mentor</h2>
              <p className="text-[14px] font-medium text-gray-400 dark:text-[#CBD5E1] mb-8 tracking-tight leading-relaxed">
                Enter the name or email address of the mentor you'd like to connect with.
              </p>

              <div className="space-y-6">
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest ml-1">Search Mentor</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name or email address..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-bold text-[16px] rounded-2xl py-4 px-6 outline-none border-2 border-transparent focus:border-[#fef3c7] dark:focus:border-yellow-900/50 focus:bg-white dark:focus:bg-[#1E293B] transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      )}
                    </div>
                  </div>

                  {/* Search Results Dropdown */}
                  {counselors.length > 0 && !selectedCounselor && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1E293B] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl shadow-xl overflow-hidden max-h-[220px] overflow-y-auto">
                      {counselors.map((counselor) => (
                        <div
                          key={counselor.user_id}
                          onClick={() => handleSelectCounselor(counselor)}
                          className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#334155] border-b border-[#f1f5f9] dark:border-[#334155] last:border-none cursor-pointer group transition-colors"
                        >
                          <p className="text-[15px] font-bold text-[#0f172a] dark:text-[#F8FAFC] group-hover:text-[#f97316] dark:group-hover:text-orange-400">
                            {counselor.name}
                          </p>
                          <p className="text-[13px] text-[#64748b] dark:text-[#CBD5E1]">
                            {counselor.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Indicator */}
                  {selectedCounselor && (
                    <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl text-sm border border-orange-100 dark:border-orange-900/50 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold">Mentor Selected</span>
                      <button
                        onClick={() => {
                          setSelectedCounselor(null);
                          setSearchQuery('');
                        }}
                        className="ml-auto text-orange-600 hover:text-orange-800 font-bold px-2 py-1 rounded hover:bg-orange-100/50 transition-colors"
                      >
                         Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#334155] text-[#94a3b8] dark:text-[#CBD5E1] font-black text-[15px] hover:bg-gray-100 dark:hover:bg-[#475569] transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!searchQuery.trim()}
                    className="flex-[2] py-4 rounded-2xl bg-[#f97316] text-white font-black text-[15px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                  >
                    Add Mentor
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

export default AddMentorModal;
