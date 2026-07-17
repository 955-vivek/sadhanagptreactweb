import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import AiAnalysisModals from '../../../components/AiAnalysis/AiAnalysisModals';
import CreateNewActivity from './CreateNewActivity';
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
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedLabel, setSelectedLabel] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
    const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
    const [selectedForRemoval, setSelectedForRemoval] = useState([]);
    const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    const [editingStudent, setEditingStudent] = useState(null);
    const [editGroup, setEditGroup] = useState('');
    const [editLabel, setEditLabel] = useState('');
    const [editLabelsList, setEditLabelsList] = useState([]);
    const [bulkGroup, setBulkGroup] = useState('');
    const [bulkLabel, setBulkLabel] = useState('');
    const [bulkLabelsList, setBulkLabelsList] = useState([]);

    const calculateDateStr = (daysBack) => {
        const d = new Date();
        d.setDate(d.getDate() - daysBack);
        return d.toISOString().split('T')[0];
    };

    const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);

    const SELECTION_LIMIT = 50;

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
            center_id: (!selectedGroup || selectedGroup === 'Uncategorized') ? "" : selectedGroup,
            label_id: !selectedLabel ? "" : selectedLabel,
            search_text: searchQuery,
            rowSelected: 1000
        };

        getRequest('/selectable-activities-list', payload, (response) => {
            console.log('Mentee Response:', response);
            const res = response.data;
            if (res && res.code === 200) {
                const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
                console.log('Raw Data:', rawData);
                const mappedStudents = rawData.map(s => ({
                    id: s.master_activity_id,
                    name: s.name,
                    activity_type: s.activity_type || 'Activity',
                    status: s.status,
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
        setSelectedLabel('');
    }, [selectedGroup, fetchLabels]);
    useEffect(() => { fetchStudents(1, false); setPage(1); }, [fetchStudents]);

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
        if (!selectedGroup) {
            return showError("Please select a Group at the top of the page first.");
        }
        const payload = {
            user_id: userDetails.user_id,
            master_activity_ids: selectedStudents,
            center_id: selectedGroup,
            label_id: selectedLabel // This can be empty/All
        };
        postRequest('/assign-group-activities', payload, (res) => {
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

    const handleBulkRemove = () => {
        if (!selectedGroup) {
            return showError("Please select a Group at the top of the page first.");
        }
        const payload = {
            center_id: selectedGroup,
            label_id: selectedLabel,
            master_activity_ids: selectedForRemoval,
        };
        postRequest('/deassign-group-activities', payload, (res) => {
            const data = res.data;
            if (data?.status === 1) {
                showSuccess(data.message || 'Activities removed successfully');
                setSelectedForRemoval([]);
                fetchStudents(1, false);
            } else {
                showError(data?.message || 'Failed to remove activities');
            }
        });
    };

    const handleCreateActivity = async (activityData) => {
        const payload = {
            counsellor_id: userDetails.user_id,
            name: activityData.name,
            activity_type: activityData.trackingType,
            target: activityData.target || 0
        };
        postRequest('/create-custom-activity', payload, (res) => {
            const data = res.data;
            if (data?.status === 1) {
                showSuccess(data.message || 'Custom activity created successfully');
                setIsCreateActivityOpen(false);
                fetchStudents(1, false);
            } else {
                showError(data?.message || 'Failed to create custom activity');
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
        <div className="h-screen overflow-hidden bg-white dark:bg-[#0F172A] sm:bg-gray-100 sm:dark:bg-black font-sans transition-all duration-300 sm:py-6 flex flex-col items-center">
            <AnimatePresence>
                {errorMessage && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
                {successMessage && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
            </AnimatePresence>

            <div className="w-full max-w-md border-0 sm:border border-gray-400/70 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] flex-1 sm:rounded-[40px] overflow-y-auto hide-scrollbar shadow-none sm:shadow-2xl relative">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20 border-b border-gray-300 dark:border-[#1E293B] transition-colors duration-300">
                    <button onClick={() => navigate(-1)} className="text-[#64748b] dark:text-[#CBD5E1] font-bold">Back</button>
                    <h1 className="text-[18px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">All Activities</h1>
                    <button onClick={() => selectedStudents.length > 0 ? setSelectedStudents([]) : setSelectedStudents(students.slice(0, SELECTION_LIMIT).map(s => s.id))} className="text-[#1a73e8] dark:text-[#60A5FA] font-bold">{selectedStudents.length > 0 ? 'Clear' : 'Select'}</button>
                </div>

                <div className="px-6 py-4 flex gap-3 bg-gray-50 dark:bg-[#1E293B]/30 border-b border-gray-300 dark:border-[#1E293B]">
                    <div className="flex-1 relative">
                        <select 
                            value={selectedGroup} 
                            onChange={(e) => setSelectedGroup(e.target.value)} 
                            className="appearance-none w-full bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 font-bold text-[13px] text-gray-800 dark:text-[#F8FAFC] outline-none transition-colors duration-300"
                        >
                            <option value="">-- Select Group --</option>
                            {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="flex-1 relative">
                        <select 
                            value={selectedLabel} 
                            onChange={(e) => setSelectedLabel(e.target.value)} 
                            className="appearance-none w-full bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 font-bold text-[13px] text-gray-800 dark:text-[#F8FAFC] outline-none transition-colors duration-300"
                        >
                            <option value="">All Sub-Groups</option>
                            {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {!selectedGroup ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1E293B] rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400 dark:text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-[#0f172a] dark:text-[#F8FAFC] font-black text-lg mb-2">Select a Group</h3>
                        <p className="text-gray-500 dark:text-[#94A3B8] text-sm font-medium">Please select a group and sub-group from the dropdowns above to view and assign activities.</p>
                    </div>
                ) : (
                    <>
                        <div className="px-6 pt-5 pb-4 text-[12px] font-black uppercase text-gray-400 dark:text-[#64748b] tracking-wide">already added activities</div>

                        <div className="px-6 pb-6 border-b border-gray-300 dark:border-[#1E293B]">
                            <div className="flex flex-wrap gap-2.5">
                                {students.filter(s => s.status === 1).map(student => {
                                    const isSelected = selectedForRemoval.includes(student.id);
                                    return (
                                        <div 
                                            key={student.id} 
                                            onClick={() => setSelectedForRemoval(prev => isSelected ? prev.filter(id => id !== student.id) : [...prev, student.id])}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-colors ${
                                                isSelected 
                                                ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400' 
                                                : 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20'
                                            }`}
                                        >
                                            <span className={`text-[13px] font-bold lowercase ${isSelected ? 'line-through opacity-70' : ''}`}>{student.name}</span>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
                            <div className="text-[12px] font-black uppercase text-gray-400 dark:text-[#64748b] tracking-wide">activities that can be added</div>
                            <button 
                                onClick={() => setIsCreateActivityOpen(true)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-500/20 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg> 
                                Add Custom
                            </button>
                        </div>

                        <div className="px-2 pb-40">
                            {students.filter(s => s.status !== 1).map(student => (
                                <div key={student.id} className="flex items-center px-4 py-3 border-b border-gray-50 dark:border-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">
                                    <img 
                                        src={student.avatar} 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }}
                                        className="w-11 h-11 rounded-full mr-4 border-2 border-transparent hover:border-white cursor-pointer transition-all duration-300" 
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }}
                                            className="font-bold text-[16px] text-[#0f172a] dark:text-[#F8FAFC] hover:underline cursor-pointer inline-block truncate max-w-full">
                                            {student.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); toggleStudent(student.id); }}
                                            className="w-6 h-6 flex items-center justify-center transition-all cursor-pointer">
                                            {selectedStudents.includes(student.id) ? (
                                                <svg className="w-6 h-6 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v12m6-6H6" /></svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {page < totalPages && (
                                <div className="flex justify-center py-6">
                                    <button 
                                        onClick={() => {
                                            const nextPage = page + 1;
                                            setPage(nextPage);
                                            fetchStudents(nextPage, true);
                                        }}
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Loading...' : 'Load More Activities'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
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
                        className="fixed bottom-6 left-0 right-0 max-w-md mx-auto z-40 px-4 touch-none select-none"
                    >
                        <div className="bg-[#1a73e8] rounded-[32px] shadow-2xl shadow-blue-500/40 w-full relative">
                            {/* Drag handle pill */}
                            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                                <div className="w-10 h-1.5 rounded-full bg-white/40" />
                            </div>
                            <div className="px-5 pb-5 pt-2">
                                <div className="flex justify-between items-center mb-4 text-white px-2">
                                    <span className="font-extrabold text-[15px]">Selected: {selectedStudents.length} Activities</span>
                                    <button onClick={() => setSelectedStudents([])} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center touch-auto"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleBulkAssign} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>Assign</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedForRemoval.length > 0 && (
                    <motion.div
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-6 left-0 right-0 max-w-md mx-auto z-40 px-4 touch-none select-none"
                    >
                        <div className="bg-red-500 rounded-[32px] shadow-2xl shadow-red-500/40 w-full relative">
                            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                                <div className="w-10 h-1.5 rounded-full bg-white/40" />
                            </div>
                            <div className="px-5 pb-5 pt-2">
                                <div className="flex justify-between items-center mb-4 text-white px-2">
                                    <span className="font-extrabold text-[15px]">Remove: {selectedForRemoval.length} Activities</span>
                                    <button onClick={() => setSelectedForRemoval([])} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center touch-auto"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleBulkRemove} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Remove from Group
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals Bundle */}
            <AnimatePresence>
                {isLabelPopupOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLabelPopupOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center">
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-8 rounded-t-[40px] shadow-2xl transition-colors duration-300">
                            <h2 className="text-2xl font-black mb-6 text-[#0f172a] dark:text-[#F8FAFC]">Select Label</h2>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                <button onClick={() => { setSelectedLabel('All'); setIsLabelPopupOpen(false) }} className={`w-full p-4 rounded-2xl text-left font-bold transition-colors ${selectedLabel === 'All' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-[#1E293B] dark:text-[#F8FAFC]'}`}>All Mentees</button>
                                {labels.map(l => <button key={l.id} onClick={() => { setSelectedLabel(l.id); setIsLabelPopupOpen(false) }} className={`w-full p-4 rounded-2xl text-left font-bold transition-colors ${selectedLabel === l.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-[#1E293B] dark:text-[#F8FAFC]'}`}>{l.name}</button>)}
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

            <CreateNewActivity 
                isOpen={isCreateActivityOpen} 
                onClose={() => setIsCreateActivityOpen(false)} 
                onSave={handleCreateActivity} 
            />

            {/* <CounsellorBottomNavigation /> */}
        </div>
    );
};

export default MenteesList;
