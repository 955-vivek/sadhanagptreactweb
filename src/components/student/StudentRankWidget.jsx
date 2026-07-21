import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { getRequest } from '../../services/api';

const MedalIcon = ({ rank }) => {
  const medalColors = {
    1: { ribbon: '#3b82f6', medal: '#FBBF24', text: '#374151' },
    2: { ribbon: '#3b82f6', medal: '#9CA3AF', text: '#374151' },
    3: { ribbon: '#3b82f6', medal: '#D97706', text: '#374151' }
  };
  const colors = medalColors[rank] || medalColors[1];

  return (
    <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 13L5 22l7-4 7 4-2.5-9" fill={colors.ribbon} />
      <circle cx="12" cy="8" r="7" fill={colors.medal} />
      <text x="12" y="11.5" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="900" fill={colors.text} textAnchor="middle">{rank}</text>
    </svg>
  );
};

const StudentRankWidget = ({ onClose }) => {
  const { userDetails } = useOutletContext();
  const [filterType, setFilterType] = useState('global');
  const [rankPeriod, setRankPeriod] = useState('current_week');
  const [isExpanded, setIsExpanded] = useState(false);
  const [ranks, setRanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [filterType, rankPeriod]);

  useEffect(() => {
    if (userDetails?.user_id) {
      fetchRanks();
    }
  }, [filterType, rankPeriod, userDetails]);

  const fetchRanks = () => {
    setIsLoading(true);
    const params = {
      ignore_50_rule: true,
      is_student_group_rank: filterType === 'group',
      rank_period: rankPeriod,
      is_personal_rank: true
    };
    
    getRequest('/student-rank', params, (res) => {
      if (res?.data?.status === 1) {
        setRanks(res.data.data.ranks || []);
      }
      setIsLoading(false);
    });
  };

  const topCount = filterType === 'global' ? 5 : 3;
  let displayRanks = [];
  
  if (isExpanded) {
    displayRanks = ranks;
  } else {
    const topList = ranks.slice(0, topCount);
    const myRankObj = ranks.find(r => String(r.student_id) === String(userDetails?.user_id));
    displayRanks = [...topList];
    if (myRankObj && myRankObj.rank > topCount) {
      displayRanks.push(myRankObj);
    }
  }

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col bg-white dark:bg-slate-800 shadow-sm mb-6">
        <div className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10M17 4v8a5 5 0 0 1 -10 0v-8M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /></svg>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[14px] text-gray-800 dark:text-gray-100 leading-tight">
                  Your Rank
                </h3>
                <div className="relative inline-block w-fit">
                  <select 
                    value={rankPeriod}
                    onChange={(e) => setRankPeriod(e.target.value)}
                    className="text-[10px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 outline-none cursor-pointer px-2 py-0.5 rounded flex items-center font-bold appearance-none pr-5 border border-gray-200 dark:border-gray-600"
                  >
                    <option value="current_week">This Week</option>
                    <option value="last_week">Last Week</option>
                  </select>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setFilterType('global')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${filterType === 'global' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Global
              </button>
              <button
                onClick={() => setFilterType('group')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${filterType === 'group' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Group
              </button>
            </div>
          </div>
          
          <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 italic px-1 mt-1">Note: Rank updates every morning</p>
        </div>

        {isLoading ? (
          <div className="py-4 text-center text-sm text-gray-400">Loading ranks...</div>
        ) : (
          <ul className="space-y-3 flex-1 overflow-hidden">
            {displayRanks.length > 0 ? displayRanks.map((rankData, index) => {
              const isMe = String(rankData.student_id) === String(userDetails?.user_id);
              const rank = rankData.rank;
              
              return (
                <li key={index} className={`flex items-center justify-between gap-4 text-sm font-medium px-2 py-2 rounded-xl transition-colors ${isMe ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200 dark:ring-blue-800/50' : 'bg-transparent dark:bg-[#202736]'}`}>
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-6 flex justify-center items-center shrink-0">
                      {rankData.rank <= 3 ? (
                        <div className="w-[24px] h-[24px] flex items-center justify-center">
                          <MedalIcon rank={rankData.rank} />
                        </div>
                      ) : (
                        <span className={`text-[12px] font-bold ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'}`}>#{rankData.rank}</span>
                      )}
                    </div>
                    
                    <div className={`w-7 h-7 rounded-full flex justify-center items-center shrink-0 ${isMe ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-slate-200 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                      <span className="text-[12px] font-bold uppercase">{rankData.student_name.charAt(0)}</span>
                    </div>

                    <span className={`truncate capitalize ${isMe ? 'text-blue-800 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-200 font-semibold'}`}>
                      {rankData.student_name} {isMe ? '(You)' : ''}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold whitespace-nowrap ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {rankData.percentage}%
                  </span>
                </li>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Add a Mentor to see your rank!
                </p>
              </div>
            )}
          </ul>
        )}
      </div>
    </>
  );
};

export default StudentRankWidget;
