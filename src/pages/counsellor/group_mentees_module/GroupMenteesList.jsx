import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import { getRequest, postRequest } from '../../../services/api';
import { processResponse } from '../../../utils/apiUtils';

const GroupMenteesList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userDetails } = useOutletContext();
  
  const { centerId, groupName } = location.state || { centerId: '', groupName: 'Group' };
  
  const [students, setStudents] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkLabel, setBulkLabel] = useState('');
  
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [aiDateFrom, setAiDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  });
  const [aiDateTo, setAiDateTo] = useState(new Date().toISOString().split('T')[0]);
  
  const SELECTION_LIMIT = 50;
  const observerTarget = useRef(null);

  const fetchLabels = useCallback(() => {
    if (!centerId) return;
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setLabels(res.data.map(l => ({ id: l.label_id, name: l.label_name })));
      }
    });
  }, [userDetails.user_id, centerId]);

  const fetchStudents = useCallback((pageNum = 1, shouldAppend = false) => {
    if (!centerId) return;
    setIsLoading(true);
    const payload = {
      user_id: userDetails.user_id,
      page_no: pageNum,
      center_id: centerId,
      label_id: (selectedLabel === 'All' || selectedLabel === 'un-categorized') ? "" : selectedLabel,
      search_text: searchQuery,
      ...(selectedLabel === 'un-categorized' && { categroy: 'un-categorized' })
    };

    getRequest('/student-list', payload, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
        const mappedStudents = rawData.map(s => ({
          id: s.user_id,
          name: s.name,
          group: s.center_name || 'N/A',
          label: s.label_name || 'N/A',
          center_id: s.center_id,
          label_id: s.label_id,
          notificationStatus: s.notification_status,
          avatar: s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`,
          activities: s.activities || []
        }));
        setStudents(prev => shouldAppend ? [...prev, ...mappedStudents] : mappedStudents);
        setTotalPages(res.total_page || 1);
      }
      setIsLoading(false);
    });
  }, [userDetails.user_id, centerId, selectedLabel, searchQuery]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);
  useEffect(() => { fetchStudents(1, false); setPage(1); }, [fetchStudents]);

  // Auto-request notification permission on load if not yet granted/denied
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading && page < totalPages) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchStudents(nextPage, true);
      }
    }, { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [page, totalPages, isLoading, fetchStudents]);

  const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };
  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id);
      if (prev.length >= SELECTION_LIMIT) { showError(`Max ${SELECTION_LIMIT} students.`); return prev; }
      return [...prev, id];
    });
  };

  const handleAiAnalysis = () => {
    if (selectedStudents.length === 0) return;
    const payload = { user_id: userDetails.user_id, student_ids: JSON.stringify(selectedStudents), date_from: aiDateFrom, date_to: aiDateTo };
    postRequest('/bulk-ai-report', payload, (response) => {
      if (response.data?.status === 1) navigate('/counsellor/ai-chat', { state: { reports: response.data.data, fromReport: true } });
      else showError("AI Analysis failed");
    });
  };

  const handleBulkAssign = () => {
    if (!bulkLabel) return showError("Select a label");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: selectedStudents,
      center_id: centerId,
      label_id: bulkLabel
    };
    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message || 'Students assigned successfully');
        setIsBulkAssignOpen(false);
        setSelectedStudents([]);
        fetchStudents(1, false);
      } else {
        showError(data?.message || 'Failed to assign students');
      }
    });
  };

  const handleToggleNotifications = (enable) => {
    const payload = {
      user_id: userDetails.user_id,
      student_ids: selectedStudents,
      status: enable ? 1 : 0
    };
    
    postRequest('/toggle-mentee-notification', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message || `Notifications ${enable ? 'enabled' : 'disabled'} successfully`);
        
        // Update local state for instant feedback
        setStudents(prev => prev.map(student => 
          selectedStudents.includes(student.id) 
            ? { ...student, notificationStatus: enable ? 1 : 0 } 
            : student
        ));
        
        setIsNotificationModalOpen(false);
        setSelectedStudents([]);
      } else {
        showError(data?.message || 'Failed to update notification settings');
      }
    });
  };

  const handleSingleToggleNotification = (studentId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const payload = {
      user_id: userDetails.user_id,
      student_ids: [studentId],
      status: newStatus
    };
    
    postRequest('/toggle-mentee-notification', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message || `Notifications ${newStatus === 1 ? 'enabled' : 'disabled'} successfully`);
        setStudents(prev => prev.map(student => 
          student.id === studentId
            ? { ...student, notificationStatus: newStatus } 
            : student
        ));
      } else {
        showError(data?.message || 'Failed to update notification settings');
      }
    });
  };

  const handleSingleAssign = () => {
    if (!editLabel) return showError("Select a label");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: [editingStudent.id],
      center_id: centerId,
      label_id: editLabel
    };
    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message || 'Student updated successfully');
        setEditingStudent(null);
        fetchStudents(1, false);
      } else {
        showError(data?.message || 'Failed to update student');
      }
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] font-sans pb-[84px] transition-colors duration-300">
      <AnimatePresence>
        {errorMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
        {successMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
      </AnimatePresence>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20 border-b border-gray-100 dark:border-[#1E293B] transition-colors duration-300">
          <button onClick={() => navigate(-1)} className="text-[#64748b] dark:text-[#94A3B8] font-bold">Back</button>
          <h1 className="text-[18px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] truncate px-4">{groupName} Mentees</h1>
          <button onClick={() => setSelectedStudents([])} className="text-[#1a73e8] font-bold">{selectedStudents.length > 0 ? 'Clear' : ''}</button>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-4 rounded-lg mx-6 mt-4 text-center transition-colors">
          To add a new member, please go to the <span className="font-bold">View Mentees</span> option in the Analytics bar.
        </div>

        <div className="px-6 py-4">
          <input type="text" placeholder="Search mentees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#f8fafc] dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-full py-3.5 px-6 text-[15px] outline-none transition-colors" />
        </div>

        <div className="px-6 pb-4 flex gap-3 overflow-x-auto hide-scrollbar">
          <button onClick={() => setSelectedLabel('All')} className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 font-bold text-[13px] transition-all duration-300 ${selectedLabel === 'All' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-[#64748b] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-[#334155]'}`}>
            All Labels
          </button>

          <button onClick={() => setSelectedLabel('un-categorized')} className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 font-bold text-[13px] transition-all duration-300 ${selectedLabel === 'un-categorized' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-[#64748b] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-[#334155]'}`}>
            Uncategorized
          </button>

          {labels.map(l => (
             <button key={l.id} onClick={() => setSelectedLabel(l.id)} className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 font-bold text-[13px] transition-all duration-300 ${selectedLabel === l.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-[#64748b] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-[#334155]'}`}>
               {l.name}
             </button>
          ))}
        </div>

        <div className="px-2">
          {students.map(student => (
            <div key={student.id} onClick={() => toggleStudent(student.id)} className="flex items-center px-4 py-4 border-b border-gray-50 dark:border-[#1E293B] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">
              <img src={student.avatar} className="w-12 h-12 rounded-full mr-4 border border-gray-100 dark:border-[#334155]" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[16px] text-[#0f172a] dark:text-[#F8FAFC] flex items-center gap-2 truncate">
                  {student.name}
                  {student.notificationStatus === 1 && (
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                  )}
                </h3>
                <p className="text-[12px] text-gray-400 font-medium truncate">{student.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }} className="p-2 text-gray-300 dark:text-[#475569] hover:text-blue-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                <button onClick={(e) => { e.stopPropagation(); handleSingleToggleNotification(student.id, student.notificationStatus); }} className={`p-2 transition-colors ${student.notificationStatus === 1 ? 'text-blue-600' : 'text-gray-300 dark:text-[#475569] hover:text-gray-900 dark:hover:text-[#F8FAFC]'}`} title={student.notificationStatus === 1 ? "Disable Notifications" : "Enable Notifications"}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); setEditLabel(student.label_id); }} className="p-2 text-gray-300 dark:text-[#475569] hover:text-gray-900 dark:hover:text-[#F8FAFC] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 dark:border-[#334155]'}`}>
                  {selectedStudents.includes(student.id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            </div>
          ))}
          <div ref={observerTarget} className="h-10" />
        </div>
      </div>

      {/* Premium Bottom Bar — draggable up/down to reveal hidden students */}
      <AnimatePresence>
        {selectedStudents.length > 0 && (
          <motion.div
            drag="y"
            dragConstraints={{ top: -340, bottom: 0 }}
            dragElastic={0.08}
            dragMomentum={false}
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[84px] left-0 right-0 max-w-md mx-auto z-40 px-4 touch-none select-none"
          >
            <div className="bg-[#1a73e8] rounded-[32px] shadow-2xl shadow-blue-500/40 w-full relative">
              {/* Drag handle pill */}
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-white/40" />
              </div>
              <div className="px-5 pb-5 pt-2">
                <div className="flex justify-between items-center mb-4 text-white px-2">
                  <span className="font-extrabold text-[15px]">Selected: {selectedStudents.length} Students</span>
                  <button onClick={() => setSelectedStudents([])} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center touch-auto"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="flex gap-3 mb-3">
                  <button onClick={() => setIsAiAnalysisModalOpen(true)} className="touch-auto flex-[2] bg-white text-[#1a73e8] rounded-2xl py-3.5 font-black text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>AI Analysis</button>
                  <button onClick={() => setIsNotificationModalOpen(true)} className="touch-auto flex-1 bg-white/20 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/30 active:scale-[0.98] transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>Alerts</button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsBulkAssignOpen(true)} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>Change Label</button>
                  <button onClick={() => setIsDownloadModalOpen(true)} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>Export</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals Bundle */}
      <AnimatePresence>

        {isNotificationModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setIsNotificationModalOpen(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
               <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mb-6">
                 <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
               </div>
               <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">Performance Alerts</h2>
               <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8 text-[15px] leading-relaxed">
                 Receive push notifications when these {selectedStudents.length} students miss their sadhana or fall below their target average.
               </p>
               <div className="space-y-4">
                  <button onClick={() => handleToggleNotifications(true)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Enable Notifications
                  </button>
                  <button onClick={() => handleToggleNotifications(false)} className="w-full bg-gray-50 dark:bg-[#1E293B] text-gray-900 dark:text-[#F8FAFC] py-5 rounded-2xl font-black active:scale-[0.98] transition-all">
                    Disable Notifications
                  </button>
                  <button onClick={()=>setIsNotificationModalOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Maybe Later</button>
               </div>
            </motion.div>
          </motion.div>
        )}


        {isAiAnalysisModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center">
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
               <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">AI Analysis Setup</h2>
               <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-6">Analyzing {selectedStudents.length} students</p>
               
               <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
                  {students.filter(s => selectedStudents.includes(s.id)).map(s => (
                    <div key={s.id} className="flex flex-col items-center min-w-[60px]">
                      <img src={s.avatar} className="w-10 h-10 rounded-full border border-gray-100 dark:border-[#334155]" />
                      <span className="text-[10px] font-bold mt-1 text-gray-400 dark:text-[#94A3B8] truncate w-full text-center">{s.name.split(' ')[0]}</span>
                    </div>
                  ))}
               </div>

               <div className="space-y-6">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 dark:text-[#64748b] mb-2 block tracking-widest">Date From</label><input type="date" value={aiDateFrom} onChange={e=>setAiDateFrom(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none [color-scheme:light] dark:[color-scheme:dark]" /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 dark:text-[#64748b] mb-2 block tracking-widest">Date To</label><input type="date" value={aiDateTo} onChange={e=>setAiDateTo(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none [color-scheme:light] dark:[color-scheme:dark]" /></div>
                  <button onClick={handleAiAnalysis} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Generate AI Insights</button>
                  <button onClick={()=>setIsAiAnalysisModalOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Close</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {isBulkAssignOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setIsBulkAssignOpen(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
               <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">Move Students</h2>
               <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Update labels for {selectedStudents.length} students</p>
               <div className="space-y-6">
                  <select value={bulkLabel} onChange={e=>setBulkLabel(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold outline-none border-none">
                    <option value="">Select Target Label</option>
                    {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button onClick={handleBulkAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Confirm Move</button>
                  <button onClick={()=>setIsBulkAssignOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {editingStudent && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setEditingStudent(null)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
               <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">{editingStudent.name}</h2>
               <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Change Label within Group</p>
               <div className="space-y-6">
                  <select value={editLabel} onChange={e=>setEditLabel(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none">
                    <option value="">Select Label</option>
                    {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button onClick={handleSingleAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Update Label</button>
                  <button onClick={()=>setEditingStudent(null)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {isDownloadModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsDownloadModalOpen(false)} className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
                <h2 className="text-2xl font-black mb-8 text-[#0f172a] dark:text-[#F8FAFC]">Export Students</h2>
                <div className="space-y-3">
                   {['Excel (.xls)', 'CSV (.csv)', 'Print PDF'].map(f => (
                     <button key={f} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold flex items-center justify-between group hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                        <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">{f}</span>
                        <svg className="w-5 h-5 text-gray-400 dark:text-[#94A3B8]" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                     </button>
                   ))}
                   <button onClick={()=>setIsDownloadModalOpen(false)} className="w-full py-6 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Close</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <CounsellorBottomNavigation />
    </div>
  );
};

export default GroupMenteesList;
