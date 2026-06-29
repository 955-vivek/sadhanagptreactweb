// src/pages/counsellor/GroupPickerList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { searchContentGroups, assignGroupsToScheme } from '../../api/markingSchemes';

const GroupPickerList = ({ schemeId, onAssignSuccess }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchContentGroups(query);
        // Exclude groups already assigned to this exact scheme
        setResults(res.groups.filter(g => g.markingScheme?.id !== schemeId));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [query, schemeId]);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    setIsAssigning(true);
    setError(null);
    try {
      await assignGroupsToScheme(schemeId, Array.from(selectedIds));
      setSelectedIds(new Set());
      setQuery('');
      if (onAssignSuccess) onAssignSuccess();
    } catch (err) {
      setError("Failed to assign groups. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-[rgba(29,233,182,0.2)] rounded-xl bg-[rgba(29,233,182,0.02)]">
      <div className="relative mb-3">
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-teal-600 dark:text-[#1de9b6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="search your groups" 
          className="w-full bg-transparent border border-[rgba(29,233,182,0.3)] text-slate-800 dark:text-white rounded-lg pl-9 pr-3 py-2 text-[13px] outline-none focus:border-teal-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-[#6b7a99]"
        />
      </div>

      <div className="max-h-[200px] overflow-y-auto mb-3 space-y-2 pr-1">
        {isLoading ? (
          <p className="text-[12px] text-slate-500 dark:text-[#6b7a99] text-center py-2">Searching...</p>
        ) : results.length === 0 ? (
          <p className="text-[12px] text-slate-500 dark:text-[#6b7a99] text-center py-2">No groups found</p>
        ) : (
          results.map(g => (
            <div key={g.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors cursor-pointer" onClick={() => toggleSelect(g.id)}>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(g.id)}
                  onChange={() => {}}
                  className="w-4 h-4 accent-teal-500 bg-transparent border-gray-300 dark:border-[#6b7a99] rounded cursor-pointer"
                />
                <span className="text-[13px] font-medium text-slate-800 dark:text-white">{g.name}</span>
              </div>
              
              {g.markingScheme ? (
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-[#112240] px-2 py-1 rounded text-[10px] text-slate-600 dark:text-[#6b7a99]">
                  {g.markingScheme.isLocked && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  )}
                  currently: {g.markingScheme.name}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-[#6b7a99]">{g.memberCount} members</span>
              )}
            </div>
          ))
        )}
      </div>

      {error && <p className="text-red-500 text-[11px] mb-2">{error}</p>}
      
      <button 
        disabled={selectedIds.size === 0 || isAssigning}
        onClick={handleAssign}
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-[13px] py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAssigning ? 'Assigning...' : 'Add selected groups'}
      </button>
      <p className="text-center text-[10px] text-slate-500 dark:text-[#6b7a99] mt-2">
        groups already on another scheme will switch to this one
      </p>
    </div>
  );
};

export default GroupPickerList;
