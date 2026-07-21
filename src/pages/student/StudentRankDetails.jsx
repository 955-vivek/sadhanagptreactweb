import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getRequest } from '../../services/api';
import BottomNavigation from '../../components/student/BottomNavigation';

const MedalIcon = ({ rank }) => {
  const colors = {
    1: 'text-yellow-500 dark:text-yellow-400',
    2: 'text-gray-400 dark:text-gray-300',
    3: 'text-amber-700 dark:text-amber-600'
  };
  return (
    <svg className={`w-full h-full ${colors[rank] || 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 15.22l-5.3 2.78 1.01-5.9L3.43 7.82l5.92-.86L12 1.63l2.65 5.33 5.92.86-4.28 4.28 1.01 5.9L12 15.22z" />
    </svg>
  );
};

const StudentRankDetails = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [ranks, setRanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (userDetails?.user_id) {
      fetchRanks();
    }
  }, [userDetails?.user_id]);

  const fetchRanks = () => {
    setIsLoading(true);
    const params = {
      ignore_50_rule: true,
      is_student_group_rank: true
    };
    
    getRequest('/student-rank', params, (res) => {
      if (res?.data?.status === 1) {
        setRanks(res.data.data.ranks || []);
      }
      setIsLoading(false);
    });
  };

  const totalPages = Math.ceil(ranks.length / limit);
  const paginatedData = ranks.slice((page - 1) * limit, page * limit);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[18px] font-black text-gray-800 dark:text-gray-100 leading-tight">Group Ranks</h1>
            <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400">Students under your Mentor</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-6 space-y-3 max-w-3xl mx-auto w-full">
        {isLoading ? (
          <div className="py-10 text-center text-sm font-bold text-gray-400">Loading...</div>
        ) : ranks.length === 0 ? (
          <div className="py-10 text-center text-sm font-bold text-gray-400">No ranks available</div>
        ) : (
          paginatedData.map((student, index) => {
            const isMe = String(student.student_id) === String(userDetails?.user_id);
            return (
              <div key={index} className={`flex items-center p-4 border rounded-2xl transition-all ${isMe ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                {/* Rank */}
                <div className="w-8 h-8 flex items-center justify-center mr-4">
                  {student.rank <= 3 ? (
                    <MedalIcon rank={student.rank} />
                  ) : (
                    <span className={`font-bold ${isMe ? 'text-blue-600' : 'text-gray-500'}`}>{student.rank}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 truncate mr-3">
                  <h3 className={`font-bold truncate ${isMe ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>
                    {student.student_name} {isMe && '(You)'}
                  </h3>
                </div>

                {/* Score */}
                <div className="text-right shrink-0 flex flex-col items-end">
                  <span className={`font-bold ${isMe ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {student.percentage}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 mt-2 max-w-3xl mx-auto w-full mb-6">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors"
          >
            <span>&larr;</span> Prev
          </button>
          
          <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors"
          >
            Next <span>&rarr;</span>
          </button>
        </div>
      )}
      
      <BottomNavigation />
    </div>
  );
};

export default StudentRankDetails;
