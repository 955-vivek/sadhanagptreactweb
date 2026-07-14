import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityCard from '../../components/shared/ActivityCard';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import NewActivityModal from '../../components/shared/NewActivityModal';
import EditActivityModal from '../../components/shared/EditActivityModal';
import { getRequest, postRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';

// Dummy data for notifications (Shared temporarily until context/API is built)
const dummyNotifications = [

];

// Helper to map activity names/ids to icons
const getActivityIcon = (name) => {
  const iconProps = "w-5 h-5";
  if (!name) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

  const nameLower = name.toLowerCase();

  if (nameLower.includes('chanting')) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
  if (nameLower.includes('reading')) return <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
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

const CounsellorDashboard = () => {
  const { userDetails } = useOutletContext();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [dates, setDates] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(true); // Default true to avoid flash
  const [dateColors, setDateColors] = useState({});

  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsPushEnabled(true); // hide if not supported
        return;
      }
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const browserSubscription = registration ? await registration.pushManager.getSubscription() : null;

        if (userDetails?.user_id) {
          getRequest('/check-push-status', { user_id: userDetails.user_id }, async (response) => {
            const backendHasSub = response.data?.isSubscribed;
            
            if (browserSubscription && !backendHasSub) {
              // DB deleted it, force unsubscribe on browser
              await browserSubscription.unsubscribe();
              setIsPushEnabled(false);
            } else if (browserSubscription && backendHasSub) {
              setIsPushEnabled(true);
            } else {
              setIsPushEnabled(false);
            }
          });
        } else {
          setIsPushEnabled(!!browserSubscription);
        }
      } catch (e) {
        setIsPushEnabled(false);
      }
    };

    if (userDetails?.user_id) {
      checkSubscription();
    }
  }, [userDetails?.user_id]);

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

  const fetchDailyReport = async (dateObj, currentActivities) => {
    const resolveActivities = currentActivities || activities;
    if (!resolveActivities || resolveActivities.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const payload = { user_id: userDetails.user_id, activity_date: formattedDate };

      postRequest('/report-as-per-date', payload, (response) => {
        const res = response.data;
        if (res?.data) {
          const colorForDate = res.data.color || '#EF4444';
          setDateColors(prev => ({
            ...prev,
            [formattedDate]: colorForDate
          }));
        }
        if (res?.data?.daily_reports && Array.isArray(res.data.daily_reports)) {
          const reports = res.data.daily_reports;
          setActivities(prev => prev.map(act => {
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
          setActivities(prev => prev.map(act => {
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

  // 1. Fetch activities from API

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
            const activeDateObj = prevDates.find(d => d.active)?.fullDate || new Date();
            fetchDailyReport(activeDateObj, transformed);
            return prevDates;
          });
        } else {
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error("Fetch Activities Error:", error);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchActivities();
  }, []);
  // 2. Generate dates logic...
  // Generate the last 30 days starting with 30 days ago, ending at Today
  useEffect(() => {
    const generatedDates = [];
    const today = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Ascend from -29 to 0 so the array is chronological (Today is last)
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

  // Fetch status colors for the generated 30 days range in a single request
  useEffect(() => {
    if (userDetails?.user_id && dates.length > 0) {
      const formatDateString = (dateObj) => {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const startDateStr = formatDateString(dates[0].fullDate);
      const endDateStr = formatDateString(dates[dates.length - 1].fullDate);

      const payload = {
        user_id: userDetails.user_id,
        start_date: startDateStr,
        end_date: endDateStr
      };

      postRequest('/report-colors-range', payload, (response) => {
        if (response.data?.status === 1 && response.data?.data?.colors) {
          setDateColors(prev => ({
            ...prev,
            ...response.data.data.colors
          }));
        }
      });
    }
  }, [userDetails?.user_id, dates.length]);

  // Auto-scroll to the right so "Today" is visible on mount
  useEffect(() => {
    if (dates.length > 0 && !hasScrolledRef.current && dateContainerRef.current) {
      dateContainerRef.current.scrollLeft = dateContainerRef.current.scrollWidth;
      hasScrolledRef.current = true;
    }
  }, [dates]);

  const handleProgressUpdate = (id, newProps) => {
    setActivities(prev => prev.map(act => act.id === id ? { ...act, ...newProps } : act));
    const activeDateObj = dates.find(d => d.active)?.fullDate || new Date();
    fetchDailyReport(activeDateObj);
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

      const response = await new Promise((resolve) => {
        postRequest('/edit-acitivity', payload, resolve);
      });

      const { message, type } = processResponse(response.data);
      const res = response.data;

      if (type === 'success') {
        toast.success(message);
        setTimeout(() => {
          fetchActivities();
          setIsEditActivityOpen(false);
          navigate('/counsellor/dashboard');
        }, 1000);
      } else {
        toast.error(message);
      }

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

      const response = await new Promise((resolve) => {
        postRequest('/delete-acitivity', payload, resolve);
      });

      const { message, type } = processResponse(response.data);
      const res = response.data;

      if (type === 'success') {
        setActivities(prev => prev.filter(act => act.id !== id));
        setIsEditActivityOpen(false);
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error(error.message);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Push notifications are not supported by your browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permission for notifications was denied');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      // Get the VAPID key from your .env file
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!publicVapidKey) {
        toast.error('VAPID Public Key is missing in .env');
        return;
      }

      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // Send to backend
      postRequest('/notifications-subscribe', {
        user_id: userDetails.user_id,
        subscription: subscription
      }, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success' || response.data?.status === 1) {
          toast.success('Push notifications enabled!');
          setIsPushEnabled(true);
        } else {
          toast.error(message || 'Failed to save subscription.');
        }
      });

    } catch (error) {
      console.error(error);
      toast.error('Error enabling push notifications');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f1f5f9] via-[#f8fafc] to-[#eef2f6] font-sans pb-28 relative overflow-x-hidden">

      {/* Container holding the mobile width cleanly if opened on desktop */}
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Activities</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/counsellor/personal-analytics')}
              className="flex items-center justify-center w-12 h-12 bg-white text-[#1a73e8] rounded-full active:scale-95 transition-all shadow-sm border border-gray-50"
              title="My Personal Analytics"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" /></svg>
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0f172a] hover:bg-gray-50 active:scale-95 transition-all"
            >
              {/* Bell Icon */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {/* Notification Badge */}
              {dummyNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
                  {dummyNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Date Selector (Native Smooth Swiping) */}
        <div
          ref={dateContainerRef}
          className="flex gap-4 px-6 overflow-x-auto pb-4 hide-scrollbar scroll-smooth"
        >
          {dates.map((item) => {
            const yyyy = item.fullDate.getFullYear();
            const mm = String(item.fullDate.getMonth() + 1).padStart(2, '0');
            const dd = String(item.fullDate.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const color = dateColors[dateStr];

            let fillClass = '';
            let bgClass = 'bg-white';
            let borderClass = 'border border-slate-200/80';
            let textColor = 'text-[#1e293b]';
            let monthColor = 'text-[#94a3b8]';

            if (color === '#10B981') {
              fillClass = 'bg-[#d1fae5] h-full';
              bgClass = 'bg-[#f4fdf8]';
              borderClass = 'border border-[#a7f3d0]';
              textColor = 'text-[#065f46]';
              monthColor = 'text-[#047857]';
            } else if (color === '#F59E0B') {
              fillClass = 'bg-[#fef3c7] h-1/2';
              bgClass = 'bg-[#fffdf5]';
              borderClass = 'border border-[#fde68a]';
              textColor = 'text-[#1e293b]';
              monthColor = 'text-[#b45309]';
            } else if (color === '#EF4444') {
              fillClass = 'h-0';
              bgClass = 'bg-white';
              borderClass = 'border border-dashed border-rose-300';
              textColor = 'text-[#475569]';
              monthColor = 'text-[#f43f5e]';
            } else {
              fillClass = 'h-0';
              bgClass = 'bg-white';
              borderClass = 'border border-slate-200/80';
              textColor = 'text-[#0f172a]';
              monthColor = 'text-[#94a3b8]';
            }

            return (
              <button
                key={item.id}
                onClick={() => handleDateSelect(item.id)}
                className={`relative flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[90px] rounded-[20px] transition-all shadow-sm select-none overflow-hidden ${
                  item.active
                    ? 'bg-[#1a73e8] text-white shadow-[#1a73e8]/30 shadow-md border border-[#1a73e8]'
                    : `${bgClass} ${borderClass}`
                }`}
              >
                {!item.active && (
                  <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-out z-0 ${fillClass}`} 
                  />
                )}
                <span className={`z-10 text-[24px] font-extrabold leading-none mb-1 ${
                  item.active ? 'text-white' : textColor
                }`}>{item.date}</span>
                <span className={`z-10 text-[12px] font-bold uppercase tracking-wider ${
                  item.active ? 'text-white/90' : monthColor
                }`}>{item.month}</span>
              </button>
            );
          })}
        </div>

        {/* Push Notification Enable Banner */}
        {!isPushEnabled && (
          <div className="px-6 mt-2 mb-4">
            <div className="bg-white border border-[#1a73e8]/20 shadow-sm rounded-[16px] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1a73e8]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div>
                  <p className="text-[#0f172a] font-bold text-sm">Enable Reminders</p>
                  <p className="text-gray-500 text-[11px]">Get  push notifications</p>
                </div>
              </div>
              <button
                onClick={handleEnablePushNotifications}
                className="px-4 py-2 bg-[#1a73e8] text-white text-xs font-bold rounded-full hover:bg-[#155fc3] transition-colors shadow-md shadow-[#1a73e8]/20"
              >
                Allow
              </button>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="px-6 mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-10 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading activities...</p>
            </div>
          ) : activities.length > 0 ? (
            activities.map((act) => {
              const activeDateObj = dates.find(d => d.active)?.fullDate || new Date();
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
              <p className="text-gray-500 font-medium text-lg">No activities found</p>
              <p className="text-gray-400 text-sm">Tap the + button to add one</p>
            </div>
          )}
        </div>

      </div>

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <NewActivityModal
        isOpen={isNewActivityOpen}
        onClose={() => setIsNewActivityOpen(false)}
        onSave={async (activityData) => {
          try {
            const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');

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
              const { message, type } = processResponse(response?.data);
              if (type === 'success') {
                toast.success(message);
                setTimeout(() => {
                  fetchActivities();
                  setIsNewActivityOpen(false);
                  navigate('/counsellor/dashboard');
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

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsNewActivityOpen(true)}
        className="fixed bottom-[100px] right-[calc(50%-180px)] lg:right-10 w-[64px] h-[64px] bg-[#1a73e8] hover:bg-[#155fc3] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#1a73e8]/30 transition-transform active:scale-90 z-40 lg:ml-auto"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      {/* Reusable Bottom Navigation */}
      <CounsellorBottomNavigation />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastState.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border w-max max-w-[90%] ${toastState.type === 'error'
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
    </div>
  );
};

export default CounsellorDashboard;
