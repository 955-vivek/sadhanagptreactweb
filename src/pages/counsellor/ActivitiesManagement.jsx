import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';

// Mocking Marking Scheme Points
const ACTIVITY_POINTS = {
  sleep_time: 25,
  wake_up_time: 25,
  japa_completion: 25,
  japa_rounds: 25,
  rest_day: 25,
  reading_sp_books: 20, // Distributing or assigning points for new flat structure
  reading_misc_books: 20,
  hearing_sm: 20,
  hearing_sp: 20,
  hearing_misc: 20,
  mangal_aarti: 10,
  seva_menial: 10,
  seva_shloka: 10
};

const CATEGORIES = [
  {
    id: 'japa',
    name: 'JAPA',
    color: '#1de9b6',
    items: [
      { id: 'japa_completion', name: 'Japa Completion Time', icon: 'ti-clock', sub: 'Time chanting was completed', badge: 'Japa' },
      { id: 'japa_rounds', name: 'Japa Number of Rounds', icon: 'ti-repeat', sub: 'Rounds completed daily', badge: 'Japa' }
    ]
  },
  {
    id: 'morning',
    name: 'MORNING',
    color: '#EF9F27',
    items: [
      { id: 'mangal_aarti', name: 'Mangal Aarti Attended', icon: 'ti-flame', sub: 'Morning prayer attendance', badge: 'Morning' }
    ]
  },
  {
    id: 'reading',
    name: 'READING',
    color: '#AFA9EC',
    items: [
      { id: 'reading_sp_books', name: 'Reading SP Books', icon: 'ti-book-2', sub: 'Srila Prabhupada books (mins)', badge: 'Reading' },
      { id: 'reading_misc_books', name: 'Reading Misc. Books', icon: 'ti-books', sub: 'Other spiritual books (mins)', badge: 'Reading' }
    ]
  },
  {
    id: 'hearing',
    name: 'HEARING',
    color: '#5DCAA5',
    items: [
      { id: 'hearing_sm', name: 'Hearing Spiritual Master', icon: 'ti-user-heart', sub: 'Lectures by Spiritual Master (mins)', badge: 'Hearing' },
      { id: 'hearing_sp', name: 'Hearing Srila Prabhupada', icon: 'ti-star', sub: 'Srila Prabhupada lectures (mins)', badge: 'Hearing' },
      { id: 'hearing_misc', name: 'Hearing Miscellaneous', icon: 'ti-headphones', sub: 'Other spiritual audio (mins)', badge: 'Hearing' }
    ]
  },
  {
    id: 'seva',
    name: 'SEVA & STUDY',
    color: '#D4537E',
    items: [
      { id: 'seva_menial', name: 'Menial Services', icon: 'ti-tools', sub: 'Seva / service duration (mins)', badge: 'Seva' },
      { id: 'seva_shloka', name: 'Shloka Memorisation', icon: 'ti-writing', sub: 'Weekly — mins memorising', badge: 'Weekly' }
    ]
  },
  {
    id: 'rest',
    name: 'REST',
    color: '#378ADD',
    items: [
      { id: 'sleep_time', name: 'Sleep Time', icon: 'ti-moon', sub: "Previous night's sleep time", badge: 'Rest' },
      { id: 'wake_up_time', name: 'Wake Up Time', icon: 'ti-sun', sub: 'Morning rise time for the day', badge: 'Rest' },
      { id: 'rest_day', name: 'Day Rest', icon: 'ti-zzz', sub: 'Afternoon rest duration (mins)', badge: 'Rest' }
    ]
  }
];

const ActivitiesManagement = () => {
  const navigate = useNavigate();

  const loadInitialState = () => {
    const saved = localStorage.getItem('counsellor_enabled_activities');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    // Default values as per prompt
    return {
      japa_completion: true, japa_rounds: true,
      mangal_aarti: true,
      reading_sp_books: true, reading_misc_books: false,
      hearing_sm: true, hearing_sp: true, hearing_misc: false,
      seva_menial: true, seva_shloka: true,
      sleep_time: true, wake_up_time: true, rest_day: false
    };
  };

  const [toggles, setToggles] = useState(loadInitialState);
  const [savedToggles, setSavedToggles] = useState(loadInitialState);
  
  const [customActivities, setCustomActivities] = useState(() => {
    const saved = localStorage.getItem('counsellor_custom_activities');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    type: 'Duration',
    target: '',
    visibility: 'Public'
  });
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedActivities, setSelectedActivities] = useState([]);

  const allActivities = React.useMemo(() => {
    const customCategory = customActivities.length > 0 ? {
      id: 'custom',
      name: 'CUSTOM',
      color: '#EF9F27',
      items: customActivities.map(ca => ({
        id: ca.id,
        name: ca.name,
        icon: 'ti-puzzle-piece',
        sub: ca.type === 'Yes/No' ? 'Yes / No tracking' : `Target: ${ca.target || 'None'}`,
        badge: 'Custom'
      }))
    } : null;

    const displayCategories = customCategory ? [...CATEGORIES, customCategory] : CATEGORIES;

    return displayCategories.flatMap(cat => 
      cat.items.map(item => ({ ...item, categoryColor: cat.color, categoryName: cat.name }))
    );
  }, [customActivities]);

  const toggleSelection = (id) => {
    setSelectedActivities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedActivities([]);
  };

  const handleSelectAll = () => {
    setSelectedActivities(allActivities.map(a => a.id));
  };

  const toggleActivity = (id) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateActiveCount = () => {
    return Object.values(toggles).filter(Boolean).length;
  };

  const calculateMaxPoints = () => {
    let pts = 0;
    Object.keys(toggles).forEach(key => {
      const mockPoints = ACTIVITY_POINTS[key] || (key.startsWith('custom_') ? 25 : 0);
      if (toggles[key] && mockPoints) {
        pts += mockPoints;
      }
    });
    return pts;
  };

  const activeCount = calculateActiveCount();
  const maxPoints = calculateMaxPoints();
  const hasChanges = JSON.stringify(toggles) !== JSON.stringify(savedToggles);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    localStorage.setItem('counsellor_enabled_activities', JSON.stringify(toggles));
    setSavedToggles(toggles);
    setShowConfirmModal(false);
    
    setToastMessage("Activities updated successfully");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    
    try {
      if (activityToDelete.badge !== 'Custom') {
        throw new Error('Cannot delete system activities');
      }

      // Simulate backend API call delay
      await new Promise(res => setTimeout(res, 600)); 
      
      const newCustomActivities = customActivities.filter(a => a.id !== activityToDelete.id);
      setCustomActivities(newCustomActivities);
      localStorage.setItem('counsellor_custom_activities', JSON.stringify(newCustomActivities));
      
      const newToggles = { ...toggles };
      delete newToggles[activityToDelete.id];
      setToggles(newToggles);
      localStorage.setItem('counsellor_enabled_activities', JSON.stringify(newToggles));
      setSavedToggles(newToggles);
      
      setToastMessage("Activity deleted successfully");
      setTimeout(() => setToastMessage(null), 2500);
      setActivityToDelete(null);
    } catch (err) {
      setToastMessage("Failed to delete activity");
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCustomActivity = () => {
    if (!customForm.name.trim()) return;
    
    const newId = `custom_${Date.now()}`;
    const newActivity = { ...customForm, id: newId };
    
    const updatedCustomActivities = [...customActivities, newActivity];
    setCustomActivities(updatedCustomActivities);
    localStorage.setItem('counsellor_custom_activities', JSON.stringify(updatedCustomActivities));
    
    setToggles(prev => ({ ...prev, [newId]: true }));
    
    setIsCustomModalOpen(false);
    setCustomForm({ name: '', type: 'Duration', target: '', visibility: 'Public' });
  };

  const getIcon = (iconName, color) => {
    const props = { className: "w-[17px] h-[17px]", stroke: color, fill: "none", strokeWidth: "2", viewBox: "0 0 24 24" };
    switch(iconName) {
      case 'ti-clock': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'ti-repeat': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
      case 'ti-flame': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>;
      case 'ti-moon': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
      case 'ti-sun': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
      case 'ti-book-2': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
      case 'ti-books': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'ti-headphones': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
      case 'ti-user-heart': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
      case 'ti-star': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
      case 'ti-tools': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      case 'ti-writing': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
      case 'ti-zzz': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
      case 'ti-puzzle-piece': return <svg {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7h3a1 1 0 0 0 1 -1v-1a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0 -1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-1a2 2 0 0 0 -4 0v1a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h1a2 2 0 0 0 0 -4h-1a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1" /></svg>;
      case 'ti-hash': return <svg {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 9l14 0" /><path d="M5 15l14 0" /><path d="M11 4l-4 16" /><path d="M17 4l-4 16" /></svg>;
      case 'ti-clock-hour-4': return <svg {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12l3 2" /><path d="M12 7v5" /></svg>;
      case 'ti-circle-check': return <svg {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>;
      case 'ti-flag': return <svg {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" /><path d="M5 21v-14" /></svg>;
      case 'ti-world': return <svg {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" /></svg>;
      case 'ti-eye-off': return <svg {...props}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" /><path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" /><path d="M3 3l18 18" /></svg>;
      case 'ti-eye': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
      default: return null;
    }
  };

  const ActivityRow = ({ item, categoryColor, categoryName }) => {
    const isSelected = selectedActivities.includes(item.id);

    const handleRowClick = () => {
      toggleSelection(item.id);
    };

    return (
      <div 
        onClick={handleRowClick}
        className="flex items-center justify-between py-[12px] border-b border-[rgba(255,255,255,0.06)] last:border-b-0 cursor-pointer"
      >
        <div className="flex items-center gap-[14px] flex-1 min-w-0">
          <div 
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0" 
            style={{ backgroundColor: `${categoryColor}1A` }} // 10% opacity
          >
            {getIcon(item.icon, categoryColor)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-[15px] font-bold leading-tight truncate">
              {item.name.toLowerCase()}
            </h3>
            <p className="text-[#6b7a99] text-[13px] leading-tight truncate mt-[2px]">
              {categoryName.toLowerCase()} · {item.sub.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[14px] shrink-0 ml-[12px]">

          {item.badge === 'Custom' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActivityToDelete(item);
              }}
              className="text-[#6b7a99] hover:text-[#FF4D4D] transition-colors" title="Delete"
            >
              <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}

          <div 
            onClick={(e) => {
              e.stopPropagation();
              toggleSelection(item.id);
            }}
            className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-colors cursor-pointer ml-[4px] ${
              isSelected 
                ? 'bg-[#1877F2] border-[#1877F2]' 
                : 'border-[#4a5568] bg-transparent hover:border-white'
            }`}
          >
            {isSelected && (
              <svg className="w-[13px] h-[13px] text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b1628] font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b1628]/80 backdrop-blur-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackClick}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6b7a99] hover:bg-[rgba(255,255,255,0.06)] active:scale-90 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-white leading-none tracking-tight"> Manage Custom Activities</h1>
            <p className="text-[12px] font-medium text-[#1de9b6] mt-1">Choose what your group tracks daily</p>
          </div>
        </div>
        
        <div className="flex items-center gap-[20px]">
          {selectedActivities.length > 0 ? (
            <button 
              onClick={handleClearSelection}
              className="text-[#1877F2] text-[15px] font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              clear
            </button>
          ) : (
            <button 
              onClick={handleSelectAll}
              className="text-[#1877F2] text-[15px] font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              select
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Content Wrapper */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '14px 16px 110px', width: '100%' }}>
        
      {/* Warning Banner */}
      <div className="mb-[14px] p-[9px] px-[12px] bg-[rgba(239,159,39,0.10)] border-l-[3px] border-[#EF9F27] rounded-r-[8px] flex items-start gap-2">
        <svg className="w-[14px] h-[14px] mt-[1px] text-[#EF9F27] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-[11px] font-medium text-[#EF9F27] leading-[1.3]">
          Changes will affect what students see in their daily tracker.
        </span>
      </div>

      {/* Activity Flat List */}
      <div className="mt-[16px] border-t border-[rgba(255,255,255,0.06)] mb-[24px]">
        {allActivities.map(item => (
          <ActivityRow 
            key={item.id} 
            item={item} 
            categoryColor={item.categoryColor} 
            categoryName={item.categoryName} 
          />
        ))}
      </div>
        {/* Add Custom Activity Button */}
        <div className="flex justify-center">
          <button 
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center gap-2 text-[#1de9b6] hover:bg-[#1de9b6]/10 px-[16px] py-[10px] rounded-[24px] border border-[rgba(29,233,182,0.3)] transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-[13px] font-medium">Add Custom Activity</span>
          </button>
        </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 z-40 bg-[#0b1628] -mx-[16px] px-[16px]">

        
        {/* Save Button */}
        <div>
          <button 
            onClick={handleSaveClick}
            className="block h-[46px] rounded-[12px] text-[14px] font-medium bg-[#1de9b6] text-[#042C53] hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ width: 'calc(100% - 28px)', maxWidth: '400px', margin: '10px auto 14px' }}
          >
            Save Activities
          </button>
        </div>
      </div>
      
      </div> {/* End of Content Wrapper */}

      {/* Floating Bottom Action Sheet for Selection Mode */}
      {selectedActivities.length > 0 && (
        <div className="fixed bottom-[95px] left-[16px] right-[16px] z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-[400px] bg-[#1877F2] rounded-[12px] p-[16px] shadow-[0_8px_30px_rgba(24,119,242,0.3)] pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="flex items-center justify-between mb-[16px]">
              <span className="text-white text-[15px] font-bold">
                selected: {selectedActivities.length} activities
              </span>
              <button 
                onClick={handleClearSelection}
                className="w-[24px] h-[24px] flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.2)] transition-colors text-white"
              >
                <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <button 
              onClick={() => console.log('// TODO: implement assign-to-group flow, spec coming separately')}
              className="w-full h-[46px] flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)] text-white rounded-[8px] text-[15px] font-bold transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              assign
            </button>
          </div>
        </div>
      )}

      {/* Custom Activity Bottom Sheet */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-[rgba(0,0,0,0.6)] animate-in fade-in duration-200"
            onClick={() => setIsCustomModalOpen(false)}
          />
          
          {/* Sheet */}
          <div className="relative w-full max-w-[320px] bg-[#0b1628] rounded-t-[28px] sm:rounded-[28px] p-4 pt-3 pb-[30px] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in duration-200 ease-out shadow-2xl border border-[rgba(255,255,255,0.06)]">
            {/* Drag Handle */}
            <div className="w-[36px] h-[4px] rounded-full bg-[rgba(255,255,255,0.15)] mx-auto mb-[18px]" />
            
            <h2 className="text-white text-[15px] font-medium mb-[20px]">New Custom Activity</h2>
            
            {/* NAME */}
            <div className="mb-[20px]">
              <label className="block text-[#6b7a99] text-[11px] tracking-[0.8px] mb-[8px]">ACTIVITY NAME</label>
              <input 
                type="text"
                placeholder="e.g. Yoga, Pranayama, Cold Shower..."
                maxLength={30}
                value={customForm.name}
                onChange={e => setCustomForm(prev => ({...prev, name: e.target.value}))}
                className="w-full bg-[#112240] border border-[rgba(255,255,255,0.1)] rounded-[10px] p-[12px] px-[14px] text-[14px] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#1de9b6] transition-colors"
              />
            </div>
            
            {/* TYPE */}
            <div className="mb-[20px]">
              <label className="block text-[#6b7a99] text-[11px] tracking-[0.8px] mb-[8px]">ACTIVITY TYPE</label>
              <div className="grid grid-cols-2 gap-[10px]">
                {[
                  { id: 'Count', icon: 'ti-hash' },
                  { id: 'Duration', icon: 'ti-clock' },
                  { id: 'Time', icon: 'ti-clock-hour-4' },
                  { id: 'Yes/No', icon: 'ti-circle-check' }
                ].map(type => {
                  const isSelected = customForm.type === type.id;
                  return (
                    <div 
                      key={type.id}
                      onClick={() => setCustomForm(prev => ({...prev, type: type.id, target: type.id === 'Yes/No' ? '' : prev.target}))}
                      className="relative rounded-[18px] p-[16px] px-[12px] pb-[14px] text-center cursor-pointer transition-all"
                      style={{
                        background: isSelected ? 'rgba(29,233,182,0.06)' : '#112240',
                        border: `1.5px solid ${isSelected ? '#1de9b6' : 'rgba(255,255,255,0.07)'}`
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-[8px] right-[8px] w-[18px] h-[18px] bg-[#1de9b6] rounded-full flex items-center justify-center">
                          <svg className="w-[12px] h-[12px] text-[#042C53]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                      <div 
                        className="w-[36px] h-[36px] mx-auto rounded-[20px] flex items-center justify-center mb-[8px]"
                        style={{ background: isSelected ? 'rgba(29,233,182,0.12)' : 'rgba(255,255,255,0.07)' }}
                      >
                        {type.id === 'Count' ? (
                          <span style={{ fontSize: '11px', fontWeight: '500', color: isSelected ? '#1de9b6' : '#6b7a99' }}>123</span>
                        ) : (
                          getIcon(type.icon, isSelected ? '#1de9b6' : '#6b7a99')
                        )}
                      </div>
                      <span className={`text-[13px] font-medium ${isSelected ? 'text-[#1de9b6]' : 'text-white'}`}>
                        {type.id}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* TARGET */}
            <div className="mb-[20px]">
              <label className="block text-[#6b7a99] text-[11px] tracking-[0.8px] mb-[8px]">TARGET</label>
              <div className="relative">
                <div className="absolute left-[14px] top-[14px]">
                  {getIcon('ti-flag', '#3d4f70')}
                </div>
                <input 
                  type="text"
                  placeholder={
                    customForm.type === 'Count' ? 'Enter target count' :
                    customForm.type === 'Duration' ? 'Enter target duration (mins)' :
                    customForm.type === 'Time' ? 'Enter target time (e.g. 07:00)' :
                    'No target needed'
                  }
                  disabled={customForm.type === 'Yes/No'}
                  value={customForm.target}
                  onChange={e => setCustomForm(prev => ({...prev, target: e.target.value}))}
                  className="w-full bg-[#112240] border border-[rgba(255,255,255,0.06)] rounded-[10px] p-[12px] pl-[40px] pr-[14px] text-[14px] text-white placeholder-[rgba(255,255,255,0.2)] focus:outline-none focus:border-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50 disabled:bg-[#0b1628]"
                />
              </div>
            </div>
            
            {/* Buttons Row */}
            <div className="flex items-center gap-[10px] mt-[20px]">
              <button 
                onClick={() => setIsCustomModalOpen(false)}
                className="flex-1 h-[46px] rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-transparent text-[#6b7a99] text-[14px] font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCustomActivity}
                className="flex-[2] h-[46px] rounded-[12px] bg-[#1de9b6] text-[#042C53] text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:bg-[#1de9b6]/50"
                disabled={!customForm.name.trim()}
              >
                Save Activity
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#112240] rounded-[16px] p-[24px] shadow-2xl max-w-sm w-full border border-[rgba(255,255,255,0.1)] scale-in-center">
            <h3 className="text-[18px] font-bold text-white mb-2">Save activity changes?</h3>
            <p className="text-[13px] text-[#6b7a99] mb-6 leading-relaxed">
              This updates the daily tracker for all students.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#6b7a99] hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSave}
                className="px-4 py-2 text-[13px] font-medium bg-[#1de9b6] text-[#042C53] rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#112240] rounded-[16px] p-[24px] shadow-2xl max-w-sm w-full border border-[rgba(255,255,255,0.1)] scale-in-center relative">
            <div className="w-12 h-12 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#FF4D4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-[18px] font-bold text-white mb-2">Delete Activity?</h3>
            <p className="text-[13px] text-[#6b7a99] mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{activityToDelete.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setActivityToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 h-[40px] text-[13px] font-medium text-[#6b7a99] border border-[rgba(255,255,255,0.1)] hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 h-[40px] flex items-center gap-2 text-[13px] font-medium bg-[#FF4D4D] text-white rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2 bg-[#1de9b6] text-[#042C53] px-5 py-3 rounded-full shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            <span className="text-[13px] font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActivitiesManagement;
