import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import AddGroupModal from '../../components/shared/AddGroupModal';
import ReportSettingsModal from '../../components/counsellor/ReportSettingsModal';
import { useOutletContext } from 'react-router-dom';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import ThemeToggle from '../../components/shared/ThemeToggle';

const CounsellorAnalytics = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total_page: 1, total: 0 });
  const [irregularCount, setIrregularCount] = useState(0);
  const carouselRef = useRef(null);
  const [totalMenteesCount, setTotalMenteesCount] = useState(0);

  const [toastState, setToastState] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    const msg = Array.isArray(message) ? message[0] : message;
    setToastState({ show: true, message: msg, type });
    setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 4000);
  };

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error')
  };

  const [selectedGroupForLabels, setSelectedGroupForLabels] = useState('');
  const [groupLabels, setGroupLabels] = useState({});
  const [newLabelName, setNewLabelName] = useState('');

  const fetchLabels = useCallback((centerId) => {
    if (!centerId) return;
    setIsLoadingLabels(true);
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setGroupLabels(prev => ({
          ...prev,
          [centerId]: res.data.map(l => ({ id: l.label_id, name: l.label_name }))
        }));
      }
      setIsLoadingLabels(false);
    });
  }, [userDetails.user_id]);

  useEffect(() => {
    if (isLabelsModalOpen && selectedGroupForLabels) {
      fetchLabels(selectedGroupForLabels);
    }
  }, [selectedGroupForLabels, isLabelsModalOpen, fetchLabels]);

  useEffect(() => {
    if (carouselRef.current) {
      // Force scroll reset to left-most position when groups update
      carouselRef.current.scrollLeft = 0;
    }
  }, [groups]);


  const fetchGroups = async (page = 1) => {
    try {
      setIsLoadingGroups(true);
      const payload = {
        user_id: userDetails.user_id,
        page_no: page
      };

      getRequest('/group-list', payload, (response) => {
        const res = response.data;
        if (res && res.code === 200 && Array.isArray(res.data)) {
          const fetchedGroups = res.data.map(g => ({
            id: g.center_id,
            name: g.name,
            members: g.total_student || 0,
            status: g.city || 'Active',
            image: '/group.jpg',
            statusIcon: '⚡',
            iconColor: 'bg-blue-500'
          }));

          setGroups(fetchedGroups);
          setPagination({
            page: page,
            total_page: res.total_page || 1,
            total: res.total || 0
          });

          if (fetchedGroups.length > 0 && !selectedGroupForLabels) {
            setSelectedGroupForLabels(fetchedGroups[0].id);
          }
        }
        setIsLoadingGroups(false);
      });
    } catch (error) {
      console.error("Error fetching groups:", error);
      setIsLoadingGroups(false);
    }
  };

  React.useEffect(() => {
    if (userDetails?.user_id) {
      fetchGroups(1);

      // Fetch true total mentees count
      getRequest('/student-list', { user_id: userDetails.user_id, page_no: 1, limit: 1 }, (response) => {
        if (response.data?.status === 1 || response.data?.code === 200) {
          setTotalMenteesCount(response.data.total || 0);
        }
      });

      // Fetch irregular mentees count
      getRequest('/irregular-mentees', { user_id: userDetails.user_id }, (response) => {
        if (response.data?.status === 1 || response.data?.code === 200) {
          const total = response.data.total || (Array.isArray(response.data.data) ? response.data.data.length : 0);
          setIrregularCount(total);
        }
      });
    }
  }, [userDetails?.user_id]);

  const handleAddGroup = async (newGroupData) => {
    try {
      const trimmedName = newGroupData.name.trim();
      if (groups.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast.error("Group name already exists");
        return;
      }

      const payload = {
        user_id: userDetails.user_id,
        name: trimmedName,
        city: newGroupData.city
      };

      postRequest('/add-new-group', payload, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success') {
          fetchGroups(1); // Refresh the list from server
          setIsAddGroupOpen(false);
          toast.success(message);
        } else {
          toast.error(message);
        }
      });
    } catch (error) {
      console.error("Error adding group:", error);
      toast.error("Failed to add group");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] font-sans pb-28 relative overflow-x-hidden text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">
      {/* Container holding the mobile width cleanly if opened on desktop */}
      <div className="w-full max-w-md mx-auto">
        {/* Main Content Card Wrapper */}
        <div className="mx-4 border border-gray-400/70 dark:border-[#334155] rounded-3xl p-4 bg-white dark:bg-[#1E293B] shadow-sm mb-6">
          {/* Controls: Title, Theme & Bell */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[20px] font-bold underline underline-offset-4 decoration-2 text-gray-900 dark:text-white">Analytics</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setShowNotifications(true)}
                className="relative w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-2 right-2 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-slate-700"></span>
              </button>
            </div>
          </div>

          {/* Students Rank & Follow-up Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">

            {/* Rank Card */}
            <div className="border border-gray-400/70 dark:border-gray-700 rounded-2xl p-4 flex flex-col bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-300 dark:border-gray-700 pb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10M17 4v8a5 5 0 0 1 -10 0v-8M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /></svg>
                </div>
                <h3 className="font-bold text-[14px] text-gray-800 dark:text-gray-100 leading-tight">Students Rank</h3>
              </div>
              <ul className="space-y-3 mb-4 flex-1">
                {[1, 2, 3, 4, 5].map(num => (
                  <li key={num} className="flex items-center gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="w-4 text-center">{num}</span>
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 text-[13px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors">
                View All <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Follow-up Card */}
            <div className="border border-red-300 dark:border-red-500 rounded-2xl p-4 flex flex-col bg-red-400/15 dark:bg-red-800/5">
              <div className="flex items-center gap-2 mb-4 border-b border-red-300 dark:border-red-500 pb-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 flex items-center justify-center">
                  <svg className="w-8 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 9v2m0 4v.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="font-bold text-[14px] text-red-800 dark:text-red-300 leading-tight">Students Need Follow-up</h3>
              </div>
              <ul className="space-y-3 mb-4 flex-1">
                {[1, 2, 3, '.'].map(num => (
                  <li key={num} className="flex items-center gap-4 text-sm font-medium text-red-700 dark:text-red-500">
                    <span className="w-4 text-center">{num}</span>
                    <span className="text-red-400 dark:text-red-400">—</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2 bg-red-100 dark:bg-red-600/50 hover:bg-red-200 dark:hover:bg-red-500 text-red-700 dark:text-red-200 text-[13px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors mt-auto">
                View All <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

          </div>

          {/* Groups Section */}
          <div className="border border-gray-400/70 dark:border-gray-700 rounded-2xl p-4 bg-white dark:bg-slate-800 mb-6">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-blue-300 dark:border-blue-800 pb-2 w-max">
              <svg className="w-5 h-5 text-blue-800 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" /></svg>
              <h3 className="font-extrabold text-[16px] text-gray-900 dark:text-white">Groups</h3>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar snap-x"
            >
              {groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => navigate('/counsellor/group-mentees', { state: { groupName: group.name, centerId: group.id } })}
                  className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-3 min-w-[160px] flex items-center gap-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors shrink-0 snap-start"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[13px] text-gray-900 dark:text-white leading-tight">{group.name}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                      {group.members} members
                    </p>
                  </div>
                </div>
              ))}

              <div
                onClick={() => setIsAddGroupOpen(true)}
                className="border-2 border-dashed border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 rounded-2xl p-3 min-w-[140px] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/30 transition-colors shrink-0 snap-start gap-1"
              >
                <div className="w-8 h-8 rounded-full border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <span className="font-semibold text-[12px] text-blue-800 dark:text-blue-400">Add Group</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="border border-gray-400/70 dark:border-gray-700 rounded-2xl p-4 bg-white dark:bg-slate-800 mb-6">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-blue-300 dark:border-blue-800 pb-2 w-max">
              <svg className="w-5 h-5 text-blue-800 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11 15H6L13 1V9H18L11 23V15Z" /></svg>
              <h3 className="font-extrabold text-[16px] text-gray-900 dark:text-white">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div
                onClick={() => {
                  const encoded = btoa(userDetails.user_id);
                  const link = `https://sadhanagpt.com?ref=${encoded}`;
                  navigator.clipboard.writeText(link).then(() => {
                    toast.success("Referral link copied!");
                  }).catch(() => {
                    toast.error("Failed to copy link");
                  });
                }}
                className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800/50 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <svg className="w-6 h-6 text-blue-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Invite</span>
              </div>
              <div onClick={() => navigate('/counsellor/marking-scheme')} className="bg-green-50/80 dark:bg-green-900/20 border border-green-300 dark:border-green-800/50 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-center">
                <svg className="w-6 h-6 text-green-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Marking<br/>Scheme</span>
              </div>
              <div onClick={() => navigate('/counsellor/custom-activities')} className="bg-purple-50/80 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-800/50 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-center">
                <svg className="w-6 h-6 text-purple-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Custom<br/>Activities</span>
              </div>
              <div onClick={() => navigate('/counsellor/rewards')} className="bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800/50 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
                <svg className="w-6 h-6 text-yellow-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Rewards</span>
              </div>
              <div onClick={() => setIsSettingsOpen(true)} className="bg-pink-50/80 dark:bg-pink-900/20 border border-pink-300 dark:border-pink-800/50 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors">
                <svg className="w-6 h-6 text-pink-500 mb-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z" /></svg>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Reports</span>
              </div>
            </div>
          </div>

          {/* View All Mentees Button */}
          <button
            onClick={() => navigate('/counsellor/mentees')}
            className="w-full h-16 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-300 font-bold py-3.5 rounded-xl border border-blue-200 dark:border-blue-800/50 flex items-center justify-between px-4 transition-colors"
          >
            <span className="flex-1 text-center text-[16px]">View All Mentees (Total - {totalMenteesCount})</span>
            <svg className="w-4 h-4 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>

        </div>
      </div>


      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <ReportSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userDetails={userDetails}
        showToast={showToast}
      />

      <AddGroupModal
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
        onSave={handleAddGroup}
      />

      {/* Mentee Labels Modal */}
      <AnimatePresence>
        {isLabelsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLabelsModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-[#0F172A] rounded-t-[40px] z-[70] p-8 shadow-2xl transition-colors duration-300"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[22px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">Mentee Labels</h2>
                <button
                  onClick={() => setIsLabelsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1E293B] flex items-center justify-center text-gray-500 dark:text-[#CBD5E1] active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Select Group</label>
                  <div className="relative">
                    <select
                      value={selectedGroupForLabels}
                      onChange={(e) => setSelectedGroupForLabels(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-[#1E293B] border-2 border-transparent focus:border-blue-100 dark:focus:border-blue-500/30 rounded-2xl py-4 px-5 text-[15px] font-bold text-[#0f172a] dark:text-[#F8FAFC] appearance-none outline-none transition-all"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Available Labels</label>
                  {isLoadingLabels ? (
                    <div className="flex items-center gap-2 py-4">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[13px] text-gray-400 font-medium">Updating labels...</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(groupLabels[selectedGroupForLabels] || []).map((label, idx) => (
                        <div key={label.id || idx} className="bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-[#60A5FA] px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2">
                          {label.name}
                          <button
                            onClick={() => {
                              if (label.id && window.confirm(`Are you sure you want to delete the label "${label.name}"?`)) {
                                postRequest('/delete-lable', { user_id: userDetails.user_id, label_id: label.id }, (response) => {
                                  const { message, type } = processResponse(response.data);
                                  if (type === 'success') {
                                    fetchLabels(selectedGroupForLabels); // Refresh list
                                    toast.success(message);
                                  } else {
                                    toast.error(message);
                                  }
                                });
                              }
                            }}
                            className="text-blue-300 hover:text-blue-500"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom label..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-1 bg-[#f8fafc] dark:bg-[#1E293B] rounded-2xl py-4 px-5 text-[15px] font-bold text-[#0f172a] dark:text-[#F8FAFC] outline-none border-2 border-transparent focus:border-blue-100 dark:focus:border-blue-500/30 transition-all placeholder:text-gray-300 dark:placeholder:text-[#475569]"
                    />
                    <button
                      onClick={() => {
                        const trimmedLabelName = newLabelName.trim();
                        if (trimmedLabelName && selectedGroupForLabels) {
                          const existingLabels = groupLabels[selectedGroupForLabels] || [];
                          if (existingLabels.some(l => l.name.toLowerCase() === trimmedLabelName.toLowerCase())) {
                            toast.error("Sub-Group name already exists in this group");
                            return;
                          }

                          const payload = {
                            user_id: userDetails.user_id,
                            lable_name: trimmedLabelName,
                            center_id: selectedGroupForLabels
                          };

                          postRequest('/add-lable', payload, (response) => {
                            const { message, type } = processResponse(response.data);
                            if (type === 'success') {
                              fetchLabels(selectedGroupForLabels); // Refresh list from server
                              setNewLabelName('');
                              setIsLabelsModalOpen(false); // Close modal automatically
                              toast.success(message);
                            } else {
                              toast.error(message);
                            }
                          });
                        } else if (!selectedGroupForLabels) {
                          toast.error("Please select a group first");
                        }
                      }}
                      className="w-14 h-14 bg-[#1a73e8] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-4"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastState.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border w-max max-w-[90%] ${toastState.type === 'error'
              ? 'bg-red-50 border-red-100 text-red-700'
              : 'bg-green-50 border-green-100 text-green-700'
              }`}
          >
            {toastState.type === 'error' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            )}
            <span className="text-[14px] font-bold truncate">{toastState.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reusable Counsellor Bottom Navigation */}
      <CounsellorBottomNavigation />

    </div >
  );
};

export default CounsellorAnalytics;
