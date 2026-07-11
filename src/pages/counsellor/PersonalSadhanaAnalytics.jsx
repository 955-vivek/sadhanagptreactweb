import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import { getRequest } from '../../services/api';
import ThemeToggle from '../../components/shared/ThemeToggle';
import AIAnalysisModal from '../../components/AiAnalysis/AiAnalysisModals';

// Helper to convert time string (05:00 AM) to numeric minutes for graphing
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
  } catch (e) {
    return 0;
  }
};

const minutesToTime = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes === null) return "00:00 AM";
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

// Helper for smooth Bezier curves
const getCurvedPathData = (data, width, height, padding) => {
  if (!data || data.length === 0) return "";
  const xStep = (width - padding * 2) / (data.length - 1);
  const max = Math.max(...data, 1);
  const yFactor = (height - padding * 2) / max;

  const points = data.map((val, i) => ({
    x: padding + i * xStep,
    y: height - padding - val * yFactor
  }));

  if (points.length < 2) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const mx = (curr.x + next.x) / 2;
    d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
};

const DailyTooltip = ({ dateStr, value, label, position }) => {
  let displayDate = "";
  if (dateStr) {
     const d = new Date(dateStr);
     const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
     if (!isNaN(d.getTime())) {
         displayDate = `${months[d.getMonth()]} ${d.getDate()}`;
     }
  }

  return (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 10 }}
    className="absolute z-50 pointer-events-none"
    style={{ 
      left: position.x, 
      top: -65, // Position high enough above finger
      transform: 'translateX(-50%)' 
    }}
  >
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
  const svgWidth = 320;
  const svgHeight = 160;
  const margin = { top: 15, right: 15, bottom: 30, left: 45 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;
  
  const isTimeType = label.toLowerCase() === 'time' || label.toLowerCase().includes('target') || label.toLowerCase().includes('avg. time');
  const values = data.map(v => {
    if (typeof v === 'string' && v.includes(':')) return timeToMinutes(v);
    return Number(v || 0);
  });
  
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);
  
  const points = values.map((val, i) => ({
    x: margin.left + i * step,
    y: margin.top + height - ((val - min) / range) * height
  }));

  const pathData = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    return `C ${cpX1} ${prev.y}, ${cpX2} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');

  const areaData = `${pathData} L ${points[points.length - 1].x} ${margin.top + height} L ${points[0].x} ${margin.top + height} Z`;

  const handleInteraction = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const scaleX = svgWidth / rect.width;
    const xInsideChart = (rawX * scaleX) - margin.left;
    
    const percent = Math.max(0, Math.min(1, xInsideChart / width));
    const index = Math.round(percent * (data.length - 1));
    
    if (index >= 0 && index < data.length) {
      setHoverIndex(index);
      setTooltipPos({ x: points[index].x, y: 0 });
    }
  };

  const gradId = `grad-${label.replace(/[^a-zA-Z0-9]/g, '')}-${data.length}`;

  const yTicks = [max, min + range * 0.66, min + range * 0.33, min];
  const formatYValue = (v) => {
    if (isTimeType) return minutesToTime(Math.round(v));
    return Number(v) % 1 === 0 ? v : Number(v).toFixed(1);
  };
  
  const skipFactor = Math.ceil(data.length / 8); 

  return (
    <div className="relative w-full h-40 mt-8 touch-none group" 
         onPointerMove={handleInteraction} 
         onPointerLeave={() => setHoverIndex(null)}
         onTouchStart={handleInteraction}
         onTouchMove={handleInteraction}
         onTouchEnd={() => setTimeout(() => setHoverIndex(null), 1000)}
    >
      <AnimatePresence>
        {hoverIndex !== null && (
          <DailyTooltip 
            dateStr={dates?.[hoverIndex] || ''} 
            value={isTimeType ? minutesToTime(values[hoverIndex]) : data[hoverIndex]} 
            label={isTimeType ? '' : label}
            position={tooltipPos}
          />
        )}
      </AnimatePresence>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible pointer-events-none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* X and Y Axes Grid and Label Rendering */}
        <g className="opacity-60">
           {yTicks.map((yVal, idx) => {
              const yPos = margin.top + height - ((yVal - min) / range) * height;
              const fVal = formatYValue(yVal);
              const splitVal = String(fVal).split(' ');
              return (
                 <g key={`y-${idx}`}>
                   <line x1={margin.left} y1={yPos} x2={margin.left + width} y2={yPos} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                   <text x={margin.left - 8} y={yPos} fontSize="10" fill="#64748b" textAnchor="end" fontWeight="bold">
                     {splitVal.length > 1 ? (
                        <>
                         <tspan x={margin.left - 8} dy="-2">{splitVal[0]}</tspan>
                         <tspan x={margin.left - 8} dy="10" fontSize="8">{splitVal[1]}</tspan>
                        </>
                     ) : (
                         <tspan x={margin.left - 8} dy="3">{fVal}</tspan>
                     )}
                   </text>
                 </g>
              )
           })}

           {points.map((p, idx) => {
              if (idx % skipFactor !== 0 && idx !== points.length - 1) return null;
              const dateStr = dates?.[idx];
              let d = null;
              if (dateStr) {
                  const dp = new Date(dateStr);
                  if (!isNaN(dp.getTime())) d = dp;
              }
              const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              return (
                 <g key={`x-${idx}`}>
                   <line x1={p.x} y1={margin.top} x2={p.x} y2={margin.top + height} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                   {d && (
                     <text x={p.x} y={margin.top + height + 14} fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="bold">
                       <tspan x={p.x} dy="0">{d.getDate()}</tspan>
                       <tspan x={p.x} dy="10" fontSize="8">{months[d.getMonth()]}</tspan>
                     </text>
                   )}
                 </g>
              )
           })}
        </g>

        {/* Improved Area Fill */}
        <motion.path
          d={areaData}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Premium Smooth Line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="drop-shadow-md"
        />

        {/* Interaction Selected State Tracking */}
        <AnimatePresence>
          {points.map((p, i) => (
            (hoverIndex === i || (i === points.length - 1 && hoverIndex === null)) && (
              <motion.g
                key={`point-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <line 
                  x1={p.x} 
                  y1={margin.top} 
                  x2={p.x} 
                  y2={margin.top + height} 
                  stroke={color} 
                  strokeWidth="1.5" 
                  strokeOpacity={hoverIndex === i ? 0.4 : 0.1}
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  fill="white" 
                  stroke={color} 
                  strokeWidth="2.5"
                  className="drop-shadow-lg"
                />
              </motion.g>
            )
          ))}
        </AnimatePresence>
      </svg>
    </div>
  );
};

const PersonalSadhanaAnalytics = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('7 Days');
  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  
  const todayDate = new Date().toISOString().split('T')[0];
  const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(lastWeekDate);
  const [toDate, setToDate] = useState(todayDate);
  const [activitiesData, setActivitiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = ['7 Days', '30 Days', 'Custom'];
  
  const fetchAnalytics = () => {
    if (!userDetails?.user_id) return;
    setIsLoading(true);
    
    const filterMap = {
      '7 Days': '7days',
      '30 Days': '30days',
      'Custom': 'custom'
    };
    
    const params = {
      user_id: userDetails.user_id,
      filter: filterMap[activeTab] || '7days',
    };

    if (activeTab === 'Custom') {
      params.start_date = fromDate;
      params.end_date = toDate;
    }

    getRequest('/student-activities-analytics', params, (response) => {
      console.log("Analytics response:", response);
      const res = response.data;
      const dataObj = res?.data || res; 
      let payloadArray = [];
      
      if (Array.isArray(dataObj)) payloadArray = dataObj;
      else if (dataObj && Array.isArray(dataObj.activities_analytics)) payloadArray = dataObj.activities_analytics;
      else if (dataObj && Array.isArray(dataObj.data)) payloadArray = dataObj.data;
      
      const mapped = payloadArray.map(act => {
          const chartData = Array.isArray(act.daily_data) 
             ? act.daily_data.map(d => {
                 const rawCount = d.count;
                 if (typeof rawCount === 'string' && rawCount.includes(':')) {
                     return timeToMinutes(rawCount);
                 }
                 return Number(rawCount || 0);
               }) 
             : (Array.isArray(act.data) ? act.data : []);
          
          const chartDates = Array.isArray(act.daily_data)
             ? act.daily_data.map(d => d.activity_date)
             : [];

          // Native React thematic mapping
          const n = (act.name || '').toLowerCase();
          const t = (act.activity_type || act.type || '').toLowerCase();
          const l = (act.label || '').toLowerCase();
          
          let resolvedColor = act.color || '#1a73e8';
          let resolvedLabel = act.label || 'Count';
          
          // Detect if it is a time type based on type or label or name
          const isTimeNode = t === 'time' || l.includes('time') || l.includes('target') || n.includes('time');

          if (isTimeNode) {
            resolvedColor = '#06b6d4';
            resolvedLabel = 'Time';
          } else if (n.includes('chant')) { resolvedColor = '#1a73e8'; resolvedLabel = 'Rounds'; }
          else if (n.includes('read')) { resolvedColor = '#a855f7'; resolvedLabel = 'Mins'; }
          else if (n.includes('meditat') || n.includes('hear') || l.includes('min')) { resolvedColor = '#20c997'; resolvedLabel = 'Mins'; }
          else if (t === 'numb' || t === 'count') { resolvedColor = '#f59e0b'; resolvedLabel = 'Count'; }
          else if (t === 'boolean' || t === 'yes/no' || t === 'yes_no') { resolvedColor = '#10b981'; resolvedLabel = 'Times'; }

          // Clean up time values and handle formatting
          let displayVal = act.value ?? act.average_count ?? 0;
          if (isTimeNode) {
            displayVal = minutesToTime(timeToMinutes(String(displayVal)));
          } else if (String(displayVal).includes(':')) {
            displayVal = String(displayVal).split('.')[0]; // Handle HH:mm:ss.ms
          }

          if (!resolvedLabel.startsWith('Avg.')) {
            resolvedLabel = `Avg. ${resolvedLabel}`;
          }

          return {
              ...act,
              data: chartData.length > 0 ? chartData : [0,0,0,0,0,0,0],
              dates: chartDates,
              color: resolvedColor,
              value: displayVal,
              label: resolvedLabel,
              name: act.name || 'ACTIVITY',
              trend: act.trend || 'Stable',
              type: t
          };
      });
      setActivitiesData(mapped);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeTab, fromDate, toDate, userDetails]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F172A] font-sans pb-28 relative overflow-x-hidden transition-colors duration-300">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <button 
            onClick={() => navigate('/counsellor/dashboard')}
            className="w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] shadow-sm flex items-center justify-center text-[#0f172a] dark:text-[#F8FAFC] active:scale-95 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-[20px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight mt-1 transition-colors duration-300">My Sadhana</h1>

            <button
            onClick={() => setIsAiAnalysisModalOpen(true)} 
              className="mt-1 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-[10px] font-black text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              <span>AI ANALYSIS</span>
            </button>
          
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] shadow-sm flex items-center justify-center text-[#0f172a] dark:text-[#F8FAFC] active:scale-95 transition-all relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs / Segmented Control */}
        <div className="px-6 mb-6">
          <div className="bg-white dark:bg-[#1E293B] p-1.5 rounded-[24px] shadow-sm flex items-center justify-between transition-colors duration-300">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-[20px] text-[15px] font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-[#1a73e8] text-white shadow-md shadow-blue-500/20' 
                    : 'text-gray-400 dark:text-[#94A3B8] hover:text-gray-600 dark:hover:text-[#CBD5E1]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Picker Section */}
        <AnimatePresence>
          {activeTab === 'Custom' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 mb-8 overflow-hidden"
            >
              <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] shadow-sm border border-blue-200 dark:border-[#334155] flex flex-col items-stretch gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">From</label>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-bold text-[14px] rounded-2xl py-3 px-4 outline-none border border-transparent focus:border-blue-100 dark:focus:border-blue-500/50 transition-all cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div className="text-gray-300 dark:text-gray-500 flex justify-center -my-1">
                  <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">To</label>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] font-bold text-[14px] rounded-2xl py-3 px-4 outline-none border border-transparent focus:border-blue-100 dark:focus:border-blue-500/50 transition-all cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Range Label (Shown when not in custom mode or as header) */}
        {activeTab !== 'Custom' && (
          <div className="text-center mb-8">
            <span className="text-[16px] font-bold text-gray-400 dark:text-[#64748b]">
               {activeTab === '7 Days' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
          </div>
        )}

        {/* Cards List */}
        <div className="px-6 space-y-8 min-h-[50vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading analytics...</p>
            </div>
          ) : activitiesData.length > 0 ? (
            activitiesData.map((activity, idx) => (
            <motion.div
              key={activity.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-blue-200 dark:border-[#334155] flex flex-col relative overflow-visible group transition-colors duration-300"
            >
              {/* Badge */}
              <div className="absolute top-8 right-8">
                <span className={`px-4 py-1.5 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 ${
                  activity.trend === 'Stable' 
                    ? 'bg-[#f0f7ff] text-[#1a73e8]' 
                    : 'bg-[#f0fdf4] text-[#16a34a]'
                }`}>
                  {activity.trend !== 'Stable' && (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                  )}
                  {activity.trend}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-[12px] font-black text-gray-300 dark:text-[#64748b] uppercase tracking-[0.14em]">{activity.name}</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`${String(activity.value).length > 6 ? 'text-[32px]' : 'text-[48px]'} font-black text-[#0f172a] dark:text-[#F8FAFC] leading-none tracking-tight`}>
                    {activity.value}
                  </span>
                  <span className="text-[17px] font-bold text-gray-400 dark:text-[#94A3B8]">{activity.label}</span>
                </div>
              </div>

              {/* Interative Premium Chart */}
              <MiniChart 
                data={activity.data} 
                dates={activity.dates}
                color={activity.color} 
                label={activity.label}
              />
            </motion.div>
          ))
        ) : (
            <div className="text-center pt-10">
              <p className="text-gray-500 font-medium text-lg">No analytics data found</p>
            </div>
        )}
        </div>

      </div>

      {/* Overlays */}
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      
      <AIAnalysisModal
        isOpen={isAiAnalysisModalOpen}
        onClose={() => setIsAiAnalysisModalOpen(false)}
        userDetails={userDetails}
      />
      
      <CounsellorBottomNavigation />
    </div>
  );
};

export default PersonalSadhanaAnalytics;
