// src/pages/counsellor/SchemeGroupsPanel.jsx
import React, { useState, useEffect } from 'react';
import { getSchemeGroups, removeGroupFromScheme } from '../../api/markingSchemes';
import GroupPickerList from './GroupPickerList';

const SchemeGroupsPanel = ({ schemeId, isLocked, onCountsChanged }) => {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState(null);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await getSchemeGroups(schemeId);
      setGroups(res.groups);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [schemeId]);

  const handleRemove = async (groupId) => {
    const backup = [...groups];
    setGroups(groups.filter(g => g.id !== groupId));
    onCountsChanged(-1); // Optimistically decrement
    
    try {
      await removeGroupFromScheme(schemeId, groupId);
    } catch (err) {
      setGroups(backup); // Rollback on failure
      onCountsChanged(1);
      setError("Failed to remove group.");
    }
  };

  const handleAssignSuccess = () => {
    setShowPicker(false);
    fetchGroups();
    onCountsChanged(0, true); // Force a refetch in the parent to update chips correctly
  };


  return (
    <div className="mt-4 border-t border-gray-300 dark:border-[rgba(255,255,255,0.05)] pt-4 animate-in fade-in slide-in-from-top-2">
      <h3 className="text-[12px] font-semibold text-slate-800 dark:text-white mb-3">Groups using this scheme</h3>
      
      {error && <p className="text-red-500 text-[11px] mb-2">{error}</p>}
      
      {isLoading ? (
        <p className="text-[12px] text-slate-500 dark:text-[#6b7a99]">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-[12px] text-slate-500 dark:text-[#6b7a99] italic">No groups are using this scheme yet.</p>
      ) : (
        <div className="space-y-2">
          {groups.map(g => (
            <div key={g.id} className="flex items-center justify-between bg-slate-50 dark:bg-[rgba(255,255,255,0.03)] px-3 py-2 rounded-lg border border-gray-300 dark:border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-teal-100 dark:bg-[rgba(29,233,182,0.15)] flex items-center justify-center text-teal-600 dark:text-[#1de9b6]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <span className="text-[13px] font-medium text-slate-800 dark:text-gray-200">{g.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 dark:text-[#6b7a99]">{g.memberCount} members</span>
                <button onClick={() => handleRemove(g.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <button 
          onClick={() => setShowPicker(!showPicker)} 
          className="flex items-center gap-1 text-[12px] font-medium text-teal-600 dark:text-[#1de9b6] hover:opacity-80 transition-opacity"
        >
          <svg className={`w-4 h-4 transition-transform ${showPicker ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          add groups to this scheme
        </button>
        {showPicker && (
          <GroupPickerList schemeId={schemeId} onAssignSuccess={handleAssignSuccess} />
        )}
      </div>
    </div>
  );
};

export default SchemeGroupsPanel;
