import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest, postRequest } from '../../../services/api';

export const CustomActivitiesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userDetails } = useOutletContext() || {};
    
    // We expect center_id and label_id, and maybe name, in location state
    const center_id = location.state?.center_id || '';
    const label_id = location.state?.label_id || '';
    const groupName = location.state?.name || 'Group/Sub-Group';

    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };
    const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };

    const fetchActivities = useCallback(() => {
        if (!userDetails?.user_id) return;
        setIsLoading(true);
        const payload = {
            user_id: userDetails.user_id,
            page_no: 1,
            center_id: center_id,
            label_id: label_id,
        };

        // Reusing the same endpoint CustomActivities uses to fetch assigned items
        getRequest('/selectable-activities-list', payload, (response) => {
            const res = response.data;
            if (res && res.code === 200) {
                const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
                // Filter only assigned activities (assuming status === 1 means assigned based on CustomActivities.jsx)
                setActivities(rawData.filter(a => a.status === 1));
            } else {
                showError('Failed to fetch activities');
            }
            setIsLoading(false);
        });
    }, [userDetails?.user_id, center_id, label_id]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const handleRemoveActivity = (activityId) => {
        // TODO: Call your actual un-assign API here once it is built.
        // For now, we will simulate the UI removal.
        if(window.confirm("Are you sure you want to remove this activity from the group?")) {
            showSuccess('Activity removed successfully (Simulated)');
            setActivities(prev => prev.filter(a => a.master_activity_id !== activityId));
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-white dark:bg-[#0F172A] sm:bg-gray-100 sm:dark:bg-black font-sans transition-all duration-300 sm:py-6 flex flex-col items-center">
            <AnimatePresence>
                {errorMessage && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
                {successMessage && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
            </AnimatePresence>

            <div className="w-full max-w-md border-0 sm:border border-gray-400/70 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] flex-1 sm:rounded-[40px] overflow-y-auto hide-scrollbar shadow-none sm:shadow-2xl relative flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20 border-b border-gray-300 dark:border-[#1E293B] transition-colors duration-300">
                    <button onClick={() => navigate(-1)} className="text-[#64748b] dark:text-[#CBD5E1] font-bold hover:text-blue-500 transition-colors">Back</button>
                    <h1 className="text-[18px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] truncate max-w-[200px] text-center">{groupName}</h1>
                    <div className="w-10"></div> {/* Spacer for perfect centering */}
                </div>

                <div className="flex-1 px-6 py-6 overflow-y-auto">
                    <div className="text-[12px] font-black uppercase text-gray-400 dark:text-[#64748b] tracking-wide mb-4">Assigned Activities</div>
                    
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-slate-700">
                                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                            <h3 className="text-[#0f172a] dark:text-white font-bold text-lg mb-1">No activities yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm px-4 leading-relaxed">This group currently doesn't have any custom activities assigned to it.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activities.map(activity => (
                                <div key={activity.master_activity_id} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-600 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-tight">{activity.name}</h3>
                                            <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 capitalize mt-0.5">{activity.activity_type || 'Activity Task'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveActivity(activity.master_activity_id)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm"
                                        title="Remove Activity"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Action Area */}
                <div className="px-6 py-6 border-t border-gray-200 dark:border-[#1E293B] mt-auto bg-gray-50/50 dark:bg-[#1E293B]/50 backdrop-blur-md">
                    <button 
                        onClick={() => navigate('/counsellor/custom-activities', { state: { center_id, label_id } })}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_8px_30px_rgb(37,99,235,0.25)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] active:scale-[0.98] text-[15px]"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add Custom Activities
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomActivitiesPage;