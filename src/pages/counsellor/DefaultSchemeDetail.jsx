import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { saveScheme } from '../../api/markingSchemes';

export const initialScheme = {
  sleep_time: {
    id: 101, title: "Sleep Time", icon: "😴", maxMarks: 25,
    rows: [
      { condition: "Up to 22:15", marks: 25 },
      { condition: "Up to 22:30", marks: 20 },
      { condition: "Up to 22:45", marks: 15 },
      { condition: "Up to 23:00", marks: 10 },
      { condition: "Up to 23:15", marks: 5 },
      { condition: "After 23:15", marks: 0 }
    ]
  },
  wake_up_time: {
    id: 102, title: "Wake Up Time", icon: "🌅", maxMarks: 25,
    rows: [
      { condition: "Up to 04:00", marks: 25 },
      { condition: "Up to 04:15", marks: 20 },
      { condition: "Up to 04:30", marks: 15 },
      { condition: "Up to 04:45", marks: 10 },
      { condition: "Up to 05:00", marks: 5 },
      { condition: "After 05:00", marks: 0 }
    ]
  },
  chanting_completion_time: {
    id: 103, title: "Chanting Completion Time", icon: "📿", maxMarks: 25,
    rows: [
      { condition: "Up to 07:15", marks: 25 },
      { condition: "Up to 09:30", marks: 20 },
      { condition: "Up to 13:00", marks: 15 },
      { condition: "Up to 19:00", marks: 10 },
      { condition: "Up to 21:00", marks: 5 },
      { condition: "After 23:00", marks: 0 }
    ]
  },
  japa_rounds: {
    id: 104, title: "Japa Number of Rounds", icon: "📿", maxMarks: 25,
    rows: [
      { condition: "At Least 16", marks: 25 },
      { condition: "At Least 14", marks: 20 },
      { condition: "At Least 12", marks: 15 },
      { condition: "At Least 10", marks: 10 },
      { condition: "At Least 0", marks: 0 }
    ]
  },
  mangal_aarti: {
    id: 105, title: "Mangal Aarti Attended (Weekly)", icon: "🙏", maxMarks: 25,
    rows: [
      { condition: "At Least 7 Days", marks: 25 },
      { condition: "At Least 6 Days", marks: 20 },
      { condition: "At Least 5 Days", marks: 15 },
      { condition: "At Least 4 Days", marks: 10 },
      { condition: "At Least 3 Days", marks: 5 },
      { condition: "At Least 0 Days", marks: 0 }
    ]
  },
  day_best_duration: {
    id: 106, title: "Day Rest Duration", icon: "⏱️", maxMarks: 25,
    rows: [
      { condition: "Up to 60 min", marks: 25 },
      { condition: "Up to 75 min", marks: 20 },
      { condition: "Up to 90 min", marks: 15 },
      { condition: "Up to 105 min", marks: 10 },
      { condition: "Up to 120 min", marks: 5 },
      { condition: "Up to 135 min", marks: 0 },
      { condition: "After 135 min", marks: -5 }
    ]
  },
  hearing_duration: {
    id: 107, title: "Hearing Duration", icon: "👂", maxMarks: 20,
    rows: [
      { condition: "At least 25 min", marks: 20 },
      { condition: "At least 20 min", marks: 15 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  reading_duration: {
    id: 108, title: "Reading Srila Prabhupada's Books", icon: "📖", maxMarks: 20,
    rows: [
      { condition: "At least 25 min", marks: 20 },
      { condition: "At least 20 min", marks: 15 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  reading_misc: {
    id: 109, title: "Reading Miscellaneous Books", icon: "📚", maxMarks: 15,
    rows: [
      { condition: "At least 25 min", marks: 15 },
      { condition: "At least 20 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  book_distribution: {
    id: 110, title: "Book Distribution", icon: "📖", maxMarks: 20,
    rows: [
      { condition: "Up to 60 min", marks: 25 },
      { condition: "Up to 75 min", marks: 20 },
      { condition: "Up to 90 min", marks: 15 },
      { condition: "Up to 105 min", marks: 10 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  exercise_yoga: {
    id: 111, title: "Exercise / Yoga", icon: "🧘‍♂️", maxMarks: 20,
    rows: [
      { condition: "At least 25 min", marks: 20 },
      { condition: "At least 20 min", marks: 15 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  hearing_sm: {
    id: 112, title: "Hearing Spiritual Master", icon: "🎧", maxMarks: 20,
    rows: [
      { condition: "At least 25 min", marks: 20 },
      { condition: "At least 20 min", marks: 15 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  hearing_sp: {
    id: 113, title: "Hearing Srila Prabhupada", icon: "🎧", maxMarks: 20,
    rows: [
      { condition: "At least 25 min", marks: 20 },
      { condition: "At least 20 min", marks: 15 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  hearing_misc: {
    id: 114, title: "Hearing Miscellaneous", icon: "🎧", maxMarks: 20,
    rows: [
      { condition: "At least 25 min", marks: 20 },
      { condition: "At least 20 min", marks: 15 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  menial_services: {
    id: 115, title: "Menial Services (Weekly)", icon: "🧹", maxMarks: 25,
    rows: [
      { condition: "At least 120 min", marks: 25 },
      { condition: "At least 60 min", marks: 20 },
      { condition: "At least 30 min", marks: 15 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  },
  shloka: {
    id: 116, title: "Shloka Memorisation (Weekly)", icon: "📜", maxMarks: 25,
    rows: [
      { condition: "At least 30 min", marks: 25 },
      { condition: "At least 25 min", marks: 20 },
      { condition: "At least 20 min", marks: 15 },
      { condition: "At least 15 min", marks: 10 },
      { condition: "At least 10 min", marks: 5 },
      { condition: "At least 0 min", marks: 0 }
    ]
  }
};

const parseCondition = (conditionStr) => {
  const rules = ["Before", "After", "Up To", "Up to", "At Least", "Exact Time", "Yes", "No"];
  const lowerStr = (conditionStr || '').toLowerCase();
  
  for (const rule of rules) {
    const lowerRule = rule.toLowerCase();
    if (lowerStr.startsWith(lowerRule)) {
      const remainder = conditionStr.substring(rule.length).trim();
      let titleCaseRule = rule.toLowerCase() === "up to" ? "Up To" : rule;
      titleCaseRule = titleCaseRule.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      return { value: remainder || conditionStr, rule: titleCaseRule };
    }
  }
  
  if (conditionStr) console.warn(`Unrecognized condition format: "${conditionStr}"`);
  return { value: conditionStr, rule: "" };
};

const StepperControl = ({ value, onChange }) => {
  const handleMinus = (e) => {
    e.stopPropagation();
    if (value > 5) onChange(value - 5);
  };
  const handlePlus = (e) => {
    e.stopPropagation();
    if (value < 50) onChange(value + 5);
  };

  return (
    <div className="flex items-center justify-between bg-[#0b1628] border border-[rgba(255,255,255,0.1)] rounded-lg p-1 w-[90px] shadow-inner">
      <button
        onClick={handleMinus}
        disabled={value <= 5}
        className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-lg ${value <= 5 ? 'text-gray-600 dark:text-gray-700 cursor-not-allowed' : 'text-slate-400 dark:text-[#6b7a99] hover:bg-white/10 active:scale-95 transition-all'}`}
      >
        −
      </button>
      <span className="text-white text-[12px] font-medium leading-none">{value}</span>
      <button
        onClick={handlePlus}
        disabled={value >= 50}
        className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-lg ${value >= 50 ? 'text-gray-600 dark:text-gray-700 cursor-not-allowed' : 'text-teal-500 dark:text-[#1de9b6] hover:bg-white/10 active:scale-95 transition-all'}`}
      >
        +
      </button>
    </div>
  );
};

const SchemeTable = ({ activityKey, data, isEditing, onMaxChange, onRowMarkChange }) => {
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[16px] p-[12px] sm:p-[14px] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-md dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] break-words">

      {/* Card Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <span className="text-[16px] leading-none">{data.icon}</span>
          <h3 className="font-semibold text-[13px] sm:text-[14px] text-[#0F172A] dark:text-white leading-none">{data.title}</h3>
        </div>
        <div className="flex items-center h-8">
          {isEditing ? (
            <StepperControl value={data.maxMarks} onChange={(newVal) => onMaxChange(activityKey, newVal)} />
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-[#059669]/10 dark:bg-[rgba(0,212,170,0.15)] text-[#059669] dark:text-[#00D4AA] text-[12px] font-semibold border border-transparent">
              {data.maxMarks} pts
            </div>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="pt-2 flex-1 flex flex-col relative" ref={dropdownRef}>
        <div className="grid grid-cols-3 gap-2 pb-2 mb-1 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
          <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Condition-Values</div>
          <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Conditions</div>
          <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider text-right sm:text-left sm:pl-6">Marks</div>
        </div>

        <div className="flex flex-col flex-1 relative">
          {data.rows.map((row, idx) => {
            const isPositive = row.marks > 0;
            const isZero = row.marks === 0;
            const isNegative = row.marks < 0;
            const isLastRow = idx === data.rows.length - 1;

            let marksColor = '';
            if (isPositive) marksColor = 'text-[#059669] dark:text-[#00D4AA]';
            else if (isZero) marksColor = 'text-[#64748B] dark:text-[#94A3B8]';
            else marksColor = 'text-[#DC2626] dark:text-[#FF5C5C]';

            // Calculate valid options for dropdown
            // For descending sort, row[i] must be <= row[i-1] and >= row[i+1]
            // Wait, data might be ascending (e.g. Hearing Duration: 0, 5, 10, 15, 20)
            // Let's determine sort direction based on first and last row
            const isAscending = data.rows[0].marks < data.rows[data.rows.length - 1].marks;

            let minValid = isNegative ? -10 : 0; // Allow negatives if it's already negative
            let maxValid = data.maxMarks;

            if (!isLastRow && isEditing && !isNegative) {
              if (isAscending) {
                minValid = idx === 0 ? 0 : data.rows[idx - 1].marks;
                maxValid = data.rows[idx + 1].marks;
              } else {
                maxValid = idx === 0 ? data.maxMarks : data.rows[idx - 1].marks;
                minValid = data.rows[idx + 1].marks;
              }
            }

            // Generate dropdown options
            const options = [];
            for (let v = maxValid; v >= minValid; v -= 5) {
              if (v <= data.maxMarks) options.push(v);
            }

            const canEdit = isEditing && !isLastRow && !isNegative;
            const parsed = parseCondition(row.condition);

            return (
              <div key={idx} className="relative grid grid-cols-3 gap-2 items-center min-h-[28px] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] last:border-0 hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-200 px-2 -mx-2 rounded-lg py-[2px]">
                <div className="text-[11px] text-[#0F172A] dark:text-gray-200 font-medium truncate pr-2">{parsed.value}</div>
                <div className="text-[11px] text-[#64748B] dark:text-gray-400 font-medium truncate pr-2">{parsed.rule}</div>
                <div className="flex items-center justify-end sm:justify-start sm:pl-6 relative">
                  <div
                    onClick={() => canEdit ? setOpenDropdownIdx(openDropdownIdx === idx ? null : idx) : null}
                    className={`flex items-center gap-1.5 ${canEdit ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 py-1 px-2 -ml-2 rounded-md transition-colors' : ''}`}
                  >
                    <span className={`text-[11px] sm:text-[12px] font-semibold ${marksColor}`}>
                      {row.marks > 0 ? `+${row.marks}` : row.marks}
                    </span>
                    {canEdit && (
                      <svg className="w-3 h-3 ml-1 text-gray-400 dark:text-[#6b7a99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    )}
                  </div>

                  {/* Inline Dropdown */}
                  {openDropdownIdx === idx && canEdit && (
                    <div className="absolute top-[100%] right-0 sm:left-6 mt-1 w-[80px] bg-white dark:bg-[#112240] border border-gray-400/70 dark:border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                      {options.map(opt => (
                        <div
                          key={opt}
                          onClick={() => {
                            onRowMarkChange(activityKey, idx, opt);
                            setOpenDropdownIdx(null);
                          }}
                          className={`px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center ${row.marks === opt ? 'text-teal-600 dark:text-[#1de9b6] bg-teal-50 dark:bg-teal-900/20' : 'text-slate-700 dark:text-gray-300'}`}
                        >
                          {opt > 0 ? `+${opt}` : opt}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DefaultSchemeDetail = () => {
  const navigate = useNavigate();
  const [savedScheme, setSavedScheme] = useState(initialScheme);
  const [draftScheme, setDraftScheme] = useState(initialScheme);

  const [toastMessage, setToastMessage] = useState(null);

  const [totalMarksFlash, setTotalMarksFlash] = useState(false);

  const calculateTotalMarks = (scheme) => {
    return Object.values(scheme).reduce((acc, curr) => acc + curr.maxMarks, 0);
  };

  const handleMaxChange = (activityKey, newMax) => {
    setDraftScheme(prev => {
      const activity = prev[activityKey];
      const isAscending = activity.rows[0].marks < activity.rows[activity.rows.length - 1].marks;

      // Auto-scale down rows if they exceed the new max
      const newRows = activity.rows.map(row => {
        if (row.marks > newMax) {
          return { ...row, marks: newMax };
        }
        return row;
      });

      return {
        ...prev,
        [activityKey]: { ...activity, maxMarks: newMax, rows: newRows }
      };
    });

    // Trigger amber flash on total marks
    setTotalMarksFlash(true);
    setTimeout(() => setTotalMarksFlash(false), 500);
  };

  const handleRowMarkChange = (activityKey, rowIdx, newMark) => {
    setDraftScheme(prev => {
      const activity = prev[activityKey];
      const newRows = [...activity.rows];
      newRows[rowIdx].marks = newMark;
      return {
        ...prev,
        [activityKey]: { ...activity, rows: newRows }
      };
    });
  };

  const handleEditInitiate = async () => {
    // Convert initialScheme to array format for saveScheme
    const defaultActivitiesArray = Object.entries(initialScheme).map(([key, data]) => ({
      id: data.id || key,
      title: data.title,
      icon: data.icon,
      maxMarks: data.maxMarks,
      badge: 'Daily',
      rows: JSON.parse(JSON.stringify(data.rows))
    }));
    
    // Create provisional clone
    const res = await saveScheme('', defaultActivitiesArray, null, true);
    const newCloneId = res.scheme.id;
    
    // Navigate to the edit view of the new clone
    navigate(`/counsellor/marking-scheme/${newCloneId}`, { state: { autoEdit: true } });
  };



  const totalActivities = Object.keys(draftScheme).length;
  const currentTotalMarks = calculateTotalMarks(draftScheme);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A192F] font-sans pb-28 transition-colors duration-300 flex flex-col relative">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A192F]/80 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-4 transition-all duration-300 box-border">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-[200px]">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-slate-500 dark:text-[#6b7a99] hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.06)] active:scale-90 transition-all"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white leading-none tracking-tight truncate">Default-Scheme</h1>
              <p className="text-[11px] sm:text-[12px] font-medium text-teal-600 dark:text-[#1de9b6] mt-1 truncate">Full Activity List</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <button
              onClick={handleEditInitiate}
              className="flex items-center gap-1.5 px-[14px] py-[6px] border border-teal-500 dark:border-[#1de9b6] text-teal-600 dark:text-[#1de9b6] rounded-[8px] text-[13px] font-medium hover:bg-teal-50 dark:hover:bg-[#1de9b6]/10 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-[90%] max-w-[1080px] mx-auto px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-8 transition-all duration-300 box-border">

        {/* KPI Section */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 md:mb-10">
          <div className="bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[18px] p-4 sm:p-8 border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-md dark:shadow-none flex flex-col justify-center h-[100px] sm:h-[126px] backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <p className="text-[11px] sm:text-[13px] font-medium text-slate-500 dark:text-gray-400 mb-1 sm:mb-2">Total Activities</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-[#0F172A] dark:text-white leading-none">{totalActivities}</h2>
          </div>

          <div className={`bg-gradient-to-r from-[#059669] to-[#10B981] dark:from-[rgba(29,233,182,0.1)] dark:to-[rgba(29,233,182,0.05)] border border-transparent dark:border-[rgba(29,233,182,0.2)] rounded-[18px] p-4 sm:p-8 shadow-md flex flex-col justify-center h-[100px] sm:h-[126px] text-white transition-colors duration-300 ${totalMarksFlash ? 'ring-4 ring-amber-400 dark:ring-[#EF9F27]' : ''}`}>
            <p className={`text-[11px] sm:text-[13px] font-medium mb-1 sm:mb-2 transition-colors duration-300 ${totalMarksFlash ? 'text-amber-100' : 'text-emerald-100 dark:text-[#1de9b6]'}`}>Max Possible Marks</p>
            <h2 className={`text-[28px] sm:text-[38px] font-bold leading-none transition-colors duration-300 ${totalMarksFlash ? 'text-amber-300 dark:text-[#EF9F27]' : 'text-white'}`}>{currentTotalMarks}</h2>
          </div>
        </div>

        {/* Marking Scheme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
          {Object.entries(draftScheme).map(([key, data]) => (
            <SchemeTable
              key={key}
              activityKey={key}
              data={data}
              isEditing={false}
              onMaxChange={handleMaxChange}
              onRowMarkChange={handleRowMarkChange}
            />
          ))}
        </div>
      </div>



      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2 bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] px-5 py-3 rounded-full shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            <span className="text-[13px] font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default DefaultSchemeDetail;
