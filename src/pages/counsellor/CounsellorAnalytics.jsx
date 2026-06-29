import React, { useState, useEffect, useCallback } from 'react';
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
      const payload = {
        user_id: userDetails.user_id,
        name: newGroupData.name,
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
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0F172A] font-sans pb-28 relative overflow-x-hidden text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">
      {/* Container holding the mobile width cleanly if opened on desktop */}
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <div>
            <h2 className="text-[#64748b] dark:text-[#CBD5E1] text-[15px] font-semibold mb-1 transition-colors duration-300">Hare Krsna,</h2>
            <h1 className="text-[28px] leading-tight font-extrabold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight transition-colors duration-300">
              {userDetails.name.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start">
            <ThemeToggle />
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center w-12 h-12 bg-white dark:bg-[#1E293B] text-[#64748b] dark:text-[#CBD5E1] rounded-full active:scale-95 transition-all shadow-sm border border-gray-50 dark:border-[#334155]"
              title="Report Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0f172a] hover:bg-gray-50 active:scale-95 transition-all"
            >
              {/* Bell Icon */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22A2 2 0 0 0 14 20H10A2 2 0 0 0 12 22M18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
              </svg>
              {/* Notification Badge */}
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 border-2 border-white"></span>
            </button>
          </div>
        </div>

        {/* Big Blue Card - View Mentees */}
        <div className="px-6 mb-4">
          <div
            onClick={() => navigate('/counsellor/mentees')}
            className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-3xl p-6 shadow-lg shadow-blue-500/30 relative overflow-hidden text-white flex flex-col justify-between items-start cursor-pointer active:scale-[0.98] transition-all min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[22px] font-bold mb-1">View Mentees</h2>
              <p className="text-white/80 text-[14px]">Manage your students & check progress</p>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </div>

        {/* 2x2 Quick Action Grid */}
        <div className="px-6 grid grid-cols-2 gap-4 mb-8">
          <div
            onClick={() => navigate('/counsellor/rewards')}
            className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#475569] flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 5H17V3H7V5H5C3.9 5 3 5.9 3 7V8C3 10.76 5.24 13 8 13H9.2C10.05 14.5 11.66 15.5 13.5 15.6V18H11V21H15V18H12.5V15.6C14.34 15.5 15.95 14.5 16.8 13H18C20.76 13 23 10.76 23 8V7C23 5.9 22.1 5 21 5H19M18 10C16.89 10 16 9.1 16 8V7H18V10M8 10C6.89 10 6 9.1 6 8V7H8V10Z" />
              </svg>
            </div>
            <span className="font-bold text-[#0f172a] dark:text-[#F8FAFC]">Rewards</span>
          </div>

          <div
            onClick={() => setIsLabelsModalOpen(true)}
            className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#475569] flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.41 11.58L12.41 2.58A2 2 0 0 0 11 2H4A2 2 0 0 0 2 4V11A2 2 0 0 0 2.59 12.42L11.59 21.42A2 2 0 0 0 13 22A2 2 0 0 0 14.41 21.41L21.41 14.41A2 2 0 0 0 22 13A2 2 0 0 0 21.41 11.58M13 20L4 11V4H11L20 13M6.5 5A1.5 1.5 0 1 1 5 6.5A1.5 1.5 0 0 1 6.5 5Z" />
              </svg>
            </div>
            <span className="font-bold text-[#0f172a] dark:text-[#F8FAFC]">Manage Labels</span>
          </div>
          
          <div
            onClick={() => navigate('/counsellor/marking-scheme')}
            className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#475569] flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-teal-500 dark:text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M12 3C12.55 3 13 3.45 13 4S12.55 5 12 5 11 4.55 11 4 11.45 3 12 3M7 7H17V9H7V7M14 13H7V11H14V13M17 17H7V15H17V17Z" />
              </svg>
            </div>
            <span className="font-bold text-[#0f172a] dark:text-[#F8FAFC]">Marking Scheme</span>
          </div>

          <div
            onClick={() => navigate('/counsellor/activities')}
            className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#475569] flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="font-bold text-[#0f172a] dark:text-[#F8FAFC]">Manage Custom Activities</span>
          </div>
        </div>
        

        {/* Full Width Card - Irregular Mentees Alert - ONLY SHOW IF COUNT > 0 */}
        {irregularCount > 0 && (
          <div className="px-6 mb-8">
            <div
              onClick={() => navigate('/counsellor/irregular-mentees')}
              className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-6 shadow-sm border border-red-100 dark:border-red-500/30 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M13 17H11V15H13V17M13 13H11V7H13V13Z" /></svg>
                </div>
                <div>
                  <h2 className="font-bold text-[18px] text-red-700 dark:text-red-400 mb-0.5">Mentee Alerts</h2>
                  <p className="text-red-600/70 dark:text-red-400/70 text-[13px] font-medium">{irregularCount} students need attention</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-400 shrink-0 group-hover:text-red-600 transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Width Card - Sub Counsellors */}
        <div className="px-6 mb-8">
          <div
            onClick={() => navigate('/counsellor/sub-counsellors')}
            className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#475569] flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4A4 4 0 1 1 8 8A4 4 0 0 1 12 4M12 14C16.42 14 20 15.79 20 18V20H4V18C4 15.79 7.58 14 12 14ZM12 6A2 2 0 1 0 14 8A2 2 0 0 0 12 6ZM12 16C8.58 16 6 17.36 6 18V18H18V18C18 17.36 15.42 16 12 16Z" /></svg>
              </div>
              <div>
                <h2 className="font-bold text-[18px] text-[#0f172a] dark:text-[#F8FAFC] mb-0.5">Sub Counsellors</h2>
                <p className="text-gray-500 dark:text-[#94A3B8] text-[13px] font-medium">Manage team & assignments</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </div>

        {/* Invite Students - Referral Link */}
        <div className="px-6 mb-8">
          <div className="bg-gradient-to-r from-[#0f766e] to-[#10b981] rounded-3xl p-5 shadow-lg shadow-emerald-500/20 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.35C15.11,18.56 15.08,18.78 15.08,19C15.08,20.61 16.39,21.92 18,21.92C19.61,21.92 20.92,20.61 20.92,19C20.92,17.39 19.61,16.08 18,16.08Z" /></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-[16px]">Invite Students</h3>
                <p className="text-white/70 text-[12px] font-medium">Share your referral link</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const encoded = btoa(userDetails.user_id);
                  const link = `https://sadhanagpt.com?ref=${encoded}`;
                  navigator.clipboard.writeText(link).then(() => {
                    toast.success("Referral link copied!");
                  }).catch(() => {
                    toast.error("Failed to copy link");
                  });
                }}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white font-bold text-[13px] py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2M16 3h5v5M10 14L20.5 3.5" /></svg>
                Copy Link
              </button>
              <button
                onClick={() => {
                  const encoded = btoa(userDetails.user_id);
                  const link = `https://sadhanagpt.com?ref=${encoded}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Join SadhanaGPT',
                      text: 'Track your spiritual progress with SadhanaGPT! Join using my referral link:',
                      url: link
                    }).catch(() => { });
                  } else {
                    navigator.clipboard.writeText(link).then(() => {
                      toast.success("Link copied (sharing not supported on this device)");
                    });
                  }
                }}
                className="flex-1 bg-white text-emerald-700 font-bold text-[13px] py-3 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share
              </button>
            </div>
          </div>
        </div>        {/* My Groups Header */}
        <div className="px-6 flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">My Groups</h2>
          <button
            onClick={() => setIsAddGroupOpen(true)}
            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {/* Groups List */}
        <div className="px-6 space-y-4">
          {isLoadingGroups ? (
            <div className="flex flex-col items-center justify-center pt-10 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading groups...</p>
            </div>
          ) : groups.length > 0 ? (
            groups.map(group => (
              <div
                key={group.id}
                onClick={() => navigate('/counsellor/group-mentees', { state: { groupName: group.name, centerId: group.id } })}
                className="bg-white dark:bg-[#1E293B] rounded-[28px] p-4 shadow-sm border border-gray-100 dark:border-[#334155] flex items-center cursor-pointer hover:shadow-md transition-all duration-300 active:scale-[0.99]"
              >
                <div className="relative w-16 h-16 mr-4 shrink-0">
                  <img src={group.image} alt={group.name} className="w-full h-full rounded-full object-cover shadow-sm bg-gray-100 dark:bg-[#334155]" />
                  <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${group.iconColor}`}>
                    {group.statusIcon === 'NEW' ? 'NEW' : (
                      group.statusIcon === '⚡' ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 15H6L13 1V9H18L11 23V15Z" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" /></svg>
                      )
                    )}
                  </div>
                </div>
                <div className="flex-1 mr-2">
                  <h3 className="font-bold text-[16px] text-[#0f172a] dark:text-[#F8FAFC] whitespace-nowrap overflow-hidden text-ellipsis">{group.name}</h3>
                  <p className="text-[#64748b] dark:text-[#94A3B8] text-[13px] mt-0.5">{group.members} Members • {group.status}</p>
                </div>
                <div className="shrink-0 text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center pt-10">
              <p className="text-gray-500 font-medium text-lg">No groups found</p>
              <p className="text-gray-400 text-sm font-medium">Create your first group to get started</p>
            </div>
          )}
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
                        if (newLabelName.trim() && selectedGroupForLabels) {
                          const payload = {
                            user_id: userDetails.user_id,
                            lable_name: newLabelName.trim(),
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

    </div>
  );
};

export default CounsellorAnalytics;
