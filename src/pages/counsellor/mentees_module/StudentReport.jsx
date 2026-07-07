import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import AiAnalysisModals from '../../../components/AiAnalysis/AiAnalysisModals';
import { getRequest, postRequest } from '../../../services/api';

// --- Premium Chart Helpers (same as PersonalSadhanaAnalytics) ---
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  if (typeof timeStr !== 'string') return 0;
  const cleanTime = timeStr.trim().toUpperCase();
  if (!cleanTime.includes(':')) return Number(cleanTime) || 0;
  try {
    const period = cleanTime.includes('PM') ? 'PM' : (cleanTime.includes('AM') ? 'AM' : null);
    const timePart = cleanTime.replace('AM', '').replace('PM', '').trim();
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  } catch (e) { return 0; }
};

const minutesToTime = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes === null) return "00:00 AM";
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12; hours = hours ? hours : 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const DailyTooltip = ({ dateStr, value, label, position }) => {
  let displayDate = "";
  if (dateStr) {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!isNaN(d.getTime())) displayDate = `${months[d.getMonth()]} ${d.getDate()}`;
  }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute z-50 pointer-events-none" style={{ left: position.x, top: -65, transform: 'translateX(-50%)' }}>
      <div className="bg-[#0f172a]/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-2xl relative border border-white/10 flex flex-col items-center">
        <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">{displayDate}</div>
        <div className="text-[15px] font-black whitespace-nowrap leading-tight">{value} <span className="text-[11px] font-bold text-gray-400">{label}</span></div>
        <div className="absolute -bottom-1 w-3 h-3 bg-[#0f172a] rotate-45 border-r border-b border-white/5"></div>
      </div>
    </motion.div>
  );
};

const MiniChart = ({ data, dates, color, label }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgWidth = 320, svgHeight = 160;
  const margin = { top: 15, right: 15, bottom: 30, left: 45 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;
  const isTimeType = label.toLowerCase() === 'time' || label.toLowerCase().includes('avg. time');
  const values = data.map(v => { if (typeof v === 'string' && v.includes(':')) return timeToMinutes(v); return Number(v || 0); });
  const max = Math.max(...values, 1), min = Math.min(...values, 0), range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);
  const points = values.map((val, i) => ({ x: margin.left + i * step, y: margin.top + height - ((val - min) / range) * height }));
  const pathData = points.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = points[i - 1]; const cpX = prev.x + (p.x - prev.x) / 2; return `C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`; }).join(' ');
  const areaData = `${pathData} L ${points[points.length - 1].x} ${margin.top + height} L ${points[0].x} ${margin.top + height} Z`;
  const handleInteraction = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const xInsideChart = (rawX * (svgWidth / rect.width)) - margin.left;
    const percent = Math.max(0, Math.min(1, xInsideChart / width));
    const index = Math.round(percent * (data.length - 1));
    if (index >= 0 && index < data.length) { setHoverIndex(index); setTooltipPos({ x: points[index].x, y: 0 }); }
  };
  const gradId = `grad-mentee-${label.replace(/[^a-zA-Z0-9]/g, '')}-${data.length}`;
  const yTicks = [max, min + range * 0.66, min + range * 0.33, min];
  const formatY = (v) => isTimeType ? minutesToTime(Math.round(v)) : (Number(v) % 1 === 0 ? v : Number(v).toFixed(1));
  const skipFactor = Math.ceil(data.length / 8);
  return (
    <div className="relative w-full h-40 mt-8 touch-none" onPointerMove={handleInteraction} onPointerLeave={() => setHoverIndex(null)} onTouchStart={handleInteraction} onTouchMove={handleInteraction} onTouchEnd={() => setTimeout(() => setHoverIndex(null), 1000)}>
      <AnimatePresence>
        {hoverIndex !== null && <DailyTooltip dateStr={dates?.[hoverIndex] || ''} value={isTimeType ? minutesToTime(values[hoverIndex]) : data[hoverIndex]} label={isTimeType ? '' : label} position={tooltipPos} />}
      </AnimatePresence>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible pointer-events-none">
        <defs><linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <g className="opacity-60">
          {yTicks.map((yVal, idx) => {
            const yPos = margin.top + height - ((yVal - min) / range) * height; const fVal = formatY(yVal); const split = String(fVal).split(' '); return (
              <g key={`y-${idx}`}>
                <line x1={margin.left} y1={yPos} x2={margin.left + width} y2={yPos} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                <text x={margin.left - 8} y={yPos} fontSize="10" fill="#64748b" textAnchor="end" fontWeight="bold">
                  {split.length > 1 ? <><tspan x={margin.left - 8} dy="-2">{split[0]}</tspan><tspan x={margin.left - 8} dy="10" fontSize="8">{split[1]}</tspan></> : <tspan x={margin.left - 8} dy="3">{fVal}</tspan>}
                </text>
              </g>
            );
          })}
          {points.map((p, idx) => {
            if (idx % skipFactor !== 0 && idx !== points.length - 1) return null; const d = dates?.[idx] ? new Date(dates[idx]) : null; const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return (
              <g key={`x-${idx}`}>
                <line x1={p.x} y1={margin.top} x2={p.x} y2={margin.top + height} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                {d && !isNaN(d.getTime()) && <text x={p.x} y={margin.top + height + 14} fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="bold"><tspan x={p.x} dy="0">{d.getDate()}</tspan><tspan x={p.x} dy="10" fontSize="8">{months[d.getMonth()]}</tspan></text>}
              </g>
            );
          })}
        </g>
        <motion.path d={areaData} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        <motion.path d={pathData} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="drop-shadow-md" />
        <AnimatePresence>
          {points.map((p, i) => ((hoverIndex === i || (i === points.length - 1 && hoverIndex === null)) && (
            <motion.g key={`pt-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <line x1={p.x} y1={margin.top} x2={p.x} y2={margin.top + height} stroke={color} strokeWidth="1.5" strokeOpacity={hoverIndex === i ? 0.4 : 0.1} />
              <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" className="drop-shadow-lg" />
            </motion.g>
          )))}
        </AnimatePresence>
      </svg>
    </div>
  );
};
// --- End Premium Chart ---

const DUMMY_CHART = ({ label }) => (
  <div className="w-full h-40 mt-4 flex items-center justify-center text-gray-300 text-[12px] border border-dashed border-gray-300 rounded-xl">No data for {label}</div>
);


const formatValue = (val) => {
  if (val === null || val === undefined) return '0';
  const strVal = String(val);
  if (strVal.includes(':')) {
    const [h, m, s] = strVal.split(':').map(n => parseInt(n, 10) || 0);
    return `${(h * 60) + m + (s > 30 ? 1 : 0)}`;
  }
  return parseFloat(val).toFixed(1).replace(/\.0$/, '');
};

const formatDateSnippet = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

const StudentReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { userDetails } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('7 Days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationHeading, setNotificationHeading] = useState('');
  const [notificationDesc, setNotificationDesc] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };


  const fetchStudentDetails = useCallback(() => {
    setIsLoading(true);
    let filter = activeTab === 'Month' ? "30days" : activeTab === 'Custom' ? "custom" : "7days";
    getRequest('/student-details', { user_id: userDetails.user_id, student_id: id, filter, start_date: customStartDate, end_date: customEndDate }, (response) => {
      if (response.data?.status === 1) setReportData(response.data.data);
      else showToast(response.data?.message || "Failed to load report");
      setIsLoading(false);
    });
  }, [userDetails.user_id, id, activeTab, customStartDate, customEndDate]);

  useEffect(() => { fetchStudentDetails(); }, [fetchStudentDetails]);

  const handleSendNotification = () => {
    if (!notificationDesc.trim()) return showToast('Please enter a message...');
    setIsSending(true);
    postRequest('/cusotm-notification', { user_id: userDetails.user_id, student_id: id, heading: '', description: notificationDesc }, (res) => {
      setIsSending(false);
      // Handle both { status: 1 } and { success: true } API response wrappers 
      if (res.data?.status === 1 || res.data?.success === true) {
        setIsNotificationModalOpen(false);
        showToast('Notification Sent!');
        setNotificationDesc('');
      } else {
        showToast(res.data?.message || "Failed to send notification");
      }
    });
  };

  /* AI Analysis — commented out for individual report view
  const handleAiAnalysis = () => {
    const dataForAi = [{ student_id: id, name: reportData?.student?.name || 'Student', date: new Date().toISOString().split('T')[0], activities: reportData?.activities_analytics || [] }];
    navigate('/counsellor/ai-chat', { state: { studentsData: dataForAi } });
  };
  */

  const studentInfo = reportData?.student || location.state?.student || { name: 'Loading...' };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] pb-28 transition-colors duration-300">
      <AnimatePresence>{toastMessage && (<motion.div initial={{ y: -20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="fixed top-24 left-0 right-0 z-50 flex justify-center"><div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm">{toastMessage}</div></motion.div>)}</AnimatePresence>
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50 dark:border-[#1E293B]">
        <button onClick={() => navigate(-1)} className="text-[#0f172a] dark:text-[#F8FAFC]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h1 className="font-black text-lg text-[#0f172a] dark:text-[#F8FAFC]">Mentee Report</h1>
        <div className="w-6" />
      </div>
      <div className="px-6 py-8 max-w-md mx-auto">
        <div className="flex flex-col items-center mb-8">
          <img src={studentInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentInfo.name)}&background=random&color=fff&bold=true`} className="w-24 h-24 rounded-full border-4 border-blue-50 mb-4 shadow-md" />
          <h2 className="text-2xl font-black text-center text-[#0f172a] dark:text-[#F8FAFC]">{studentInfo.name}</h2>
          <p className="text-blue-500 font-bold text-sm mt-1 mb-5">{studentInfo.center_name || 'No Group'} • {studentInfo.label_name || 'No Label'}</p>

          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="bg-gray-50 dark:bg-[#1E293B] rounded-2xl p-3 flex flex-col items-center text-center transition-colors duration-300">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#64748b] mb-1">Label</span>
              <span className="text-[13px] font-black text-gray-800 dark:text-[#F8FAFC] leading-tight">{studentInfo.label_name || '—'}</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#1E293B] rounded-2xl p-3 flex flex-col items-center text-center transition-colors duration-300">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#64748b] mb-1">Birthday</span>
              <span className="text-[13px] font-black text-gray-800 dark:text-[#F8FAFC] leading-tight">{formatDateSnippet(studentInfo.birthday)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-[#1E293B] rounded-2xl p-3 flex flex-col items-center text-center transition-colors duration-300">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#64748b] mb-1">Joined</span>
              <span className="text-[13px] font-black text-gray-800 dark:text-[#F8FAFC] leading-tight">{formatDateSnippet(studentInfo.created_at)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-gray-400 font-bold text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
            <span>{studentInfo.email || 'N/A'}</span>
          </div>
        </div>
        <div className="flex p-1 bg-gray-50 dark:bg-[#1E293B] rounded-full mb-8 transition-colors duration-300">
          {['7 Days', 'Month', 'Custom'].map(t => <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${activeTab === t ? 'bg-white dark:bg-[#0F172A] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-[#94A3B8]'}`}>{t}</button>)}
        </div>
        {activeTab === 'Custom' && (
          <div className="flex gap-4 mb-8">
            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="flex-1 p-3 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] [color-scheme:light] dark:[color-scheme:dark] rounded-xl outline-none" />
            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="flex-1 p-3 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] [color-scheme:light] dark:[color-scheme:dark] rounded-xl outline-none" />
          </div>
        )}
        {isLoading ? <div className="text-center py-20 font-bold text-gray-400">Loading analysis...</div> : (
          <div className="space-y-10">
            {reportData?.activities_analytics?.map(act => (
              <div key={act.activity_id}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-[#0f172a] dark:text-[#F8FAFC]">{act.name}</span>
                  <span className="text-xs font-bold text-gray-400 dark:text-[#94A3B8]">{act.label}: {formatValue(act.value)}</span>
                </div>
                {act.daily_data && act.daily_data.length > 0 ? (
                  <MiniChart
                    data={act.daily_data.map(d => d.count)}
                    dates={act.daily_data.map(d => d.activity_date)}
                    color={act.color || '#1a73e8'}
                    label={act.label}
                  />
                ) : (
                  <DUMMY_CHART label={act.label} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fixed bottom-[80px] left-0 right-0 px-6 py-4 max-w-md mx-auto bg-white/80 dark:bg-[#0F172A]/80 border-t border-transparent dark:border-[#1E293B] backdrop-blur-md flex gap-1.5 transition-colors duration-300">
        <button onClick={() => navigate(`/counsellor/mentee/${id}/conversation`, { state: { student: studentInfo } })} className="flex-1 py-3.5 bg-indigo-600 rounded-2xl font-black text-[13px] text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          Notes
        </button>
        <button onClick={() => setIsAiAnalysisModalOpen(true)} className="touch-auto flex-1 bg-white text-[#1a73e8] rounded-2xl py-3.5 font-black text-[13px] flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>
          Analysis
        </button>
        <button onClick={() => setIsNotificationModalOpen(true)} className="flex-1 py-3.5 bg-blue-600 rounded-2xl font-black text-[13px] text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6.5C21 8.98 18.76 11 16 11s-5-2.02-5-4.5S13.24 2 16 2s5 2.02 5 4.5zM16 3c-2.21 0-4 1.12-4 2.5S13.79 8 16 8s4-1.12 4-2.5S18.21 3 16 3zm-1 13H4a2 2 0 0 1-2-2v-1c0-2.66 5.33-4 8-4 .92 0 2.06.17 3.18.47A7.5 7.5 0 0 0 13 11.1C12.12 10.96 11.08 10.9 10 10.9 7.33 10.9 2 12.13 2 14v1h13v-1c0-.34.04-.67.1-1l.9.1zm-5-5C7.24 11 5 8.98 5 6.5S7.24 2 10 2c1.26 0 2.41.44 3.27 1.15A6.58 6.58 0 0 0 11 6.5c0 1.56.62 2.98 1.63 4.03A5.33 5.33 0 0 1 10 11z" /></svg>
          Notify
        </button>
      </div>
      <AnimatePresence>
        {isNotificationModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsNotificationModalOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white dark:bg-[#1E293B] w-full max-w-md p-8 rounded-t-3xl shadow-2xl relative transition-colors duration-300" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsNotificationModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-[#334155] text-gray-400 dark:text-[#94A3B8] rounded-full hover:bg-gray-100 dark:hover:bg-[#475569] hover:text-gray-600 dark:hover:text-[#F8FAFC] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h2 className="text-xl font-black mb-6 pr-10 text-[#0f172a] dark:text-[#F8FAFC]">Send Notification</h2>
              <textarea value={notificationDesc} onChange={e => setNotificationDesc(e.target.value)} placeholder="Message..." rows={4} className="w-full p-4 bg-gray-50 dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] rounded-xl mb-6 outline-none border border-transparent focus:border-blue-100 dark:focus:border-blue-500/50 transition-colors duration-300" />
              <button onClick={handleSendNotification} disabled={isSending} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-600/20">{isSending ? 'Sending...' : 'Send Now'}</button>
              <button onClick={() => setIsNotificationModalOpen(false)} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] font-bold transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        <AiAnalysisModals
          isOpen={isAiAnalysisModalOpen}
          onClose={() => setIsAiAnalysisModalOpen(false)}
          students={studentInfo ? [studentInfo] : []}
          userDetails={userDetails}
        />
      </AnimatePresence>
      <CounsellorBottomNavigation />
    </div>
  );
};

export default StudentReport;
