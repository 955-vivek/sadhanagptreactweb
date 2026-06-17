import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityCard from '../../components/shared/ActivityCard';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import BottomNavigation from '../../components/student/BottomNavigation';
import NewActivityModal from '../../components/shared/NewActivityModal';
import EditActivityModal from '../../components/shared/EditActivityModal';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { getRequest, postRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import ReminderPopup from '../../components/shared/ReminderPopup';
import ReminderPermissionCard from '../../components/shared/ReminderPermissionCard';

// Dummy data for notifications (Shared with Student view)
const dummyNotifications = [

];

// Helper to map activity names/ids to icons (Cloned from Mentor side)
const getActivityIcon = (name) => {
  const iconProps = "w-5 h-5";
  if (!name) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

  const nameLower = name.toLowerCase();

  if (nameLower.includes('chanting')) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
  if (nameLower.includes('reading') || nameLower.includes('study')) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
  if (nameLower.includes('lecture') || nameLower.includes('hearing')) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
  if (nameLower.includes('sleep') || nameLower.includes('rest')) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
  if (nameLower.includes('wake')) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

  return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
};

// Colors based on activity type or index
const getColors = (index) => {
  const palettes = [
    { bg: '#eff6ff', text: '#3b82f6', bar: '#1a73e8' }, // blue
    { bg: '#faf5ff', text: '#9333ea', bar: '#a855f7' }, // purple
    { bg: '#f0fdfa', text: '#0f766e', bar: '#20c997' }, // teal
    { bg: '#fff7ed', text: '#ea580c', bar: '#f97316' }, // orange
    { bg: '#fef2f2', text: '#ef4444', bar: '#f87171' }, // red
  ];
  return palettes[index % palettes.length];
};

const StudentDashboard = () => {
  const { userDetails } = useOutletContext();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [dates, setDates] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const dateContainerRef = useRef(null);
  const hasScrolledRef = useRef(false);

  // Exact Match to Mentor Logic: fetchDailyReport inside fetchActivities chain
  const fetchDailyReport = async (dateObj, currentActivities) => {
    const resolveActivities = currentActivities || activities;
    if (!resolveActivities || !Array.isArray(resolveActivities) || resolveActivities.length === 0) {
      setIsLoading(false);
      return;
    }

    if (!userDetails?.user_id) return;

    try {
      setIsLoading(true);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const payload = { user_id: userDetails.user_id, activity_date: formattedDate };

      postRequest('/report-as-per-date', payload, (response) => {
        if (!response?.data) {
          setIsLoading(false);
          return;
        }
        const res = response.data;
        if (res?.data?.daily_reports && Array.isArray(res.data.daily_reports)) {
          const reports = res.data.daily_reports;
          setActivities(prev => (prev || []).map(act => {
            const report = reports.find(r => String(r.activity_id) === String(act.id));
            const count = report ? report.count : 0;

            const isTimeType = act.type === 'TIME' || act.type === 'time';
            const target = act.target || (isTimeType ? '05:00 AM' : 10);
            const isBoolean = act.type === 'YES/NO' || act.type === 'boolean';

            let newProgress = '';
            let newStatus = 'Pending';

            if (isBoolean) {
              newProgress = '';
              newStatus = count > 0 ? 'Completed' : 'Pending';
            } else if (isTimeType) {
              // Return 'actual / target', so the slider receives '5:00 AM / 08:00 AM'
              newProgress = `${count || '00:00 AM'} / ${target}`;
              newStatus = count ? 'Completed' : 'Pending'; // Time activities are complete if they have any logged time
            } else {
              newProgress = `${count} / ${target}`;
              newStatus = count >= target ? 'Completed' : 'Pending';
            }

            return { ...act, progress: newProgress, status: newStatus };
          }));
        } else {
          // No reports for this day or API failed, reset all counts to 0
          setActivities(prev => (prev || []).map(act => {
            const isTimeType = act.type === 'TIME' || act.type === 'time';
            const target = act.target || (isTimeType ? '05:00 AM' : 10);
            const isBoolean = act.type === 'YES/NO' || act.type === 'boolean';
            return {
              ...act,
              progress: isBoolean ? '' : (isTimeType ? `0 / ${target}` : `0 / ${target}`),
              status: 'Pending'
            };
          }));
        }
        setIsLoading(false);
      });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const user_id = userDetails?.user_id;
      if (!user_id) {
        setIsLoading(false);
        return;
      }

      getRequest('/activity-list', { user_id }, (response) => {
        const { message, type } = processResponse(response.data);
        const res = response.data;
        if (type !== 'success') {
          toast.error(message);
          setIsLoading(false);
          return;
        }

        const acctvtines_list = res?.data?.all_activities;

        if (Array.isArray(acctvtines_list) && acctvtines_list.length > 0) {
          const transformed = acctvtines_list.map((act, index) => {
            const colors = getColors(index);
            const typeMap = { 'numb': 'COUNT', 'min': 'DURATION', 'time': 'TIME', 'boolean': 'YES/NO', 'yes_no': 'YES/NO' };

            return {
              id: act.activity_id,
              title: act.name,
              type: typeMap[act.activity_type] || 'COUNT',
              progress: act.activity_type === 'time' ? `0 / ${act.target || '05:00'}` : `0 / ${act.target || 10}`,
              status: 'Pending',
              iconBgColor: colors.bg,
              iconColor: colors.text,
              barColor: colors.bar,
              iconSvg: getActivityIcon(act.name),
              unit: act.unit,
              description: act.description,
              target: act.target,
              visibility: act.status
            };
          });

          setActivities(transformed);

          // Fetch progress for currently active date
          setDates(prevDates => {
            const activeDateObj = prevDates?.find(d => d.active)?.fullDate || new Date();
            fetchDailyReport(activeDateObj, transformed);
            return prevDates;
          });
        } else {
          setActivities([]);
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error("Fetch Activities Error:", error);
      setIsLoading(false);
    }
  };

  const hasFetchedNotif = useRef(false);
  useEffect(() => {
    if (userDetails?.user_id && !hasFetchedNotif.current) {
      fetchActivities();

      // Initial notification check for badge
      hasFetchedNotif.current = true;
      getRequest('/student-notification-list', { user_id: userDetails.user_id, page_no: 1 }, (res) => {
        if (res.data?.status === 1) {
          const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.data || []);
          // Count only unread (status '0' or 0)
          const unread = list.filter(n => String(n.status) === '0').length;
          setUnreadCount(unread);
        }
      });
    }
  }, [userDetails?.user_id]);

  // Generate the last 30 days starting with 30 days ago, ending at Today
  useEffect(() => {
    const generatedDates = [];
    const today = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      generatedDates.push({
        id: `date-${i}`,
        day: days[d.getDay()],
        date: d.getDate().toString(),
        month: months[d.getMonth()],
        fullDate: d,
        active: i === 0 // Today is active by default
      });
    }
    setDates(generatedDates);
  }, []);

  // Auto-scroll to the right so "Today" is visible on mount
  useEffect(() => {
    if (dates.length > 0 && !hasScrolledRef.current && dateContainerRef.current) {
      dateContainerRef.current.scrollLeft = dateContainerRef.current.scrollWidth;
      hasScrolledRef.current = true;
    }
  }, [dates]);

  const handleProgressUpdate = (id, newProps) => {
    setActivities(prev => prev.map(act => act.id === id ? { ...act, ...newProps } : act));
  };

  const handleDateSelect = (id) => {
    setDates(prev => {
      const newDates = prev.map(d => ({ ...d, active: d.id === id }));
      const selected = newDates.find(d => d.active);
      if (selected) {
        fetchDailyReport(selected.fullDate);
      }
      return newDates;
    });
  };

  const handleEditClick = (activity) => {
    if (!activity) return;
    setActivityToEdit(activity);
    setIsEditActivityOpen(true);
  };

  const handleSaveActivity = async (updatedActivityData) => {
    try {
      let unit = 'count';
      let activityType = 'numb';

      switch (updatedActivityData.trackingType) {
        case 'Count': unit = 'rounds'; activityType = 'numb'; break;
        case 'Duration': unit = 'min'; activityType = 'min'; break;
        case 'Time': unit = 'time'; activityType = 'time'; break;
        case 'Yes/No': unit = 'boolean'; activityType = 'yes_no'; break;
      }

      const payload = {
        activity_id: updatedActivityData.id,
        user_id: userDetails.user_id,
        name: updatedActivityData.name,
        target: activityType === 'yes_no' ? 0 : (updatedActivityData.target ? (activityType === 'time' ? updatedActivityData.target : Number(updatedActivityData.target)) : null),
        unit: unit,
        activity_type: activityType,
        status: updatedActivityData.status || '0'
      };

      postRequest('/edit-acitivity', payload, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success') {
          toast.success(message);
          setTimeout(() => {
            fetchActivities();
            setIsEditActivityOpen(false);
            navigate('/student/dashboard', { replace: true });
          }, 1000);
        } else {
          toast.error(message);
        }
      });

    } catch (error) {
      console.error("Error editing activity:", error);
      toast.error(error.message || "Failed to edit activity");
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;

    try {
      const payload = {
        activity_id: id,
        user_id: userDetails.user_id
      };

      postRequest('/delete-acitivity', payload, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success') {
          setActivities(prev => (prev || []).filter(act => act.id !== id));
          setIsEditActivityOpen(false);
          toast.success(message);
        } else {
          toast.error(message);
        }
      });
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error(error.message);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f1f5f9] via-[#f8fafc] to-[#eef2f6] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] font-sans pb-28 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <h1 className="text-[28px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight">Activities</h1>
          <div className="flex items-center">
            <ThemeToggle />
            <button
              onClick={() => {
                setShowNotifications(true);
                setUnreadCount(0);
              }}
              className="relative w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] shadow-sm flex items-center justify-center text-[#0f172a] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#334155] active:scale-95 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 border-2 border-white dark:border-[#1E293B] text-[10px] font-black text-white shadow-lg animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div ref={dateContainerRef} className="flex gap-4 px-6 overflow-x-auto pb-4 hide-scrollbar scroll-smooth snap-x snap-mandatory">
          {dates.map((item) => (
            <button
              key={item.id}
              onClick={() => handleDateSelect(item.id)}
              className={`snap-center flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[90px] rounded-[20px] transition-all duration-300 shadow-sm select-none ${item.active
                ? 'bg-[#1a73e8] text-white shadow-[#1a73e8]/30 shadow-md scale-105'
                : 'bg-white dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#334155] scale-100'
                }`}
            >
              <span className={`text-[24px] font-extrabold leading-none mb-1 transition-colors ${item.active ? 'text-white' : 'text-[#0f172a] dark:text-[#F8FAFC]'}`}>{item.date}</span>
              <span className={`text-[12px] font-bold uppercase tracking-wider transition-colors ${item.active ? 'text-white/90' : 'text-[#94a3b8] dark:text-[#CBD5E1]'}`}>{item.month}</span>
            </button>
          ))}
        </div>

        {/* Enable Reminders Card */}
        <ReminderPermissionCard
          userId={userDetails?.user_id}
          onGranted={(msg) => toast.success(msg || 'Push notifications enabled!')}
          onDenied={(msg) => toast.error(msg || 'Permission for notifications was denied')}
        />

        {/* Activities List */}
        <div className="px-6 mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-10 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Loading activities...</p>
            </div>
          ) : activities?.length > 0 ? (
            activities.map((act) => {
              if (!act) return null;
              const activeDateObj = dates?.find(d => d.active)?.fullDate || new Date();
              const yyyy = activeDateObj.getFullYear();
              const mm = String(activeDateObj.getMonth() + 1).padStart(2, '0');
              const dd = String(activeDateObj.getDate()).padStart(2, '0');
              const formattedDate = `${yyyy}-${mm}-${dd}`;

              return (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onProgressUpdate={handleProgressUpdate}
                  onEdit={handleEditClick}
                  selectedDate={formattedDate}
                />
              );
            })
          ) : (
            <div className="text-center pt-10">
              <p className="text-gray-500 dark:text-[#CBD5E1] font-medium text-lg">No activities found</p>
              <p className="text-gray-400 dark:text-[#94a3b8] text-sm">Tap the + button to add one</p>
            </div>
          )}
        </div>
      </div>

      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      <NewActivityModal
        isOpen={isNewActivityOpen}
        onClose={() => setIsNewActivityOpen(false)}
        onSave={(activityData) => {
          try {
            let unit = 'count';
            let activityType = 'numb';

            switch (activityData.trackingType) {
              case 'Count': unit = 'rounds'; activityType = 'numb'; break;
              case 'Duration': unit = 'min'; activityType = 'min'; break;
              case 'Time': unit = 'time'; activityType = 'time'; break;
              case 'Yes/No': unit = 'boolean'; activityType = 'yes_no'; break;
            }

            const payload = {
              user_id: userDetails.user_id,
              name: activityData.name,
              target: activityType === 'yes_no' ? 0 : (activityData.target ? (activityType === 'time' ? activityData.target : Number(activityData.target)) : null),
              unit: unit,
              activity_type: activityType,
              status: activityData.status || '0'
            };

            postRequest('/add-acitivity', payload, (response) => {
              const { message, type } = processResponse(response.data);
              if (type === 'success') {
                toast.success(message);
                setTimeout(() => {
                  fetchActivities();
                  setIsNewActivityOpen(false);
                  navigate('/student/dashboard', { replace: true });
                }, 1000);
              } else {
                toast.error(message);
              }
            });
          } catch (error) {
            console.error("Error creating activity:", error);
            toast.error(error.message || "Failed to create activity");
          }
        }}
      />

      <EditActivityModal
        isOpen={isEditActivityOpen}
        onClose={() => setIsEditActivityOpen(false)}
        activityToEdit={activityToEdit}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
      />

      <button
        onClick={() => setIsNewActivityOpen(true)}
        className="fixed bottom-[100px] right-[calc(50%-180px)] lg:right-10 w-[64px] h-[64px] bg-[#1a73e8] hover:bg-[#155fc3] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#1a73e8]/30 transition-transform active:scale-90 z-40 lg:ml-auto"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      <BottomNavigation />

      <AnimatePresence>
        {toastState.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border w-max max-w-[90%] ${toastState.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}
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

      {/* Push Notification Overlay */}
      <ReminderPopup
        userId={userDetails?.user_id}
        onGranted={(msg) => toast.success(msg || 'Reminders enabled successfully!')}
        onDenied={(msg) => toast.error(msg || 'Permission for notifications was denied')}
      />
    </div>
  );
};

export default StudentDashboard;

