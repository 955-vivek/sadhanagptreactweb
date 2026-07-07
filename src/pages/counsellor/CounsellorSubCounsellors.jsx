import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import { getRequest } from '../../services/api';
import ThemeToggle from '../../components/shared/ThemeToggle';

const CounsellorSubCounsellors = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();

  const [subCounsellorList, setSubCounsellorList] = useState([]);
  const [selectedSubCounsellor, setSelectedSubCounsellor] = useState('');
  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const observerTarget = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch sub-counsellor list
  useEffect(() => {
    getRequest('/sub-counsellor-list', { user_id: userDetails.user_id }, (response) => {
      const res = response?.data;
      if (res?.status === 1 && Array.isArray(res.data)) {
        setSubCounsellorList(res.data);
      }
    });
  }, [userDetails.user_id]);

  // Fetch groups based on selected sub-counsellor
  const fetchGroups = useCallback((pageNum = 1, append = false) => {
    if (!selectedSubCounsellor) {
      setGroups([]);
      return;
    }
    setIsLoading(true);
    const payload = {
      user_id: userDetails.user_id,
      sub_counsellor_id: selectedSubCounsellor,
      page_no: pageNum,
      search_text: searchQuery,
      rowSelected: 10
    };

    getRequest('/group-list-sub-counslor', payload, (response) => {
      const res = response?.data;
      if (res?.status === 1 && Array.isArray(res.data)) {
        setGroups(prev => append ? [...prev, ...res.data] : res.data);
        setTotalPages(res.total_page || 1);
      } else {
        if (!append) setGroups([]);
      }
      setIsLoading(false);
    });
  }, [userDetails.user_id, selectedSubCounsellor, searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchGroups(1, false);
  }, [fetchGroups]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading && page < totalPages) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGroups(nextPage, true);
      }
    }, { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [page, totalPages, isLoading, fetchGroups]);

  const filteredGroups = groups.filter(g => {
    const name = g.name || g.center_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedSCName = subCounsellorList.find(sc => sc.user_id === selectedSubCounsellor)?.name || '';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] font-sans relative transition-colors duration-300">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-4 right-4 z-[100] flex justify-center"
          >
            <div className={`px-6 py-3 rounded-2xl shadow-xl font-bold text-sm text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-gray-900 dark:bg-[#1E293B]'}`}>
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md mx-auto pb-[100px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20 border-b border-gray-300 dark:border-[#1E293B] transition-colors duration-300">
          <button onClick={() => navigate(-1)} className="text-[#64748b] dark:text-[#CBD5E1] font-bold text-[16px]">Back</button>
          <h1 className="text-[18px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">Sub Counsellors</h1>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <input
            type="text"
            placeholder="Search by group name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8fafc] dark:bg-[#1E293B] rounded-full py-3.5 px-6 text-[15px] font-medium text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8] outline-none transition-colors duration-300"
          />
        </div>

        {/* Sub Counsellor Filter */}
        <div className="px-6 pb-4">
          <div className="relative">
            <select
              value={selectedSubCounsellor}
              onChange={(e) => setSelectedSubCounsellor(e.target.value)}
              className={`w-full appearance-none font-bold text-[14px] rounded-2xl py-4 pl-5 pr-10 border-2 outline-none transition-all cursor-pointer ${
                selectedSubCounsellor ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f1f5f9] dark:bg-[#1E293B] border-transparent text-[#0f172a] dark:text-[#F8FAFC]'
              }`}
            >
              <option value="">All Sub-Counsellors</option>
              {subCounsellorList.map(sc => (
                <option key={sc.user_id} value={sc.user_id}>{sc.name}</option>
              ))}
            </select>
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${selectedSubCounsellor ? 'text-white' : 'text-[#64748b] dark:text-[#94A3B8]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        {selectedSubCounsellor && (
          <div className="mx-6 mb-4 p-4 bg-blue-50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 9a7 7 0 1 1 14 0H5z"/></svg>
            </div>
            <div>
              <p className="font-black text-blue-900 text-sm">{selectedSCName}</p>
              <p className="text-blue-600 font-bold text-xs">Viewing assigned groups</p>
            </div>
          </div>
        )}

        {/* Group List */}
        <div className="px-2 mt-2">
          {!selectedSubCounsellor ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-blue-50 dark:bg-[#1E293B] rounded-[28px] flex items-center justify-center mx-auto mb-5 transition-colors duration-300">
                <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 9a7 7 0 1 1 14 0H5z"/></svg>
              </div>
              <p className="font-black text-gray-800 dark:text-[#F8FAFC] text-lg transition-colors duration-300">Select a Sub-Counsellor</p>
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold text-sm mt-2 transition-colors duration-300">Choose from the dropdown above<br/>to view their assigned groups</p>
            </div>
          ) : isLoading && groups.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 font-bold text-sm mt-3">Loading groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              </div>
              <p className="font-black text-gray-400">No groups found</p>
              <p className="text-gray-300 text-sm font-bold mt-1">
                {selectedSubCounsellor ? 'This sub-counsellor has no groups assigned' : 'No groups available'}
              </p>
            </div>
          ) : (
            filteredGroups.map((g, idx) => (
              <motion.div
                key={g.center_id || g.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center px-4 py-4 border-b border-gray-50 dark:border-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(g.name || g.center_name || 'G')}&background=eff6ff&color=1a73e8&bold=true`}
                  className="w-12 h-12 rounded-full mr-4 border border-blue-50"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-[16px] text-[#0f172a] dark:text-[#F8FAFC] truncate transition-colors duration-300">{g.name || g.center_name || '—'}</h3>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-colors duration-300">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                      {g.total_student ?? 0} students
                    </span>
                    {g.city && (
                      <span className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
                        {g.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-200 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </motion.div>
            ))
          )}

          {/* Infinite Scroll Target */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {isLoading && groups.length > 0 && (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorSubCounsellors;
