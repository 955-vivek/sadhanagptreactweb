import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import { getRequest, postRequest } from '../../../services/api';
import { processResponse } from '../../../utils/apiUtils';

const MenteesList = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState(null);
  const [editGroup, setEditGroup] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editLabelsList, setEditLabelsList] = useState([]);
  
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkGroup, setBulkGroup] = useState('');
  const [bulkLabel, setBulkLabel] = useState('');
  const [bulkLabelsList, setBulkLabelsList] = useState([]);
  
  const calculateDateStr = (daysBack) => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return d.toISOString().split('T')[0];
  };

  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiRangeType, setAiRangeType] = useState('LAST_2_DAYS');
  const [aiDateFrom, setAiDateFrom] = useState(() => calculateDateStr(2));
  const [aiDateTo, setAiDateTo] = useState(() => calculateDateStr(1));

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const handleAiRangeChange = (range) => {
    setAiRangeType(range);
    if (range === 'CUSTOM') return;
    
    switch (range) {
      case 'LAST_2_DAYS': 
        setAiDateFrom(calculateDateStr(2)); 
        setAiDateTo(calculateDateStr(1)); 
        break;
      case 'LAST_7_DAYS': 
        setAiDateFrom(calculateDateStr(7)); 
        setAiDateTo(calculateDateStr(1)); 
        break;
      case 'LAST_30_DAYS': 
        setAiDateFrom(calculateDateStr(30)); 
        setAiDateTo(calculateDateStr(1)); 
        break;
      case 'LAST_90_DAYS': 
        setAiDateFrom(calculateDateStr(90)); 
        setAiDateTo(calculateDateStr(1)); 
        break;
      default: break;
    }
  };
  
  const SELECTION_LIMIT = 50;
  const observerTarget = useRef(null);

  const fetchCenters = useCallback(() => {
    getRequest('/group-list', { user_id: userDetails.user_id, page_no: 1 }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setCenters(res.data);
      }
    });
  }, [userDetails.user_id]);

  const fetchLabels = useCallback((centerId, setList, currentVal, setter) => {
    if (!centerId || centerId === 'All') {
      if (setList) setList([]);
      return;
    }
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        const list = res.data.map(l => ({ id: l.label_id, name: l.label_name }));
        if (setList) setList(list);
        if (setter && list.length > 0 && !list.find(l => l.id === currentVal)) {
           // setter(list[0].id);
        }
      }
    });
  }, [userDetails.user_id]);

  const fetchStudents = useCallback((pageNum = 1, shouldAppend = false) => {
    setIsLoading(true);
    const payload = {
      user_id: userDetails.user_id,
      categroy: selectedGroup === 'Uncategorized' ? 'un-categorized' : (selectedGroup === 'All' ? 'all' : ''),
      page_no: pageNum,
      center_id: (selectedGroup === 'All' || selectedGroup === 'Uncategorized') ? "" : selectedGroup,
      label_id: selectedLabel === 'All' ? "" : selectedLabel,
      search_text: searchQuery
    };

    getRequest('/student-list', payload, (response) => {
      console.log('Mentee Response:', response);
      const res = response.data;
      if (res && res.code === 200) {
        const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
        console.log('Raw Data:', rawData);
        const mappedStudents = rawData.map(s => ({
          id: s.user_id,
          name: s.name,
          group: s.center_name || 'N/A',
          label: s.label_name || 'N/A',
          center_id: s.center_id,
          label_id: s.label_id,
          avatar: s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`,
          activities: s.activities || []
        }));
        setStudents(prev => {
          const newState = shouldAppend ? [...prev, ...mappedStudents] : mappedStudents;
          console.log('Students State:', newState);
          return newState;
        });
        setTotalPages(res.total_page || 1);
      } else {
        console.log('API did not return code 200. Res:', res);
      }
      setIsLoading(false);
    });
  }, [userDetails.user_id, selectedGroup, selectedLabel, searchQuery]);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);
  useEffect(() => {
    fetchLabels(selectedGroup, setLabels);
    setSelectedLabel('All');
  }, [selectedGroup, fetchLabels]);
  useEffect(() => { fetchStudents(1, false); setPage(1); }, [fetchStudents]);

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

  useEffect(() => { if (editGroup) fetchLabels(editGroup, setEditLabelsList); }, [editGroup, fetchLabels]);
  useEffect(() => { if (bulkGroup) fetchLabels(bulkGroup, setBulkLabelsList); }, [bulkGroup, fetchLabels]);

  const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };
  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id);
      if (prev.length >= SELECTION_LIMIT) { showError(`Max ${SELECTION_LIMIT} students.`); return prev; }
      return [...prev, id];
    });
  };

  const handleBulkAssign = () => {
    //!bulkLabel
    if (!bulkGroup) return showError("Select  group for assignment");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: selectedStudents,
      center_id: bulkGroup,
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

  const handleSingleAssign = () => {
    if (!editGroup || !editLabel) return showError("Select both group and label");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: [editingStudent.id],
      center_id: editGroup,
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

  const fetchAiHistory = (studentId) => {
    setIsAiAnalysisModalOpen(false);
    setIsHistoryModalOpen(true);
    setIsFetchingHistory(true);
    getRequest(`/api/ai/student-analysis/history/${studentId}`, { user_id: userDetails.user_id }, (response) => {
      setIsFetchingHistory(false);
      if (response?.data?.status === 1) {
        setHistoryList(response.data.data || []);
      } else {
        showError(response?.data?.message || 'Failed to fetch history');
        setHistoryList([]);
      }
    });
  };

  const fetchSingleAiReport = (reportId) => {
    setIsHistoryModalOpen(false);
    setIsGeneratingAI(true);
    setPreviewData(null);
    setIsPreviewModalOpen(true);
    
    getRequest(`/api/ai/student-analysis/report/${reportId}`, { user_id: userDetails.user_id }, (response) => {
      setIsGeneratingAI(false);
      if (response?.data?.status === 1) {
        setPreviewData(response.data.data);
      } else {
        showError(response?.data?.message || 'Failed to fetch report');
        setIsPreviewModalOpen(false);
      }
    });
  };

  const handleAiAnalysis = () => {
    console.log("Generate AI Insights Clicked");
    console.log("Selected Students:", selectedStudents);
    console.log("Date From:", aiDateFrom);
    console.log("Date To:", aiDateTo);

    try {
      if (selectedStudents.length === 0) return showError("Select at least one student");
      if (!aiDateFrom || !aiDateTo) return showError("Select date range");

      const fromTime = new Date(aiDateFrom).getTime();
      const toTime = new Date(aiDateTo).getTime();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTime = new Date(todayStr).getTime();

      if (fromTime > toTime) return showError("From Date cannot be after To Date");
      if (toTime > todayTime) return showError("Cannot analyze future dates");
      if ((toTime - fromTime) / (1000 * 3600 * 24) > 365) return showError("Range cannot exceed 365 days");

      const payload = {
        user_id: userDetails.user_id,
        studentId: selectedStudents[0],
        rangeType: aiRangeType,
        fromDate: aiDateFrom,
        toDate: aiDateTo
      };

      console.log("Sending Payload:", payload);

      setIsAiAnalysisModalOpen(false);
      navigate('/counsellor/ai-chat', {
        state: {
          studentIds: selectedStudents,
          fromDate: aiDateFrom,
          toDate: aiDateTo
        }
      });
    } catch (err) {
      console.error("handleAiAnalysis error:", err);
      showError("An unexpected error occurred.");
    }
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-[#0F172A] font-sans transition-all duration-300 ${selectedStudents.length > 0 ? 'pb-[280px]' : 'pb-[84px]'}`}>
      <AnimatePresence>
        {errorMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
        {successMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
      </AnimatePresence>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20 border-b border-gray-100 dark:border-[#1E293B] transition-colors duration-300">
          <button onClick={() => navigate(-1)} className="text-[#64748b] dark:text-[#CBD5E1] font-bold">Back</button>
          <h1 className="text-[18px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">All Mentees</h1>
          <button onClick={() => selectedStudents.length > 0 ? setSelectedStudents([]) : setSelectedStudents(students.slice(0, SELECTION_LIMIT).map(s=>s.id))} className="text-[#1a73e8] dark:text-[#60A5FA] font-bold">{selectedStudents.length > 0 ? 'Clear' : 'Select'}</button>
        </div>

        <div className="px-6 py-4">
          <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#f8fafc] dark:bg-[#1E293B] rounded-full py-3.5 px-6 text-[15px] dark:text-[#F8FAFC] placeholder:text-[#94a3b8] outline-none transition-colors duration-300" />
        </div>

        <div className="px-6 pb-4 flex gap-3 overflow-x-auto hide-scrollbar">
          <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedLabel('All'); setLabels([]); }} className={`shrink-0 bg-[#f1f5f9] dark:bg-[#1E293B] rounded-full px-5 py-2.5 font-bold text-[13px] outline-none border-none transition-colors duration-300 ${selectedGroup !== 'All' && selectedGroup !== 'Uncategorized' ? 'bg-blue-600 dark:bg-blue-600 text-white' : 'bg-gray-100 dark:bg-[#1E293B] text-gray-800 dark:text-[#F8FAFC]'}`}>
            <option value="Uncategorized">Uncategorized</option>
            <option value="All">All Groups</option>
            {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
          </select>
          
          <select value={selectedLabel} onChange={(e) => setSelectedLabel(e.target.value)} className={`shrink-0 bg-[#f1f5f9] dark:bg-[#1E293B] rounded-full px-5 py-2.5 font-bold text-[13px] outline-none border-none transition-colors duration-300 ${selectedLabel !== 'All' ? 'bg-blue-600 dark:bg-blue-600 text-white' : 'bg-gray-100 dark:bg-[#1E293B] text-gray-800 dark:text-[#F8FAFC]'}`}>
            <option value="All">All Labels</option>
            {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div className="px-2">
          {students.map(student => (
            <div key={student.id} onClick={() => toggleStudent(student.id)} className="flex items-center px-4 py-4 border-b border-gray-50 dark:border-[#1E293B] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">
              <img src={student.avatar} className="w-12 h-12 rounded-full mr-4 border border-gray-100 dark:border-[#334155]" />
              <div className="flex-1">
                <h3 className="font-bold text-[16px] text-[#0f172a] dark:text-[#F8FAFC]">{student.name}</h3>
                <p className="text-[12px] text-gray-400 dark:text-[#94A3B8] font-medium">{student.group} • {student.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); setEditGroup(student.center_id); setEditLabel(student.label_id); }} className="p-2 text-gray-300 hover:text-gray-900 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
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
                <button onClick={() => setIsAiAnalysisModalOpen(true)} className="touch-auto w-full bg-white text-[#1a73e8] rounded-2xl py-3.5 mb-3 font-black text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>AI Analysis</button>
                <div className="flex gap-3">
                  <button onClick={() => setIsBulkAssignOpen(true)} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>Assign</button>
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
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsLabelPopupOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center">
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-8 rounded-t-[40px] shadow-2xl transition-colors duration-300">
                <h2 className="text-2xl font-black mb-6 text-[#0f172a] dark:text-[#F8FAFC]">Select Label</h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                   <button onClick={()=>{setSelectedLabel('All'); setIsLabelPopupOpen(false)}} className={`w-full p-4 rounded-2xl text-left font-bold transition-colors ${selectedLabel === 'All' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-[#1E293B] dark:text-[#F8FAFC]'}`}>All Mentees</button>
                   {labels.map(l => <button key={l.id} onClick={()=>{setSelectedLabel(l.id); setIsLabelPopupOpen(false)}} className={`w-full p-4 rounded-2xl text-left font-bold transition-colors ${selectedLabel === l.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-[#1E293B] dark:text-[#F8FAFC]'}`}>{l.name}</button>)}
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

               <div className="flex flex-wrap gap-2 mb-6">
                 {[
                   { label: '2 Days', value: 'LAST_2_DAYS' },
                   { label: '7 Days', value: 'LAST_7_DAYS' },
                   { label: '30 Days', value: 'LAST_30_DAYS' },
                   { label: '90 Days', value: 'LAST_90_DAYS' },
                   { label: 'Custom', value: 'CUSTOM' }
                 ].map(preset => (
                   <button
                     key={preset.value}
                     onClick={() => handleAiRangeChange(preset.value)}
                     className={`px-4 py-2 rounded-full font-bold text-[12px] transition-colors duration-300 ${aiRangeType === preset.value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-[#1E293B] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-[#334155]'}`}
                   >
                     {preset.label}
                   </button>
                 ))}
               </div>

               <div className="space-y-6">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 dark:text-[#64748b] mb-2 block tracking-widest">Date From</label><input type="date" value={aiDateFrom} disabled={aiRangeType !== 'CUSTOM'} onChange={e=>setAiDateFrom(e.target.value)} className={`w-full p-4 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none [color-scheme:light] dark:[color-scheme:dark] transition-opacity ${aiRangeType !== 'CUSTOM' ? 'opacity-50 cursor-not-allowed' : ''}`} /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 dark:text-[#64748b] mb-2 block tracking-widest">Date To</label><input type="date" value={aiDateTo} disabled={aiRangeType !== 'CUSTOM'} onChange={e=>setAiDateTo(e.target.value)} className={`w-full p-4 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none [color-scheme:light] dark:[color-scheme:dark] transition-opacity ${aiRangeType !== 'CUSTOM' ? 'opacity-50 cursor-not-allowed' : ''}`} /></div>
                  <div className="space-y-3">
                    <button onClick={handleAiAnalysis} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Generate AI Insights</button>
                    {selectedStudents.length === 1 && (
                      <button onClick={() => fetchAiHistory(selectedStudents[0])} className="w-full bg-gray-100 dark:bg-[#1E293B] text-gray-500 dark:text-[#94A3B8] py-4 rounded-2xl font-black shadow-sm hover:bg-gray-200 dark:hover:bg-[#334155] transition-colors">View AI History</button>
                    )}
                  </div>
                  <button onClick={()=>setIsAiAnalysisModalOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] font-bold transition-colors">Close</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {isBulkAssignOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setIsBulkAssignOpen(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
               <h2 className="text-2xl font-black mb-8 text-[#0f172a] dark:text-[#F8FAFC]">Bulk Assignment</h2>
               <div className="space-y-6">
                  <select value={bulkGroup} onChange={e=>setBulkGroup(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold outline-none border-none">
                    <option value="">Select Group</option>
                    {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                  </select>
                  <select value={bulkLabel} onChange={e=>setBulkLabel(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold outline-none border-none" disabled={!bulkGroup}>
                    <option value="">Select Label</option>
                    {bulkLabelsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button onClick={handleBulkAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Update {selectedStudents.length} Students</button>
                  <button onClick={()=>setIsBulkAssignOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] font-bold transition-colors">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {editingStudent && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setEditingStudent(null)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
               <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">{editingStudent.name}</h2>
               <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-8">Edit Student Assignment</p>
               <div className="space-y-6">
                  <select value={editGroup} onChange={e=>setEditGroup(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none">
                    <option value="">Select Group</option>
                    {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                  </select>
                  <select value={editLabel} onChange={e=>setEditLabel(e.target.value)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none" disabled={!editGroup}>
                    <option value="">Select Label</option>
                    {editLabelsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button onClick={handleSingleAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Save Changes</button>
                  <button onClick={()=>setEditingStudent(null)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] font-bold transition-colors">Cancel</button>
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
                   <button onClick={()=>setIsDownloadModalOpen(false)} className="w-full py-6 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] font-bold transition-colors">Close</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {isPreviewModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-[2rem] transition-colors duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                 <div>
                   <h2 className="text-2xl font-black text-[#0f172a] dark:text-[#F8FAFC]">AI Student Analysis</h2>
                   <p className="text-sm font-bold text-gray-400 mt-1">Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                 </div>
                 <button onClick={()=>setIsPreviewModalOpen(false)} className="text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] p-2 bg-gray-50 dark:bg-[#1E293B] rounded-full">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              {isGeneratingAI ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="font-bold text-gray-500 dark:text-gray-400 animate-pulse">Generating AI Analysis...</p>
                </div>
              ) : (previewData && previewData.kpis && previewData.aiAnalysis) ? (              <div className="space-y-8">
                {/* Overall Status */}
                <div>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Overall Status</h3>
                   <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                     {previewData.aiAnalysis.overallStatus || "Analysis Unavailable."}
                   </div>
                </div>

                {/* Strengths */}
                {previewData.aiAnalysis.strengths?.length > 0 && (
                  <div>
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Strengths</h3>
                     <div className="space-y-3">
                       {previewData.aiAnalysis.strengths.map((str, i) => (
                         <div key={i} className="flex gap-3 text-sm text-gray-800 dark:text-gray-200">
                           <span className="text-green-500 font-bold shrink-0">✓</span>
                           <p>{str}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                {/* Laggings */}
                {previewData.aiAnalysis.laggings?.length > 0 && (
                  <div>
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Laggings</h3>
                     <div className="space-y-3">
                       {previewData.aiAnalysis.laggings.map((lag, i) => (
                         <div key={i} className="flex gap-3 text-sm text-gray-800 dark:text-gray-200">
                           <span className="text-orange-500 font-bold shrink-0">⚠</span>
                           <p>{lag}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                {/* Recommendations */}
                {previewData.aiAnalysis.recommendations?.length > 0 && (
                  <div>
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Recommendations</h3>
                     <div className="space-y-3">
                       {previewData.aiAnalysis.recommendations.map((rec, i) => (
                         <div key={i} className="flex gap-3 text-sm text-gray-800 dark:text-gray-200">
                           <span className="text-yellow-500 font-bold shrink-0">💡</span>
                           <p>{rec}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-1">
                  <p className="text-xs font-bold text-gray-400">Generated Using: GPT OSS 120B</p>
                  <p className="text-xs font-bold text-gray-400">Generated At: {new Date().toLocaleString('en-GB')}</p>
                </div>
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-red-500 font-bold">Failed to load analysis.</div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {isHistoryModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center">
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black text-[#0f172a] dark:text-[#F8FAFC]">AI History</h2>
                 <button onClick={()=>setIsHistoryModalOpen(false)} className="text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] p-2 bg-gray-50 dark:bg-[#1E293B] rounded-full">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>

               {isFetchingHistory ? (
                 <div className="flex flex-col items-center justify-center py-12 space-y-4">
                   <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                   <p className="font-bold text-gray-500 dark:text-gray-400">Loading history...</p>
                 </div>
               ) : historyList.length === 0 ? (
                 <div className="text-center py-12">
                   <p className="font-bold text-gray-400">No previous AI analysis found.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {historyList.map((h) => (
                     <button
                       key={h.id}
                       onClick={() => fetchSingleAiReport(h.id)}
                       className="w-full text-left bg-gray-50 dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                     >
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-black text-[#0f172a] dark:text-[#F8FAFC]">
                           {new Date(h.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </span>
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${h.riskLevel === 'Low' ? 'bg-green-100 text-green-700' : h.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                           {h.riskLevel} Risk
                         </span>
                       </div>
                       <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">{h.overallStatus}</p>
                       <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Health Score: {h.healthScore}</p>
                     </button>
                   ))}
                 </div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default MenteesList;
