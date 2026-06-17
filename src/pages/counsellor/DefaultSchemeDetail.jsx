import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';

const initialScheme = {
  sleep_time: {
    title: "Sleep Time", icon: "😴", maxMarks: 25,
    rows: [
      { condition: "Up to 22:15", marks: 25 },
      { condition: "22:30", marks: 20 },
      { condition: "22:45", marks: 15 },
      { condition: "23:00", marks: 10 },
      { condition: "23:15", marks: 5 },
      { condition: "After 23:15", marks: 0 }
    ]
  },
  wake_up_time: {
    title: "Wake Up Time", icon: "🌅", maxMarks: 25,
    rows: [
      { condition: "Up to 04:45", marks: 25 },
      { condition: "05:00", marks: 20 },
      { condition: "05:15", marks: 15 },
      { condition: "05:30", marks: 10 },
      { condition: "05:45", marks: 5 },
      { condition: "After 05:45", marks: 0 }
    ]
  },
  chanting_completion_time: {
    title: "Chanting Completion Time", icon: "📿", maxMarks: 25,
    rows: [
      { condition: "Up to 07:15", marks: 25 },
      { condition: "09:30", marks: 20 },
      { condition: "13:00", marks: 15 },
      { condition: "19:00", marks: 10 },
      { condition: "21:00", marks: 5 },
      { condition: "After 23:00", marks: 0 }
    ]
  },
  chanting_rounds: {
    title: "Chanting Rounds", icon: "📿", maxMarks: 25,
    rows: [
      { condition: "Rounds ≥ Target AND Same Day", marks: 25 },
      { condition: "Otherwise", marks: 0 }
    ]
  },
  day_rest_duration: {
    title: "Day Rest Duration", icon: "⏱️", maxMarks: 25,
    rows: [
      { condition: "Up to 60 min", marks: 25 },
      { condition: "75 min", marks: 20 },
      { condition: "90 min", marks: 15 },
      { condition: "105 min", marks: 10 },
      { condition: "120 min", marks: 5 },
      { condition: "135 min", marks: 0 },
      { condition: "Above 135 min", marks: -5 }
    ]
  },
  hearing_duration: {
    title: "Hearing Duration", icon: "👂", maxMarks: 20,
    rows: [
      { condition: "0 min", marks: 0 },
      { condition: "5 min", marks: 5 },
      { condition: "10 min", marks: 10 },
      { condition: "20 min", marks: 15 },
      { condition: "Above 25 min", marks: 20 }
    ]
  },
  reading_duration: {
    title: "Reading Duration", icon: "📖", maxMarks: 20,
    rows: [
      { condition: "0 min", marks: 0 },
      { condition: "5 min", marks: 5 },
      { condition: "10 min", marks: 10 },
      { condition: "20 min", marks: 15 },
      { condition: "Above 25 min", marks: 20 }
    ]
  }
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
    <div className="bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[20px] p-[24px] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-md dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)]">
      
      {/* Card Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <span className="text-[24px] leading-none">{data.icon}</span>
          <h3 className="font-semibold text-[16px] text-[#0F172A] dark:text-white leading-none">{data.title}</h3>
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
      <div className="pt-6 flex-1 flex flex-col relative" ref={dropdownRef}>
        <div className="grid grid-cols-2 gap-4 pb-3 mb-2 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
          <div className="text-[12px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Condition</div>
          <div className="text-[12px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider text-right sm:text-left sm:pl-6">Marks</div>
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
                minValid = idx === 0 ? 0 : data.rows[idx-1].marks;
                maxValid = data.rows[idx+1].marks;
              } else {
                maxValid = idx === 0 ? data.maxMarks : data.rows[idx-1].marks;
                minValid = data.rows[idx+1].marks;
              }
            }

            // Generate dropdown options
            const options = [];
            for(let v = maxValid; v >= minValid; v -= 5) {
              if (v <= data.maxMarks) options.push(v);
            }

            const canEdit = isEditing && !isLastRow && !isNegative; // Prevent editing last row (always 0) and negatives for simplicity in this demo

            return (
              <div key={idx} className="relative grid grid-cols-2 gap-4 items-center h-[48px] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] last:border-0 hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-200 px-2 -mx-2 rounded-lg">
                <div className="text-[14px] text-[#0F172A] dark:text-gray-200 font-medium truncate pr-2">{row.condition}</div>
                <div className="flex items-center justify-end sm:justify-start sm:pl-6 relative">
                  <div 
                    onClick={() => canEdit ? setOpenDropdownIdx(openDropdownIdx === idx ? null : idx) : null}
                    className={`flex items-center px-2 py-1 rounded-md transition-colors ${canEdit ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800' : ''}`}
                  >
                    <span className={`text-[14px] font-semibold ${marksColor}`}>
                      {row.marks > 0 ? `+${row.marks}` : row.marks}
                    </span>
                    {canEdit && (
                      <svg className="w-3 h-3 ml-1 text-gray-400 dark:text-[#6b7a99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    )}
                  </div>

                  {/* Inline Dropdown */}
                  {openDropdownIdx === idx && canEdit && (
                    <div className="absolute top-[100%] right-0 sm:left-6 mt-1 w-[80px] bg-white dark:bg-[#112240] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                      {options.map(opt => (
                        <div 
                          key={opt}
                          onClick={() => {
                            onRowMarkChange(activityKey, idx, opt);
                            setOpenDropdownIdx(null);
                          }}
                          className={`px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center ${row.marks === opt ? 'text-teal-600 dark:text-[#1de9b6] bg-teal-50 dark:bg-teal-900/20' : 'text-slate-700 dark:text-gray-300'}`}
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
  const [isEditing, setIsEditing] = useState(false);
  const [savedScheme, setSavedScheme] = useState(initialScheme);
  const [draftScheme, setDraftScheme] = useState(initialScheme);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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

  const handleSaveConfirm = () => {
    setSavedScheme(draftScheme);
    setIsEditing(false);
    setShowSaveModal(false);
    
    // Show toast
    setToastMessage("Default scheme updated successfully");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCancelClick = () => {
    // Check if changes were made
    if (JSON.stringify(savedScheme) === JSON.stringify(draftScheme)) {
      setIsEditing(false);
    } else {
      setShowCancelModal(true);
    }
  };

  const handleDiscardChanges = () => {
    setDraftScheme(savedScheme);
    setIsEditing(false);
    setShowCancelModal(false);
  };

  const totalActivities = Object.keys(draftScheme).length;
  const currentTotalMarks = calculateTotalMarks(draftScheme);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A192F] font-sans pb-28 transition-colors duration-300 flex flex-col relative">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A192F]/80 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-6 py-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.06)] active:scale-90 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-[18px] font-bold text-[#0F172A] dark:text-white leading-none tracking-tight">Marking Scheme</h1>
              <p className="text-[12px] font-medium text-slate-500 dark:text-gray-400 mt-1">Manage grading and evaluation criteria</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-[14px] py-[6px] border border-teal-500 dark:border-[#1de9b6] text-teal-600 dark:text-[#1de9b6] rounded-[8px] text-[13px] font-medium hover:bg-teal-50 dark:hover:bg-[#1de9b6]/10 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCancelClick}
                  className="px-[14px] py-[6px] text-gray-500 dark:text-[#6b7a99] rounded-[8px] text-[13px] font-medium hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowSaveModal(true)}
                  className="px-[14px] py-[6px] bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-[8px] text-[13px] font-medium hover:opacity-90 active:scale-95 shadow-sm transition-all"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Warning Banner */}
      {isEditing && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-50 dark:bg-[rgba(239,159,39,0.12)] border-l-4 border-amber-500 dark:border-[#EF9F27] rounded-r-[8px] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 text-amber-500 dark:text-[#EF9F27] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[12px] font-medium text-amber-700 dark:text-[#EF9F27]">
            You are editing the default scheme. Changes will apply to all users in this group.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 ${isEditing ? 'py-4' : 'py-8'} transition-all duration-300`}>
        
        {/* KPI Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[20px] p-8 border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-md dark:shadow-none flex flex-col justify-center h-[140px] backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <p className="text-[13px] font-medium text-slate-500 dark:text-gray-400 mb-2">Total Activities</p>
            <h2 className="text-[42px] font-bold text-[#0F172A] dark:text-white leading-none">{totalActivities}</h2>
          </div>
          
          <div className={`bg-gradient-to-r from-[#059669] to-[#10B981] dark:from-[#00D4AA] dark:to-[#12C2A3] rounded-[20px] p-8 shadow-md dark:shadow-[0_8px_30px_rgba(0,212,170,0.2)] flex flex-col justify-center h-[140px] text-white transition-colors duration-300 ${totalMarksFlash ? 'ring-4 ring-amber-400 dark:ring-[#EF9F27]' : ''}`}>
            <p className={`text-[13px] font-medium mb-2 transition-colors duration-300 ${totalMarksFlash ? 'text-amber-100' : 'text-emerald-100 dark:text-[rgba(255,255,255,0.8)]'}`}>Max Possible Marks</p>
            <h2 className={`text-[42px] font-bold leading-none transition-colors duration-300 ${totalMarksFlash ? 'text-amber-300 dark:text-[#EF9F27]' : 'text-white'}`}>{currentTotalMarks}</h2>
          </div>
        </div>

        {/* Marking Scheme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
          {Object.entries(draftScheme).map(([key, data]) => (
            <SchemeTable 
              key={key} 
              activityKey={key} 
              data={data} 
              isEditing={isEditing} 
              onMaxChange={handleMaxChange} 
              onRowMarkChange={handleRowMarkChange} 
            />
          ))}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-[rgba(0,0,0,0.6)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#112240] rounded-[16px] p-[24px] shadow-2xl max-w-sm w-full border border-gray-100 dark:border-[rgba(255,255,255,0.1)] scale-in-center">
            <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-2">Save changes to Default Scheme?</h3>
            <p className="text-[13px] text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              This will update marks for all members. Previous scheme will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-[#6b7a99] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveConfirm}
                className="px-4 py-2 text-[13px] font-medium bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-[rgba(0,0,0,0.6)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#112240] rounded-[16px] p-[24px] shadow-2xl max-w-[300px] w-full border border-gray-100 dark:border-[rgba(255,255,255,0.1)] scale-in-center">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-6">Discard changes?</h3>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-[#6b7a99] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Keep editing
              </button>
              <button 
                onClick={handleDiscardChanges}
                className="px-4 py-2 text-[13px] font-medium bg-red-500 dark:bg-[#FF5C5C] text-white rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

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
