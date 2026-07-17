import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import AiAnalysisModals from '../../../components/AiAnalysis/AiAnalysisModals';
import { getRequest, postRequest, deleteRequest } from '../../../services/api';
import { processResponse } from '../../../utils/apiUtils';
import CustomActivitiesPage from '../activites/addActivityPage';

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
  const [limit, setLimit] = useState(10);
  const [toastState, setToastState] = useState({ show: false, message: '', type: 'success' });
  const [actionMenuStudent, setActionMenuStudent] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [studentToRemoveFromSubgroup, setStudentToRemoveFromSubgroup] = useState(null);
  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  const [isGroupActionMenuOpen, setIsGroupActionMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] = useState(false);
  const [renameInput, setRenameInput] = useState(groupName || '');

  const [actionMenuSubgroup, setActionMenuSubgroup] = useState(null);
  const [isRenameSubgroupModalOpen, setIsRenameSubgroupModalOpen] = useState(false);
  const [isDeleteSubgroupConfirmOpen, setIsDeleteSubgroupConfirmOpen] = useState(false);
  const [renameSubgroupInput, setRenameSubgroupInput] = useState('');

  const [newLabelName, setNewLabelName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkLabel, setBulkLabel] = useState('');
  const [isRemoveFromSubGroupConfirmOpen, setIsRemoveFromSubGroupConfirmOpen] = useState(false);
  const [isBulkRemoveActionMenuOpen, setIsBulkRemoveActionMenuOpen] = useState(false);
  const [isBulkRemoveFromGroupConfirmOpen, setIsBulkRemoveFromGroupConfirmOpen] = useState(false);

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [aiAnalysisStudents, setAiAnalysisStudents] = useState([]);

    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [uncategorizedStudents, setUncategorizedStudents] = useState([]);
  const [isFetchingUncategorized, setIsFetchingUncategorized] = useState(false);
  const [selectedUncategorized, setSelectedUncategorized] = useState([]);


  const SELECTION_LIMIT = 50;


  const fetchLabels = useCallback(() => {
    if (!centerId) return;
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setLabels(res.data.map(l => ({ id: l.label_id, name: l.label_name })));
      }
    });
  }, [userDetails.user_id, centerId]);

  const fetchStudents = useCallback((pageNum = 1) => {
    if (!centerId) return;
    setIsLoading(true);
    const payload = {
      user_id: userDetails.user_id,
      page_no: pageNum,
      rowSelected: limit,
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
          label: s.label_name || 'Uncategorized',
          center_id: s.center_id,
          label_id: s.label_id,
          notificationStatus: s.notification_status,
          avatar: s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`,
          activities: s.activities || []
        }));
        setStudents(mappedStudents);
        setTotalPages(res.total_page || 1);
      }
      setIsLoading(false);
    });
  }, [userDetails.user_id, centerId, selectedLabel, searchQuery, limit]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);
  useEffect(() => { fetchStudents(1); setPage(1); }, [fetchStudents]);

  // Auto-request notification permission on load if not yet granted/denied
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);



  const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 4000); };
  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 4000); };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id);
      if (prev.length >= SELECTION_LIMIT) { showError(`Max ${SELECTION_LIMIT} students.`); return prev; }
      return [...prev, id];
    });
  };



  const handleBulkAssign = () => {
    if (!bulkLabel) return showError("Select a Sub-Group");
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

  const handleRemoveFromSubGroup = () => {
    if (selectedStudents.length === 0) return showError("Select students first");

    const payload = {
      user_id: userDetails.user_id,
      center_id: centerId,
      student_ids: selectedStudents,
      label_id: "0"
    };

    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      setIsRemoveFromSubGroupConfirmOpen(false);
      if (data?.status === 1) {
        showSuccess('Students removed from sub-group');
        setSelectedStudents([]);
        fetchStudents(1, false);
      } else {
        showError(data?.message || 'Failed to remove from sub-group');
      }
    });
  };

  const handleBulkRemoveFromGroup = () => {
    if (selectedStudents.length === 0) return showError("Select students first");
    
    const payload = {
      user_id: userDetails.user_id,
      center_id: 0,
      student_ids: selectedStudents
    };
    
    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      setIsBulkRemoveFromGroupConfirmOpen(false);
      if (data?.status === 1) {
        showSuccess('Students removed from group');
        setSelectedStudents([]);
        fetchStudents(1, false);
      } else {
        showError(data?.message || 'Failed to remove from group');
      }
    });
  };

    const openAddMemberModal = () => {
    setIsAddMemberModalOpen(true);
    setIsFetchingUncategorized(true);
    getRequest('/student-list', { user_id: userDetails.user_id, page_no: 1, limit: 100, categroy: 'un-categorized' }, (response) => {
      if (response.data?.status === 1 || response.data?.code === 200) {
        setUncategorizedStudents(response.data.data || []);
      }
      setIsFetchingUncategorized(false);
    });
  };

  const handleAssignNewMembers = () => {
    if (selectedUncategorized.length === 0) return showError("Select students first");
    
    const payload = {
      user_id: userDetails.user_id,
      center_id: centerId,
      student_ids: selectedUncategorized
    };
    
    postRequest('/assign-student-center-label', payload, (res) => {
      if (res.data?.status === 1) {
        showSuccess('Students added to group successfully');
        setIsAddMemberModalOpen(false);
        setSelectedUncategorized([]);
        fetchStudents(1, false); // Refresh the group list
      } else {
        showError(res.data?.message || 'Failed to add students');
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
    if (!editLabel) return showError("Select a Sub-Group");
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

  const handleAddLabel = () => {
    const trimmedLabelName = newLabelName.trim();
    if (!trimmedLabelName) {
      return showError("Sub-Group name is required");
    }

    if (labels.some(l => l.name.toLowerCase() === trimmedLabelName.toLowerCase())) {
      return showError("Sub-Group name already exists in this group");
    }

    const payload = {
      user_id: userDetails.user_id,
      center_id: centerId,
      lable_name: trimmedLabelName
    };

    postRequest('/add-lable', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess('Sub-Group added successfully');
        fetchLabels(); // refresh the label list immediately
        setIsLabelPopupOpen(false);
        setNewLabelName('');
      } else {
        showError('Failed to add Sub-Group');
      }
    });
  };


  const groupedStudents = React.useMemo(() => {
    const groups = {};

    students.forEach(student => {
      const name = student.label || 'Uncategorized';
      const key = name.trim().toLowerCase();

      if (!groups[key]) {
        const matchingLabel = labels.find(l => l.name === name);
        groups[key] = {
          labelId: matchingLabel ? matchingLabel.id : student.label_id,
          labelName: name,
          students: []
        };
      }
      groups[key].students.push(student);
    });

    // Sort to keep 'Uncategorized' at the bottom, others alphabetically
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'uncategorized') return 1;
      if (b[0] === 'uncategorized') return -1;
      return a[1].labelName.localeCompare(b[1].labelName);
    });
  }, [students, labels]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] font-sans pb-[84px] transition-colors duration-300">
      <AnimatePresence>
        {errorMessage && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
        {successMessage && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
      </AnimatePresence>

      <div className={`max-w-md mx-auto pb-6 ${selectedStudents.length > 0 ? 'mb-40' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20 transition-colors duration-300">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>

          <h1 className="text-[20px] font-extrabold text-[#0f172a] uppercase dark:text-[#F8FAFC] truncate px-4">{groupName}</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="px-4 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-400/70 dark:border-slate-700 rounded-xl shadow-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors font-bold text-[14px]">
              Export
            </button>
            <button
              onClick={() => { setIsGroupActionMenuOpen(true) }}
              className="w-20 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-400/70 dark:border-slate-700 rounded-xl shadow-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors font-bold text-[14px]">
              Edit
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-6 mb-4 flex gap-3">
          <input 
            type="text" 
            placeholder="Search mentees..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-gray-400/70 dark:border-slate-700 focus:border-blue-500 text-gray-900 dark:text-white rounded-2xl py-3.5 px-5 text-[15px] outline-none shadow-sm transition-all" 
          />
          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-gray-400/70 dark:border-slate-700 focus:border-blue-500 text-gray-900 dark:text-white rounded-2xl py-3.5 px-3 text-[14px] outline-none shadow-sm transition-all w-[140px] font-bold"
          >
            <option value="All">All Sub-Groups</option>
            <option value="un-categorized">Uncategorized</option>
            {labels.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Add Sub-Group */}
        <div className="px-6 mb-6">
          <button
            onClick={() => setIsLabelPopupOpen(true)}
            className="w-full py-4 border-2 border-dashed border-blue-200 dark:border-blue-800/50 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Sub-Group
          </button>
        </div>

        {/* Label Sections */}
        <div className="px-6 space-y-6">
          {groupedStudents.map(([labelId, groupData]) => (
            <div key={labelId} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-400/70 dark:border-slate-700 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h3 className="font-extrabold text-[16px] uppercase text-blue-900 dark:text-blue-100">{groupData.labelName}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {groupData.labelName !== 'N/A' && groupData.labelName !== 'Uncategorized' && (
                    <>
                      <button
                        onClick={() => {
                          setAiAnalysisStudents(groupData.students);
                          setIsAiAnalysisModalOpen(true);
                        }}
                        className="h-8 px-3 rounded-lg border border-purple-400/70 dark:border-purple-600 flex items-center justify-center text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors bg-white dark:bg-slate-800 text-[14px] font-bold gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI
                      </button>
                      <button
                        onClick={() => setActionMenuSubgroup({ id: groupData.labelId, name: groupData.labelName })}
                        className="w-16 h-8 rounded-lg border border-gray-400/70 dark:border-slate-600 flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 text-[14px]"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Members */}
              <div className="p-2 space-y-1">
                {groupData.students.map((student, index) => (
                  <div key={student.id} className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <div className="w-6 text-[12px] font-bold uppercase text-gray-400 flex-shrink-0 text-center">{index + 1}</div>

                    <div className="flex-1 min-w-0">
                      <div
                        onClick={() => navigate(`/counsellor/mentee/${student.id}`, { state: student })}
                        className="inline-flex items-center gap-3 cursor-pointer group/nav max-w-full">
                        <img src={student.avatar} className="w-10 h-10 rounded-full border-2 border-transparent group-hover/nav:border-white transition-all  duration-300 border-gray-300 dark:border-slate-600" />
                        <div className="truncate">
                          <h4 className="font-bold text-[15px] text-gray-900 dark:text-white truncate flex items-center gap-2 group-hover/nav:underline">
                            {student.name}
                            {student.notificationStatus === 1 && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 transition-opacity shrink-0 ml-auto">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: student }); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <button onClick={(e) => { e.stopPropagation(); setActionMenuStudent(student); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <div onClick={(e) => {
                        e.stopPropagation();
                        toggleStudent(student.id);
                      }}
                        className={`w-5 h-5 ml-2 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${selectedStudents.includes(student.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-slate-500'}`}>
                        {selectedStudents.includes(student.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination Controls */}
        {(totalPages > 1 || students.length > 0) && (
            <div className="flex flex-col gap-3 px-6 py-4 mt-2 mb-2">
                <div className="flex justify-between items-center">
                    <button 
                        onClick={() => {
                            const newPage = Math.max(1, page - 1);
                            setPage(newPage);
                            fetchStudents(newPage);
                        }}
                        disabled={page === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors"
                    >
                        <span>&larr;</span> Previous
                    </button>
                    
                    <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                        Page {page} of {totalPages}
                    </span>
                    
                    <button 
                        onClick={() => {
                            const newPage = Math.min(totalPages, page + 1);
                            setPage(newPage);
                            fetchStudents(newPage);
                        }}
                        disabled={page === totalPages || totalPages === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors"
                    >
                        Next <span>&rarr;</span>
                    </button>
                </div>
                
                <div className="flex justify-center items-center mt-2">
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="bg-white dark:bg-slate-800 border border-gray-400/70 dark:border-slate-700 focus:border-blue-500 text-gray-900 dark:text-white rounded-xl py-2 px-4 text-[13px] outline-none shadow-sm transition-all font-bold"
                    >
                        <option value={1}>1 student / page</option>
                        <option value={2}> 2 students / page</option>
                        <option value={5}> 5 students / page</option>
                        <option value={10}> 10 students / page</option>
                        <option value={20}> 20 students / page</option>
                        <option value={50}> 50 students / page</option>
                    </select>
                </div>
            </div>
        )}

        {/* Add Member Button */}
        <div className="px-6 mt-3 mb-8">
          <button
          onClick={openAddMemberModal}
          className="w-full py-4 bg-blue-900 hover:bg-blue-800 border-dashed border-2 border-white/80 dark:border-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] text-[14px]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add New Member
          </button>
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
                  <button onClick={() => setIsNotificationModalOpen(true)} className="touch-auto flex-1 bg-white/20 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/30 active:scale-[0.98] transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>Alerts</button>
                  <button onClick={() => setIsBulkRemoveActionMenuOpen(true)} className="touch-auto flex-1 bg-red-400/80 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-red-500 active:scale-[0.98] transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Remove</button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsBulkAssignOpen(true)} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>Change Sub-Group</button>
                  <button onClick={() => setIsDownloadModalOpen(true)} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>Export</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals Bundle */}
      <AnimatePresence>

        {isLabelPopupOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setIsLabelPopupOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
              <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">Add New Sub-Group</h2>
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Create a new sub-group for mentees</p>
              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="Enter Sub-Group name"
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold outline-none border-none placeholder-gray-400"
                />
                <button onClick={handleAddLabel} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Create Sub-Group</button>
                <button onClick={() => setIsLabelPopupOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isNotificationModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setIsNotificationModalOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
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
                <button onClick={() => setIsNotificationModalOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Maybe Later</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <AiAnalysisModals
          isOpen={isAiAnalysisModalOpen}
          onClose={() => setIsAiAnalysisModalOpen(false)}
          students={students.filter(s => selectedStudents.includes(s.id))}
          userDetails={userDetails}
        />

        {isBulkAssignOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setIsBulkAssignOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
              <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">Move Students</h2>
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Update labels for {selectedStudents.length} students</p>
              <div className="space-y-6">
                <select value={bulkLabel} onChange={e => setBulkLabel(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold outline-none border-none">
                  <option
                    className="uppercase"
                    value="">Select Sub-Group</option>
                  {labels.map(l => <option className="uppercase" key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button onClick={handleBulkAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Confirm Move</button>
                <button onClick={() => setIsBulkAssignOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {actionMenuStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setActionMenuStudent(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-6 pb-8 rounded-t-[32px] transition-colors duration-300">
              <div className="flex justify-center mb-6 cursor-grab active:cursor-grabbing" onClick={() => setActionMenuStudent(null)}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#334155] rounded-full" />
              </div>

              <div className="space-y-2 mb-6">
                <button
                  onClick={() => {
                    const student = actionMenuStudent;
                    setActionMenuStudent(null);
                    setEditingStudent(student);
                    setEditLabel(student.label_id);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1E293B] rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-[#0f172a] dark:text-[#F8FAFC]">Update Sub-Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Move to a different sub-group</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                <button
                  onClick={() => {
                    const student = actionMenuStudent;
                    setActionMenuStudent(null);
                    setStudentToRemoveFromSubgroup(student);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-red-500">Remove from Sub-Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Remove this member From Sub-Group</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button
                  onClick={() => {
                    const student = actionMenuStudent;
                    setActionMenuStudent(null);
                    setStudentToRemove(student);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-red-500">Remove from Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Remove this member Entirely</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <button onClick={() => setActionMenuStudent(null)} className="w-full py-4 rounded-2xl border border-gray-400/70 dark:border-[#334155] text-gray-600 dark:text-[#CBD5E1] font-bold text-[16px] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {isBulkRemoveActionMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setIsBulkRemoveActionMenuOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-6 pb-8 rounded-t-[32px] transition-colors duration-300">
              <div className="flex justify-center mb-6 cursor-grab active:cursor-grabbing" onClick={() => setIsBulkRemoveActionMenuOpen(false)}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#334155] rounded-full" />
              </div>

              <div className="space-y-2 mb-6">
                <button
                  onClick={() => {
                    setIsBulkRemoveActionMenuOpen(false);
                    setIsRemoveFromSubGroupConfirmOpen(true);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-red-500">Remove from Sub-Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Move to Uncategorized</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button
                  onClick={() => {
                    setIsBulkRemoveActionMenuOpen(false);
                    setIsBulkRemoveFromGroupConfirmOpen(true);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-red-500">Remove from Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Remove selected members entirely</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <button onClick={() => setIsBulkRemoveActionMenuOpen(false)} className="w-full py-4 rounded-2xl border border-gray-400/70 dark:border-[#334155] text-gray-600 dark:text-[#CBD5E1] font-bold text-[16px] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {isRemoveFromSubGroupConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsRemoveFromSubGroupConfirmOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-sm p-8 rounded-[32px] shadow-2xl transition-colors duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2">Remove Students</h3>
              <p className="text-gray-500 dark:text-[#94A3B8] font-medium mb-8">
                Are you sure you want to remove <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudents.length}</span> selected student(s) from their sub-group(s)?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsRemoveFromSubGroupConfirmOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#1E293B] text-gray-700 dark:text-[#CBD5E1] font-bold hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveFromSubGroup}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isBulkRemoveFromGroupConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsBulkRemoveFromGroupConfirmOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-sm p-8 rounded-[32px] shadow-2xl transition-colors duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2">Remove Students</h3>
              <p className="text-gray-500 dark:text-[#94A3B8] font-medium mb-8">
                Are you sure you want to remove <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStudents.length}</span> selected student(s) from this group entirely?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsBulkRemoveFromGroupConfirmOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#1E293B] text-gray-700 dark:text-[#CBD5E1] font-bold hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkRemoveFromGroup}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {studentToRemoveFromSubgroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setStudentToRemoveFromSubgroup(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-sm p-8 rounded-[32px] shadow-2xl transition-colors duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2">Remove Member</h3>
              <p className="text-gray-500 dark:text-[#94A3B8] font-medium mb-8">
                Are you sure you want to remove <span className="font-bold text-gray-800 dark:text-gray-200">{studentToRemoveFromSubgroup.name}</span> from this sub-group?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setStudentToRemoveFromSubgroup(null)}
                  className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#1E293B] text-gray-700 dark:text-[#CBD5E1] font-bold hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const id = studentToRemoveFromSubgroup.id;
                    setStudentToRemoveFromSubgroup(null);
                    postRequest('/assign-student-center-label', {
                      user_id: userDetails.user_id,
                      center_id: centerId,
                      label_id: "0",
                      student_ids: [id]
                    }, (res) => {
                      const data = res.data;
                      if (data?.status === 1) {
                        showSuccess('Student removed from sub-group');
                        fetchStudents(1, false);
                      } else {
                        showError(data?.message || 'Failed to remove student');
                      }
                    });
                  }}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {studentToRemove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setStudentToRemove(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-sm p-8 rounded-[32px] shadow-2xl transition-colors duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2">Remove Member</h3>
              <p className="text-gray-500 dark:text-[#94A3B8] font-medium mb-8">
                Are you sure you want to remove <span className="font-bold text-gray-800 dark:text-gray-200">{studentToRemove.name}</span> from this group? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setStudentToRemove(null)}
                  className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#1E293B] text-gray-700 dark:text-[#CBD5E1] font-bold hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const id = studentToRemove.id;
                    setStudentToRemove(null);
                    postRequest('/assign-student-center-label', {
                      user_id: userDetails.user_id,
                      center_id: 0,
                      student_ids: [id]
                    }, (res) => {
                      const data = res.data;
                      if (data?.status === 1) {
                        showSuccess('Student removed from group');
                        fetchStudents(1, false);
                      } else {
                        showError(data?.message || 'Failed to remove student');
                      }
                    });
                  }}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setEditingStudent(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
              <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">{editingStudent.name}</h2>
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Change Sub-Group within Group</p>
              <div className="space-y-6">
                <select value={editLabel} onChange={e => setEditLabel(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none">
                  <option className="uppercase" value="">Select Sub-Group</option>
                  {labels.map(l => <option className="uppercase" key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button onClick={handleSingleAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Update Sub-Group</button>
                <button onClick={() => setEditingStudent(null)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isDownloadModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDownloadModalOpen(false)} className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
              <h2 className="text-2xl font-black mb-8 text-[#0f172a] dark:text-[#F8FAFC]">Export Students</h2>
              <div className="space-y-3">
                {['Excel (.xls)', 'CSV (.csv)', 'Print PDF'].map(f => (
                  <button key={f} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold flex items-center justify-between group hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">{f}</span>
                    <svg className="w-5 h-5 text-gray-400 dark:text-[#94A3B8]" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                  </button>
                ))}
                <button onClick={() => setIsDownloadModalOpen(false)} className="w-full py-6 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isGroupActionMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setIsGroupActionMenuOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-6 pb-8 rounded-t-[32px] transition-colors duration-300">
              <div className="flex justify-center mb-6 cursor-grab active:cursor-grabbing" onClick={() => setIsGroupActionMenuOpen(false)}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#334155] rounded-full" />
              </div>

              <div className="space-y-2 mb-6">
                {/* Option 1: Rename Group */}
                <button
                  onClick={() => {
                    setIsGroupActionMenuOpen(false);
                    setRenameInput(groupName);
                    setIsRenameModalOpen(true);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1E293B] rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-[#0f172a] dark:text-[#F8FAFC]">Rename Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Change the group name</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                {/* Option 2: Delete Group */}
                <button
                  onClick={() => {
                    setIsGroupActionMenuOpen(false);
                    setIsDeleteGroupConfirmOpen(true);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-red-500">Delete Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Permanently delete this group</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <button onClick={() => setIsGroupActionMenuOpen(false)} className="w-full py-4 rounded-2xl border border-gray-400/70 dark:border-[#334155] text-gray-600 dark:text-[#CBD5E1] font-bold text-[16px] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {isRenameModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setIsRenameModalOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
              <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">Rename Group</h2>
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Enter a new name for the group</p>
              <div className="space-y-6">
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="Group Name"
                  className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
                <button
                  onClick={() => {
                    if (!renameInput.trim()) return setErrorMessage('Group name cannot be empty');
                    if (!renameInput.trim()) return showError('Group name cannot be empty');
                    postRequest('/edit-center', {
                      user_id: userDetails.user_id,
                      center_id: centerId,
                      name: renameInput.trim()
                    }, (res) => {
                      const data = res.data;
                      if (data?.status === 1) {
                        showSuccess('Group renamed successfully');
                        setIsRenameModalOpen(false);
                        // Update state to reflect the new name in the header
                        navigate('.', { replace: true, state: { centerId, groupName: renameInput.trim() } });
                      } else {
                        showError(data?.message || 'Failed to rename group');
                      }
                    });
                  }}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl"
                >
                  Save Changes
                </button>
                <button onClick={() => setIsRenameModalOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isDeleteGroupConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsDeleteGroupConfirmOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-sm p-8 rounded-[32px] shadow-2xl transition-colors duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2">Delete Group</h3>
              <p className="text-gray-500 dark:text-[#94A3B8] font-medium mb-8">
                Are you sure you want to permanently delete <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">{groupName}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteGroupConfirmOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#1E293B] text-gray-700 dark:text-[#CBD5E1] font-bold hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsDeleteGroupConfirmOpen(false);
                    deleteRequest('/delete-center', {
                      user_id: userDetails.user_id,
                      center_id: centerId
                    }, (res) => {
                      const data = res.data;
                      if (data?.status === 1) {
                        showSuccess('Group deleted successfully');
                        setTimeout(() => navigate(-1), 1500);
                      } else {
                        showError(data?.message || 'Failed to delete group');
                      }
                    });
                  }}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {actionMenuSubgroup && !isRenameSubgroupModalOpen && !isDeleteSubgroupConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setActionMenuSubgroup(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-6 pb-8 rounded-t-[32px] transition-colors duration-300">
              <div className="flex justify-center mb-6 cursor-grab active:cursor-grabbing" onClick={() => setActionMenuSubgroup(null)}>
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-[#334155] rounded-full" />
              </div>

              <div className="space-y-2 mb-6">
                <button
                  onClick={() => {
                    setRenameSubgroupInput(actionMenuSubgroup.name);
                    setIsRenameSubgroupModalOpen(true);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1E293B] rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-[#0f172a] dark:text-[#F8FAFC]">Rename Sub-Group</div>
                      <div className="text-[13px] font-medium text-gray-400 dark:text-[#94A3B8]">Change the sub-group name</div>
                    </div>
                    
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-[#475569] group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button
                  onClick={() => {
                    setIsDeleteSubgroupConfirmOpen(true);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-bold text-red-500">Delete Sub-Group</div>
                      <div className="text-[13px] font-medium text-red-400/70">Permanently delete this sub-group</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-red-300 dark:text-red-900/50 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <button onClick={() => setActionMenuSubgroup(null)} className="w-full py-4 rounded-2xl border border-gray-400/70 dark:border-[#334155] text-gray-600 dark:text-[#CBD5E1] font-bold text-[16px] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {isRenameSubgroupModalOpen && actionMenuSubgroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => { setIsRenameSubgroupModalOpen(false); setActionMenuSubgroup(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
              <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">Rename Sub-Group</h2>
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Enter a new name for the sub-group</p>
              <div className="space-y-6">
                <input
                  type="text"
                  value={renameSubgroupInput}
                  onChange={(e) => setRenameSubgroupInput(e.target.value)}
                  placeholder="Sub-Group Name"
                  className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
                <button
                  onClick={() => {
                    if (!renameSubgroupInput.trim()) return setErrorMessage('Sub-group name cannot be empty');
                    postRequest('/edit-lable', {
                      user_id: userDetails.user_id,
                      label_id: actionMenuSubgroup.id,
                      lable_name: renameSubgroupInput.trim()
                    }, (res) => {
                      const data = res.data;
                      if (data?.status === 1) {
                        showSuccess('Sub-group renamed successfully');
                        setIsRenameSubgroupModalOpen(false);
                        setActionMenuSubgroup(null);
                        fetchLabels();
                        fetchStudents(page, false);
                      } else {
                        showError(data?.message || 'Failed to rename sub-group');
                      }
                    });
                  }}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl"
                >
                  Save Changes
                </button>
                <button onClick={() => { setIsRenameSubgroupModalOpen(false); setActionMenuSubgroup(null); }} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isDeleteSubgroupConfirmOpen && actionMenuSubgroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setIsDeleteSubgroupConfirmOpen(false); setActionMenuSubgroup(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-sm p-8 rounded-[32px] shadow-2xl transition-colors duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC] mb-2">Delete Sub-Group</h3>
              <p className="text-gray-500 dark:text-[#94A3B8] font-medium mb-8">
                Are you sure you want to permanently delete <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">{actionMenuSubgroup.name}</span>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => { setIsDeleteSubgroupConfirmOpen(false); setActionMenuSubgroup(null); }}
                  className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#1E293B] text-gray-700 dark:text-[#CBD5E1] font-bold hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsDeleteSubgroupConfirmOpen(false);
                    setActionMenuSubgroup(null);
                    postRequest('/delete-lable', {
                      label_id: actionMenuSubgroup.id
                    }, (res) => {
                      const data = res.data;
                      if (data?.status === 1) {
                        showSuccess('Sub-group deleted successfully');
                        fetchLabels();
                        fetchStudents(page, false);
                      } else {
                        showError(data?.message || 'Failed to delete sub-group');
                      }
                    });
                  }}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

                {isAddMemberModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsAddMemberModalOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-6 rounded-[32px] shadow-2xl transition-colors duration-300 max-h-[80vh] flex flex-col">
              <h3 className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC] mb-4">Add Members to Group</h3>
              
              <div className="flex-1 overflow-y-auto min-h-[200px] pr-2 custom-scrollbar">
                {isFetchingUncategorized ? (
                  <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : uncategorizedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 font-medium">No unassigned mentees found.</div>
                ) : (
                  <div className="space-y-2">
                    {uncategorizedStudents.map(student => (
                      <div key={student.user_id} onClick={() => {
                        setSelectedUncategorized(prev => prev.includes(student.user_id) ? prev.filter(id => id !== student.user_id) : [...prev, student.user_id]);
                      }} className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border border-transparent hover:border-gray-400/70 dark:hover:border-slate-600 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-bold text-[15px] text-gray-900 dark:text-white">{student.name}</h4>
                          <p className="text-[12px] text-gray-500">{student.mobile}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedUncategorized.includes(student.user_id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-slate-500'}`}>
                          {selectedUncategorized.includes(student.user_id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6 pt-4 border-t border-gray-300 dark:border-slate-800">
                <button onClick={() => setIsAddMemberModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-[#1E293B] text-gray-700 dark:text-[#CBD5E1] font-bold hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors">Cancel</button>
                <button onClick={handleAssignNewMembers} disabled={selectedUncategorized.length === 0} className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30">Add Selected</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AiAnalysisModals
        isOpen={isAiAnalysisModalOpen}
        onClose={() => setIsAiAnalysisModalOpen(false)}
        students={aiAnalysisStudents}
        userDetails={userDetails}
      />

      <CounsellorBottomNavigation />
    </div>


  );
};

export default GroupMenteesList;
