import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest } from '../../../services/api';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';

const IrregularMentees = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [irregularMentees, setIrregularMentees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIrregularMentees();
  }, []);

  const fetchIrregularMentees = () => {
    setIsLoading(true);
    getRequest('/irregular-mentees', { user_id: userDetails.user_id }, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        setIrregularMentees(res.data || []);
      } else {
        setError(res?.message || 'Failed to fetch irregular mentees');
      }
      setIsLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-[84px]">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6 sticky top-0 bg-[#f8fafc] z-20">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-[#64748b]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[20px] font-black text-[#0f172a]">Irregular Mentees</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="px-6">
          <p className="text-gray-400 font-bold text-sm mb-6 uppercase tracking-widest">
            Attention Required ({irregularMentees.length})
          </p>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-bold">Analyzing sadhana patterns...</p>
              </motion.div>
            ) : irregularMentees.length > 0 ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {irregularMentees.map((mentee, index) => (
                  <motion.div
                    key={mentee.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/counsellor/mentee/${mentee.user_id}`)}
                    className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-400/70 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(mentee.name)}&background=random`}
                        className="w-14 h-14 rounded-2xl object-cover border border-gray-100"
                        alt={mentee.name}
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[16px] text-[#0f172a] truncate group-hover:text-blue-600 transition-colors">{mentee.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-tight">
                          {mentee.irregularity_reason || "Needs Attention"}
                        </span>
                      </div>
                    </div>

                    <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 bg-green-50 rounded-[32px] flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-[#0f172a] mb-2">Everything's Perfect!</h3>
                <p className="text-gray-400 font-bold px-10">All your mentees are consistent with their sadhana targets. Keep up the good work!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <CounsellorBottomNavigation />
    </div>
  );
};

export default IrregularMentees;
