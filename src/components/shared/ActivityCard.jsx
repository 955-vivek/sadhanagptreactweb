import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { postRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';

const ActivityCard = ({ activity, onProgressUpdate, onEdit, selectedDate }) => {

  const { userDetails } = useOutletContext();
  const [isCompleted, setIsCompleted] = useState(activity.status === 'Completed');

  const minutesToTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const minutesTo24HourTime = (totalMinutes) => {
    if (isNaN(totalMinutes) || totalMinutes == null) return '';
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const timeToMinutesOffset = (timeStr) => {
    if (timeStr == null || timeStr === '') return 480;
    if (typeof timeStr === 'number' || (typeof timeStr === 'string' && !isNaN(timeStr) && timeStr.trim() !== '')) {
      return Number(timeStr);
    }
    if (typeof timeStr === 'string' && !timeStr.includes(':')) return 480;
    try {
      const parts = String(timeStr).trim().split(' ');
      const [hPart, mPart] = parts[0].split(':').map(Number);
      const period = parts[1] || (hPart >= 12 ? 'PM' : 'AM');
      let hours = hPart;
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (mPart || 0);
    } catch (e) {
      return 480;
    }
  };

  const extractMax = (progStr, type) => {
    if (type === 'TIME') return 1440; // 24 hours in minutes
    if (!progStr) return 1;
    const parts = progStr.split('/');
    if (parts.length === 2) return parseFloat(parts[1]) || 1;
    return 1;
  };

  const extractCurrent = (progStr, type) => {
    if (type === 'TIME') {
      const parts = progStr.split('/');
      return timeToMinutesOffset(parts[0] || '');
    }
    if (!progStr) return -1;
    const parts = progStr.split('/');
    if (parts.length > 0) return parseFloat(parts[0]) || -1;
    return -1;
  };

  const extractSuffix = (progStr) => {
    if (!progStr) return '';
    const parts = progStr.split('/');
    if (parts.length === 2) {
      const suffixMatch = parts[1].trim().match(/[a-zA-Z]+$/);
      return suffixMatch ? suffixMatch[0] : '';
    }
    return '';
  };

  const isBoolean = activity.type === 'YES/NO' || activity.type === 'boolean';
  const isTimeType = activity.type === 'TIME' || activity.type === 'time';
  const maxVal = extractMax(activity.progress, activity.type);
  const initialCurrent = isCompleted && !isTimeType ? maxVal : extractCurrent(activity.progress, activity.type);
  const suffix = extractSuffix(activity.progress);

  const formatTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return timeStr || '';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr.toUpperCase();
    return timeStr; // Fallback
  };

  const [currentVal, setCurrentVal] = useState(initialCurrent);

  // --- API Integrations & State for POST /add-daily-report --- //
  const [lastSavedVal, setLastSavedVal] = useState(initialCurrent);

  // Sync internal state if parent prop data changes asynchronously (e.g. from /report-as-per-date)
  useEffect(() => {
    const isThisTimeType = activity.type === 'TIME' || activity.type === 'time';
    const newMax = extractMax(activity.progress, activity.type);
    const newCurrent = (activity.status === 'Completed' && !isThisTimeType) ? newMax : extractCurrent(activity.progress, activity.type);
    setCurrentVal(newCurrent);
    setIsCompleted(activity.status === 'Completed');
    setLastSavedVal(newCurrent);
  }, [activity.progress, activity.status]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentValRef = useRef(currentVal);
  useEffect(() => { currentValRef.current = currentVal; }, [currentVal]);

  const submitDailyReport = async (finalVal) => {
    // Deduplication check
    if (finalVal === lastSavedVal) return;

    try {
      setIsSubmitting(true);
      setToastMessage(null);

      // Use selected date passed from dashboard, fallback to today
      const formattedDate = selectedDate || new Date().toISOString().split('T')[0];

      let unitToSender = activity.unit || 'count';
      if (!activity.unit) {
        if (activity.type === 'COUNT') unitToSender = 'rounds';
        if (activity.type === 'DURATION') unitToSender = 'min';
        if (activity.type === 'TIME') unitToSender = 'time';
      }

      const payload = {
        activity_id: activity.id,
        count: finalVal,
        activity_date: formattedDate,
        unit: unitToSender,
        user_id: userDetails.user_id
      };


      const response = await new Promise((resolve) => {
        postRequest('/add-daily-report', payload, resolve);
      });

      const { message, type } = processResponse(response?.data);

      if (type === 'success') {
        setLastSavedVal(finalVal);
        setToastMessage({ type: 'success', text: 'Saved!' });

        if (onProgressUpdate) {
          const isComplete = isTimeType ? true : finalVal >= maxVal;
          let newProgressStr = isTimeType ? `${minutesToTime(finalVal)} / ${activity.target || '10:00 AM'}` : `${finalVal}${suffix || ''} / ${maxVal}${suffix || ''}`;

          if (activity?.type === 'YES/NO' || activity?.type === 'boolean') {
            newProgressStr = '';
          }

          onProgressUpdate(activity?.id, {
            progress: newProgressStr,
            status: isComplete ? 'Completed' : 'Pending',
            target: maxVal
          });
        }
      } else {
        throw new Error(message || 'API Default Error');
      }

    } catch (err) {
      console.error("Failed to save report:", err);
      setToastMessage({ type: 'error', text: 'Error!' });

      // Revert UI to the last successfully saved value
      setCurrentVal(lastSavedVal);
      const revertedCompleted = lastSavedVal >= maxVal;
      setIsCompleted(revertedCompleted);

      if (onProgressUpdate) {
        onProgressUpdate(activity.id, {
          progress: `${lastSavedVal}${suffix} / ${maxVal}${suffix}`,
          status: revertedCompleted ? 'Completed' : 'Pending'
        });
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMessage(null), 2500); // Clear toast after a while
    }
  };

  // --- Animation and Drag logic for Slider (COUNT/TIME/DURATION) --- //
  const sliderRef = useRef(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    if (sliderRef.current) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }
  }, []);

  const handlePointerDown = (e) => {
    if (isBoolean) return;
    setIsDragging(true);
    updateScrubber(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (isBoolean || !isDragging) return;
    updateScrubber(e.clientX);
  };

  const handlePointerUpOrLeave = () => {
    if (isBoolean || !isDragging) return;
    setIsDragging(false);

    // For time activities, we calculate based on step
    const finalVal = isTimeType ? (Math.round(currentValRef.current / 5) * 5) : currentValRef.current;
    submitDailyReport(finalVal);
  };

  const updateScrubber = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;

    let newVal;
    const isHours = activity.unit && (activity.unit.toLowerCase() === 'hours' || activity.unit.toLowerCase() === 'hrs' || activity.unit.toLowerCase() === 'hour');
    if ((activity.type === 'DURATION' || activity.type === 'duration') && isHours) {
      // Round to nearest 0.5 for duration activities with hours unit
      newVal = Math.round((percentage * maxVal) * 2) / 2;
    } else {
      // Round to nearest integer for counts (like Chanting rounds)
      newVal = Math.round(percentage * maxVal);
    }

    currentValRef.current = newVal; // Sync immediately to prevent pointerUp race condition
    setCurrentVal(newVal);

    if (newVal >= maxVal && !isCompleted) {
      setIsCompleted(true);
    } else if (newVal < maxVal && isCompleted) {
      setIsCompleted(false);
    }
  };

  // --- Logic for Full Swipe (YES/NO) & Edit options --- //
  const cardControls = useAnimation();
  const cardX = useMotionValue(0);
  const background = useTransform(cardX, [-80, 0, 80], ['#fee2e2', '#ffffff', '#dcfce7']);

  const handleCardDragEnd = (event, info) => {
    const swipeRightThreshold = 100;
    const swipeLeftThreshold = -80;

    if (info.offset.x > swipeRightThreshold) {
      if (isBoolean && !isCompleted) {
        setIsCompleted(true);
        if (onProgressUpdate) onProgressUpdate(activity.id, { status: 'Completed' });
        submitDailyReport(1);
      }
    } else if (info.offset.x < swipeLeftThreshold) {
      if (isBoolean && isCompleted) {
        setIsCompleted(false);
        if (onProgressUpdate) onProgressUpdate(activity.id, { status: 'Pending' });
        submitDailyReport(0);
      } else {
        console.log("Opened edit/delete for", activity.title);
      }
    }

    cardControls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
  };

  let displayPercentage = isCompleted && !isTimeType ? 100 : (maxVal > 0 ? (Math.max(currentVal, 0) / maxVal) * 100 : 0);
  if (isBoolean && !isCompleted) displayPercentage = 0;
  if (isBoolean && isCompleted) displayPercentage = 100;
  if (isTimeType) displayPercentage = (Math.max(currentVal, 0) / 1440) * 100;

  return (
    <div className="relative w-full max-w-md mx-auto mb-4 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_12px_28px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_6px_24px_rgba(0,0,0,0.35)] border border-blue-200 dark:border-[#475569] bg-white dark:bg-[#1E293B] hover:-translate-y-[1px] transition-all duration-300 group">
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-6 z-0"
        style={{ background }}
      >
        <div className="font-bold text-green-700 flex items-center gap-2">
          {isBoolean && !isCompleted && <><svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Complete</>}
        </div>
        <div className="font-bold text-red-700 flex items-center gap-2">
          {isBoolean && isCompleted ? 'Undo' : 'Edit/Options'}
        </div>
      </motion.div>

      <motion.div
        drag={isBoolean ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleCardDragEnd}
        animate={cardControls}
        style={{ x: isBoolean ? cardX : 0 }}
        className="relative z-10 w-full h-full bg-white dark:bg-[#1E293B] rounded-2xl p-5 select-none"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{ backgroundColor: activity?.iconBgColor || '#f1f5f9', color: activity?.iconColor || '#64748b' }}>
              {activity?.iconSvg}
            </div>
            <div className="flex-1">
              <h3 className="text-[17px] font-bold text-[#0f172a] dark:text-[#F8FAFC] leading-tight mb-0.5">{activity?.title || 'Activity'}</h3>
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-bold text-[#94a3b8] dark:text-[#CBD5E1] uppercase tracking-wider">{activity?.type || 'Other'}</p>
                {String(activity?.visibility) === '1' ? (
                  <span className="bg-[#fffbeb] dark:bg-yellow-900/30 text-[#f59e0b] dark:text-yellow-400 border border-[#f59e0b]/20 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg></span>
                ) : (
                  <span className="bg-[#eff6ff] dark:bg-blue-900/30 text-[#1a73e8] dark:text-blue-400 border border-[#1a73e8]/20 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                )}
              </div>
            </div>
          </div>

          <div className="relative flex items-center h-[26px]">
            {isSubmitting ? (
              <div className="w-[18px] h-[18px] border-[2px] border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
            ) : toastMessage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${toastMessage.type === 'success' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}
              >
                {toastMessage.text}
              </motion.div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(activity);
                }}
                className="text-[#cbd5e1] hover:text-[#94a3b8] outline-none relative z-20 transition-colors flex items-center justify-center p-1"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {isTimeType ? (
          <div className="w-full mb-3 mt-1 rounded-xl overflow-hidden shadow-sm border border-[#1a73e8]/20 bg-[#f8fafc] dark:bg-[#0F172A] ring-2 ring-transparent focus-within:ring-[#1a73e8] transition-all">
            <input 
              type="time" 
              value={minutesTo24HourTime(currentVal)}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const [h, m] = val.split(':').map(Number);
                const totalMins = h * 60 + m;
                setCurrentVal(totalMins);
                currentValRef.current = totalMins;
                setIsCompleted(true);
                submitDailyReport(totalMins);
              }}
              className="w-full bg-transparent text-[22px] font-black tracking-widest text-center text-[#1a73e8] dark:text-blue-400 px-4 py-3 outline-none"
              style={{ colorScheme: 'dark light' }}
            />
          </div>
        ) : isBoolean ? (
          <div className="bg-[#f1f5f9] dark:bg-[#334155] p-1 rounded-[20px] flex items-center mb-4 mt-1 relative overflow-hidden h-[54px]">
            <motion.div
              initial={false}
              animate={{ 
                x: currentVal === 1 ? '0%' : '100%',
                backgroundColor: currentVal === 1 ? '#dcfce7' : '#fee2e2'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] rounded-[16px] shadow-sm z-0"
            />
            <button
              onClick={() => {
                if (currentVal === 1) return;
                setCurrentVal(1);
                setIsCompleted(true);
                submitDailyReport(1);
              }}
              className={`flex-1 h-full relative z-10 font-black text-[13px] tracking-widest transition-colors flex items-center justify-center gap-2 ${currentVal === 1 ? 'text-[#166534]' : 'text-[#94a3b8] dark:text-[#CBD5E1]'}`}
            >
              {currentVal === 1 && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              YES
            </button>
            <button
              onClick={() => {
                if (currentVal === 0) return;
                setCurrentVal(0);
                setIsCompleted(false);
                submitDailyReport(0);
              }}
              className={`flex-1 h-full relative z-10 font-black text-[13px] tracking-widest transition-colors flex items-center justify-center gap-2 ${currentVal === 0 ? 'text-[#991b1b]' : 'text-[#94a3b8] dark:text-[#CBD5E1]'}`}
            >
              {currentVal === 0 && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
              NO
            </button>
          </div>
        ) : (
          <div
            className="w-full py-4 -my-4 mb-3 relative cursor-pointer touch-none"
            ref={sliderRef}
            onPointerDown={(e) => { 
                e.target.setPointerCapture(e.pointerId); 
                handlePointerDown(e); 
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => { 
                if (e.target.hasPointerCapture(e.pointerId)) {
                    e.target.releasePointerCapture(e.pointerId); 
                }
                handlePointerUpOrLeave(e); 
            }}
            onPointerCancel={handlePointerUpOrLeave}
          >
            <div className="w-full bg-[#f1f5f9] dark:bg-[#334155] h-[8px] rounded-full relative pointer-events-none">
              <motion.div
                initial={false}
                animate={{ width: `${Math.max(displayPercentage, 0.5)}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ backgroundColor: isCompleted ? '#20c997' : (activity?.barColor || '#1a73e8') }}
              />
              {!isBoolean && (
                <motion.div
                  initial={false}
                  animate={{ left: `${displayPercentage}%` }}
                  transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                  className="absolute top-1/2 -ml-3.5 -mt-3.5 w-7 h-7 bg-white dark:bg-[#1E293B] border-[3px] rounded-full shadow-lg z-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
                  style={{ borderColor: isCompleted ? '#20c997' : (activity?.barColor || '#1a73e8') }}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          {isCompleted && !isDragging ? (
            <div className="flex items-center gap-1.5 text-[#20c997] font-bold text-[14px]">
              <svg className="w-[16px] h-[16px]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {isTimeType ? `Logged: ${minutesToTime(currentVal)}` : 'Completed'}
            </div>
          ) : (
            <div className="text-[14px] font-bold text-[#0f172a] dark:text-[#F8FAFC]">
              {isTimeType ? `Pending Time Log` : (!isBoolean ? `${currentVal}${suffix} / ${maxVal}${suffix}` : (activity.progress || ''))}
            </div>
          )}

          {!isCompleted && activity.hint && !isTimeType && (
            <div className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-wider flex items-center gap-1 select-none">
              {!isBoolean ? 'DRAG SLIDER TO UPDATE' : (activity.hint || 'TAP TO SELECT')}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ActivityCard;
