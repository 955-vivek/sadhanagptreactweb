import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import AiAnalysisModals from '../../../components/AiAnalysis/AiAnalysisModals';
import { getRequest, postRequest, deleteRequest } from '../../../services/api';
import { processResponse } from '../../../utils/apiUtils';
import CustomActivitiesPage from '../activites/addActivityPage';
import { exportBulkReportsToCSV, exportBulkReportsToExcel, exportBulkReportsToPDF } from '../../../utils/exportUtils';
import toast from 'react-hot-toast';

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
  const [exportDuration, setExportDuration] = useState('7');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  
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

  const handleExport = async (format) => {
    const selectedData = students.filter(s => selectedStudents.includes(s.id));
    if (selectedData.length === 0) return showError("No students selected");
    
    let durationLabel = exportDuration === 'all' ? 'all_time' : `${exportDuration}_days`;
    if (exportDuration === 'custom') {
       if(!exportStartDate || !exportEndDate) return showError("Please select both start and end dates");
       durationLabel = `${exportStartDate}_to_${exportEndDate}`;
    }

    try {
      const toastId = toast.loading('Fetching activities...');
      const payload = {
        student_ids: selectedData.map(s => s.id),
        filter: exportDuration === 'all' ? 'custom' : exportDuration,
        start_date: exportDuration === 'all' ? '2000-01-01' : exportStartDate,
        end_date: exportDuration === 'all' ? new Date().toISOString().split('T')[0] : exportEndDate
      };

      const res = await postRequest('/export-bulk-student-reports', payload);
      const data = res.data;
      
      toast.dismiss(toastId);

      if (!data || data.status !== 1 || !data.data || data.data.length === 0) {
         showError("No data available to export for selected students.");
         return;
      }

      const filename = `mentees_export_${durationLabel}_${new Date().getTime()}`;
      
      if (format === 'Excel (.xls)') {
         exportBulkReportsToExcel(data.data, `${filename}.xls`);
      } else if (format === 'CSV (.csv)') {
         exportBulkReportsToCSV(data.data, `${filename}.csv`);
      } else if (format === 'Print PDF') {
         exportBulkReportsToPDF(data.data, durationLabel, `${filename}.pdf`);
      }
      
      setIsDownloadModalOpen(false);
    } catch (error) {
      console.error("Export Error:", error);
      showError("Failed to fetch export data");
      toast.dismiss();
    }
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

  return (
    <div className={`min-h-screen bg-white dark:bg-[#0F172A] font-sans transition-all duration-300 ${selectedStudents.length > 0 ? 'pb-[280px]' : 'pb-[84px]'}`}>
      <AnimatePresence>
        {errorMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
        {successMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
      </AnimatePresence>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20 border-b border-gray-300 dark:border-[#1E293B] transition-colors duration-300">
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
            <div key={student.id} className="flex items-center px-4 py-4 border-b border-gray-50 dark:border-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">
              <img 
                src={student.avatar} 
                onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }}
                className="w-12 h-12 rounded-full mr-4 border-2 border-transparent hover:border-white cursor-pointer transition-all duration-300" 
              />
              <div className="flex-1 min-w-0">
                <h3 
                  onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }}
                  className="font-bold text-[16px] text-[#0f172a] dark:text-[#F8FAFC] hover:underline cursor-pointer inline-block truncate max-w-full">
                  {student.name}
                </h3>
                <p className="text-[12px] text-gray-400 dark:text-[#94A3B8] font-medium truncate">{student.group} • {student.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); setEditGroup(student.center_id); setEditLabel(student.label_id); }} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleStudent(student.id); }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${selectedStudents.includes(student.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
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

        {isDownloadModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDownloadModalOpen(false)} className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300">
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-[#0f172a] dark:text-[#F8FAFC]">Export Students</h2>
                  <select 
                    value={exportDuration}
                    onChange={(e) => setExportDuration(e.target.value)}
                    className="bg-gray-100 dark:bg-[#1E293B] text-gray-700 dark:text-[#F8FAFC] font-bold px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {exportDuration === 'custom' && (
                  <div className="flex gap-2 items-center text-sm font-bold bg-gray-50 dark:bg-[#1E293B] p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full bg-transparent outline-none dark:text-white dark:[color-scheme:dark]" />
                    <span className="text-gray-400">to</span>
                    <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full bg-transparent outline-none dark:text-white dark:[color-scheme:dark]" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {['Excel (.xls)', 'CSV (.csv)', 'Print PDF'].map(f => (
                  <button key={f} onClick={() => handleExport(f)} className="w-full p-5 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold flex items-center justify-between group hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">{f}</span>
                    <svg className="w-5 h-5 text-gray-400 dark:text-[#94A3B8]" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                  </button>
                ))}
                <button onClick={() => setIsDownloadModalOpen(false)} className="w-full py-6 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] transition-colors font-bold">Close</button>
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
      </AnimatePresence>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default MenteesList;
