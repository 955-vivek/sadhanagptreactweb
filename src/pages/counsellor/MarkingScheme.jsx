// src/pages/counsellor/MarkingScheme.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { getSchemes, getSchemeActivities, saveScheme, deleteActivityFromScheme, deleteScheme, toggleSchemeStatus } from '../../api/markingSchemes';
import SchemeGroupsPanel from './SchemeGroupsPanel';
import SchemeActivityPickerModal from './SchemeActivityPickerModal';
import SchemeNameModal from './SchemeNameModal';
import EditChoiceModal from './EditChoiceModal';
import ConfirmModal from '../../components/shared/ConfirmModal';

const MarkingScheme = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);

  // Edit Mode State
  const [editSchemeId, setEditSchemeId] = useState(null);
  const [editModeType, setEditModeType] = useState('fork'); // 'fork' or 'mutate'
  const [isDirty, setIsDirty] = useState(false);
  const [schemeDraft, setSchemeDraft] = useState([]);

  // Modal States
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEditChoiceModal, setShowEditChoiceModal] = useState(null);
  const [schemeActivitiesCache, setSchemeActivitiesCache] = useState({});

  // Confirmation Modal States
  const [deleteSchemeTarget, setDeleteSchemeTarget] = useState(null);
  const [deleteActivityTarget, setDeleteActivityTarget] = useState(null);

  const fetchSchemes = async () => {
    try {
      const res = await getSchemes();
      setSchemes(res.schemes);

      const cache = {};
      for (const s of res.schemes) {
        const actRes = await getSchemeActivities(s.id);
        cache[s.id] = actRes.activities || [];
      }
      setSchemeActivitiesCache(cache);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const getSchemeData = (id) => schemes.find(s => s.id === id) || {};

  const handleCountsChanged = (delta, forceRefresh = false) => {
    if (forceRefresh) {
      fetchSchemes();
    } else {
      setSchemes(prev => prev.map(s => {
        if (s.id === expandedSchemeId) {
          return { ...s, appliedGroupCount: s.appliedGroupCount + delta };
        }
        return s;
      }));
    }
  };

  const handleEditClick = (schemeId, type = 'fork', directDraft = null) => {
    setEditModeType(type);
    setEditSchemeId(schemeId);
    setIsDirty(false);
    if (directDraft) {
      setSchemeDraft([...directDraft]);
    } else if (schemeId === 'new') {
      setSchemeDraft([]);
    } else {
      setSchemeDraft([...(schemeActivitiesCache[schemeId] || [])]);
    }
  };

  const handleEditInitiate = async (scheme) => {
    if (scheme.isSystemDefault) {
      // Use the cached activities for the system default scheme
      const defaultActivitiesArray = schemeActivitiesCache[scheme.id] || [];
      
      const res = await saveScheme('', defaultActivitiesArray, null, true); // Provisional clone
      const newClone = res.scheme;
      
      console.log('DEBUG handleEditInitiate:', { defaultActivitiesArray, newClone });
      
      setSchemes(prev => [...prev, newClone]);
      setSchemeActivitiesCache(prev => ({ ...prev, [newClone.id]: defaultActivitiesArray }));
      
      // Pass the fully constructed draft directly to avoid async state lag
      handleEditClick(newClone.id, 'mutate', defaultActivitiesArray);
    } else {
      setShowEditChoiceModal(scheme.id);
    }
  };

  const handleDeleteSchemeAction = async (schemeId, name) => {
    setDeleteSchemeTarget({ id: schemeId, name });
  };

  const confirmDeleteScheme = async () => {
    if (!deleteSchemeTarget) return;
    await deleteScheme(deleteSchemeTarget.id);
    fetchSchemes();
    setDeleteSchemeTarget(null);
  };

  const handleToggleStatus = async (schemeId, currentStatus) => {
    await toggleSchemeStatus(schemeId, !currentStatus);
    fetchSchemes();
  };

  const handleCancelEdit = async () => {
    if (editSchemeId && editSchemeId !== 'new') {
      const scheme = schemes.find(s => s.id === editSchemeId);
      if (scheme?.isProvisional) {
        await deleteScheme(editSchemeId);
        setSchemes(prev => prev.filter(s => s.id !== editSchemeId));
      }
    }
    setEditSchemeId(null);
    setIsDirty(false);
    setSchemeDraft([]);
  };

  const handleDeleteActivity = async (activityId) => {
    setDeleteActivityTarget(activityId);
  };

  const confirmDeleteActivity = () => {
    if (!deleteActivityTarget) return;
    setSchemeDraft(prev => prev.filter(a => a.id !== deleteActivityTarget));
    setIsDirty(true);
    setDeleteActivityTarget(null);
  };

  const handleAddActivity = (newActivity) => {
    setSchemeDraft(prev => [...prev, newActivity]);
    setIsDirty(true);
    setShowPickerModal(false);
  };

  const handleSaveFlow = () => {
    const schemeObj = schemes.find(s => s.id === editSchemeId);
    if (editModeType === 'mutate' && editSchemeId !== 'new' && !schemeObj?.isProvisional) {
      handleCreateScheme(schemeObj.name); // Skips name modal, passes existing name
    } else {
      setShowNameModal(true);
    }
  };

  const handleCreateScheme = async (name) => {
    // If mutating, pass the scheme ID to update in place. Else pass null to fork.
    const targetId = editModeType === 'mutate' && editSchemeId !== 'new' ? editSchemeId : null;
    await saveScheme(name, schemeDraft, targetId, false);
    setShowNameModal(false);
    setEditSchemeId(null);
    setIsDirty(false);
    setSchemeDraft([]);
    fetchSchemes();
  };

  const renderActivitiesList = (schemeId, isEditing) => {
    let activities = isEditing ? schemeDraft : (schemeActivitiesCache[schemeId] || []);

    activities = activities.slice(0, 3);

    if (activities.length === 0) {
      return (
        <div className="bg-gray-50 dark:bg-[rgba(0,0,0,0.2)] rounded-[8px] p-4 mb-[16px] text-center text-[11px] text-[#6b7a99]">
          No activities configured yet.
        </div>
      );
    }

    return (
      <div className="bg-gray-50 dark:bg-[rgba(0,0,0,0.2)] rounded-[8px] p-[10px] mb-[16px]">
        {activities.map((act, idx) => (
          <div key={act.id} className={`flex justify-between items-center ${idx < activities.length - 1 ? 'border-b border-gray-300 dark:border-[rgba(255,255,255,0.05)] pb-2 mb-2' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-[12px]">{act.icon}</span>
              <span className="text-[11px] font-normal text-gray-500 dark:text-[#8899bb]">{act.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6]">{act.maxMarks} pts</div>
                <div className="text-[10px] font-normal text-gray-400 dark:text-[#6b7a99]">max {act.maxMarks} pts</div>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleDeleteActivity(act.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#6b7a99] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEditFooter = () => (
    <div className="mt-auto space-y-3">
      <button
        onClick={() => setShowPickerModal(true)}
        className="w-full py-2.5 rounded-[8px] border border-dashed border-[#1de9b6]/50 text-[#1de9b6] text-[12px] font-medium hover:bg-[#1de9b6]/10 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Add marking scheme for activity
      </button>
      <div className="flex gap-2">
        <button
          onClick={handleCancelEdit}
          className="flex-1 py-2 rounded-[8px] bg-[rgba(255,255,255,0.05)] text-white text-[12px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveFlow}
          disabled={!isDirty}
          className="flex-1 py-2 rounded-[8px] bg-[#1de9b6] text-[#042C53] text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1628] font-sans pb-28 transition-colors duration-300 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b1628]/80 backdrop-blur-md border-b border-gray-300 dark:border-[#112240] flex items-center justify-between px-6 py-4 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#6b7a99] hover:bg-gray-50 dark:hover:bg-[#112240] active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[15px] font-medium text-[#0f172a] dark:text-[#ffffff] leading-none tracking-tight">Marking Scheme</h1>
            <p className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6] mt-1">Manage grading and evaluation criteria</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">

          {/* Dynamic Schemes (Default + Configured Customs) */}
          {schemes.map(scheme => {
            const isEditing = editSchemeId === scheme.id;
            const isEnabled = scheme.isEnabled !== false;
            const cardClasses = `relative bg-white dark:bg-[#112240] rounded-[14px] p-[16px] shadow-sm flex flex-col transition-all border-[1.5px] ${isEditing ? 'border-amber-400 dark:border-amber-500' : (isEnabled ? 'border-teal-500 dark:border-[#1de9b6]' : 'border-slate-200 dark:border-[rgba(255,255,255,0.05)]')} ${!isEnabled ? 'opacity-60 grayscale-[20%]' : ''}`;

            return (
              <div key={scheme.id} className={cardClasses}>

                {/* Top section */}
                <div className="flex items-start justify-between mb-[16px]">
                  <div className="flex items-center gap-[12px]">
                    <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${scheme.isSystemDefault ? 'bg-teal-50 dark:bg-[rgba(29,233,182,0.12)] text-teal-500 dark:text-[#1de9b6]' : 'bg-purple-50 dark:bg-[rgba(127,119,221,0.15)] text-purple-500 dark:text-[#AFA9EC]'}`}>
                      <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {scheme.isSystemDefault ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-medium text-[13px] text-[#0f172a] dark:text-[#ffffff] leading-tight">{scheme.name}</h2>
                      <p className="text-[11px] font-normal text-gray-500 dark:text-[#6b7a99] mt-0.5">{scheme.isSystemDefault ? 'Standard marking criteria' : 'Custom grading rules'}</p>
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      {!scheme.isSystemDefault && (
                        <button
                          onClick={() => handleToggleStatus(scheme.id, isEnabled)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-teal-500 dark:bg-[#1de9b6]' : 'bg-gray-200 dark:bg-slate-700'}`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-1.5' : '-translate-x-1.5'}`} />
                        </button>
                      )}
                      {isEnabled && !scheme.isSystemDefault && (
                        <button onClick={() => handleDeleteSchemeAction(scheme.id, scheme.name)} className="text-[14px] text-gray-400 hover:text-red-500 transition-colors p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                      {(scheme.isSystemDefault || isEnabled) && (
                        <button onClick={() => handleEditInitiate(scheme)} className="text-[11px] font-medium text-[#6b7a99] hover:text-[#1de9b6] transition-colors p-1 ml-1">
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Application Chip Row */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[rgba(255,255,255,0.03)] border border-gray-300 dark:border-[rgba(255,255,255,0.05)] rounded-[8px] p-[8px] mb-[16px]">
                  <div className={`flex items-center gap-2 ${scheme.isSystemDefault ? 'text-teal-600 dark:text-[#1de9b6]' : 'text-slate-500 dark:text-[#6b7a99]'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span className="text-[12px] font-semibold">Applied to {scheme.appliedGroupCount || 0} groups</span>
                  </div>
                  {!isEditing && isEnabled && (
                    <button
                      onClick={() => setExpandedSchemeId(expandedSchemeId === scheme.id ? null : scheme.id)}
                      className="text-[12px] font-medium text-teal-600 dark:text-[#1de9b6] hover:underline"
                    >
                      {expandedSchemeId === scheme.id ? 'Hide groups' : 'View groups'}
                    </button>
                  )}
                </div>

                {/* Scheme Groups Panel Inline */}
                {!isEditing && isEnabled && expandedSchemeId === scheme.id && (
                  <div className="mb-[16px]">
                    <SchemeGroupsPanel schemeId={scheme.id} isLocked={scheme.isLocked} onCountsChanged={handleCountsChanged} />
                  </div>
                )}

                {/* Preview block */}
                {renderActivitiesList(scheme.id, isEditing)}

                {/* Footer */}
                {isEditing ? renderEditFooter() : (
                  <div className="mt-auto flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-[20px] text-[10px] font-normal transition-colors ${scheme.isSystemDefault ? 'bg-teal-100 dark:bg-[#1de9b6] text-teal-800 dark:text-[#042C53]' : 'bg-gray-100 dark:bg-[rgba(255,255,255,0.07)] text-gray-500 dark:text-[#6b7a99]'}`}>
                      {scheme.isSystemDefault ? 'System Default' : 'Custom'}
                    </span>
                    <div
                      onClick={() => navigate(scheme.isSystemDefault ? '/counsellor/marking-scheme/default' : `/counsellor/marking-scheme/${scheme.id}`)}
                      className="flex items-center cursor-pointer text-teal-600 dark:text-[#1de9b6] font-normal text-[11px] hover:opacity-80 transition-opacity"
                    >
                      View all
                      <svg className="w-[14px] h-[14px] ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* New Custom Scheme (+ Create) Template OR Active Edit */}
          {editSchemeId === 'new' ? (
            <div className="relative bg-white dark:bg-[#112240] rounded-[14px] p-[16px] shadow-sm flex flex-col transition-all border-[1.5px] border-amber-400 dark:border-amber-500">
              <div className="flex items-start justify-between mb-[16px]">
                <div className="flex items-center gap-[12px]">
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-purple-50 dark:bg-[rgba(127,119,221,0.15)] flex items-center justify-center shrink-0 text-purple-500 dark:text-[#AFA9EC]">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-medium text-[13px] text-[#0f172a] dark:text-[#ffffff] leading-tight">New Custom Scheme</h2>
                    <p className="text-[11px] font-normal text-gray-500 dark:text-[#6b7a99] mt-0.5">Creating new grading rules</p>
                  </div>
                </div>
              </div>
              {renderActivitiesList('new', true)}
              {renderEditFooter()}
            </div>
          ) : (
            <div className="relative group bg-white dark:bg-[#112240] rounded-[14px] p-[16px] shadow-sm flex flex-col transition-all border-[1.5px] border-transparent">
              <div className="flex items-center gap-[12px] mb-[16px]">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-purple-50 dark:bg-[rgba(127,119,221,0.15)] flex items-center justify-center shrink-0 text-purple-500 dark:text-[#AFA9EC]">
                  <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="font-medium text-[13px] text-[#0f172a] dark:text-[#ffffff] leading-tight">Custom Scheme</h2>
                  <p className="text-[11px] font-normal text-gray-500 dark:text-[#6b7a99] mt-0.5">Create your own grading rules</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <svg className="w-[28px] h-[28px] text-purple-400 dark:text-[#AFA9EC] opacity-60 mb-[12px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-[11px] font-normal text-gray-500 dark:text-[#6b7a99] text-center max-w-[180px]">
                  Build a personalized scheme to match your goals
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-[20px] text-[10px] font-normal bg-gray-100 dark:bg-[rgba(255,255,255,0.07)] text-gray-500 dark:text-[#6b7a99]">
                  New
                </span>
                {editSchemeId === null && (
                  <button
                    onClick={() => handleEditClick('new', 'fork')}
                    className="flex items-center font-medium text-[12px] text-[#1de9b6] hover:opacity-80 transition-opacity"
                  >
                    + Create
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {showEditChoiceModal && (
        <EditChoiceModal
          schemeName={schemes.find(s => s.id === showEditChoiceModal)?.name}
          onClose={() => setShowEditChoiceModal(null)}
          onEditInPlace={() => {
            handleEditClick(showEditChoiceModal, 'mutate');
            setShowEditChoiceModal(null);
          }}
          onFork={() => {
            handleEditClick(showEditChoiceModal, 'fork');
            setShowEditChoiceModal(null);
          }}
        />
      )}

      {showPickerModal && (
        <SchemeActivityPickerModal
          onClose={() => setShowPickerModal(false)}
          onApply={handleAddActivity}
        />
      )}

      {showNameModal && (
        <SchemeNameModal
          onClose={() => setShowNameModal(false)}
          onCreate={handleCreateScheme}
        />
      )}

      {/* Delete Scheme Modal */}
      <ConfirmModal
        isOpen={!!deleteSchemeTarget}
        onClose={() => setDeleteSchemeTarget(null)}
        onConfirm={confirmDeleteScheme}
        title="Delete Marking Scheme"
        description={`Delete '${deleteSchemeTarget?.name}'? This will permanently remove this scheme and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Activity Modal */}
      <ConfirmModal
        isOpen={!!deleteActivityTarget}
        onClose={() => setDeleteActivityTarget(null)}
        onConfirm={confirmDeleteActivity}
        title="Remove Activity"
        description="Are you sure you want to remove this activity from the scheme?"
        confirmText="Remove"
        cancelText="Cancel"
      />

    </div>
  );
};

export default MarkingScheme;
