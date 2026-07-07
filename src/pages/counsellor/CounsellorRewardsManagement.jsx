import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import ThemeToggle from '../../components/shared/ThemeToggle';

const CounsellorRewardsManagement = () => {
  const navigate = useNavigate();

  const [activeRewards, setActiveRewards] = useState([
    {
      id: 1,
      name: 'Haridash Thakur',
      activity: 'Chanting',
      target: '16 rounds / 12 days',
      iconUrl: 'none', // Use inline SVG
      iconBg: 'bg-[#fff7ed]',
      iconColor: 'text-[#f97316]'
    },
    {
      id: 2,
      name: 'Raghunath Das',
      activity: 'Reading',
      target: '30 mins / 7 days',
      iconUrl: 'none',
      iconBg: 'bg-[#faf5ff]',
      iconColor: 'text-[#a855f7]'
    }
  ]);

  const [formData, setFormData] = useState({
    rewardName: '',
    activity: 'Chanting (Japa)',
    count: '',
    days: '',
    threshold: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Handle save logic
    console.log("Saving Reward:", formData);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F172A] font-sans pb-32 relative overflow-x-hidden transition-colors duration-300">
      <div className="w-full max-w-md mx-auto relative h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6 bg-[#f8fafc] dark:bg-[#0F172A] sticky top-0 z-10 w-full transition-colors duration-300">
          <button 
            onClick={() => navigate(-1)} 
            className="w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] shadow-sm flex items-center justify-center text-[#0f172a] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#334155] active:scale-95 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          
          <h1 className="text-[20px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight transition-colors duration-300">Rewards Management</h1>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              className="relative w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] shadow-sm flex items-center justify-center text-[#0f172a] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#334155] active:scale-95 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-[#1E293B]"></span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 space-y-8 pb-10">
          
          {/* Active Rewards Section */}
          <section>
            <h2 className="text-[18px] font-bold text-[#0f172a] mb-4">Active Rewards</h2>
            <div className="space-y-4">
              {activeRewards.map(reward => (
                <div key={reward.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-400/70 flex flex-col relative group">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-full ${reward.iconBg} flex items-center justify-center ${reward.iconColor} shrink-0`}>
                      {reward.id === 1 ? (
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582c.299.12.496.435.496.786V8a5.002 5.002 0 01-4 4.898v3.102H13a1 1 0 110 2H7a1 1 0 110-2h1.5v-3.102A5.002 5.002 0 014.5 8V6.691c0-.351.197-.666.496-.786L9 4.323V3a1 1 0 011-1zm-3.5 5.5v2.5a3.5 3.5 0 107 0V7.5L10 6.1 6.5 7.5z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-16 border-r border-[#f1f5f9]">
                      <h3 className="text-[16px] font-bold text-[#0f172a] truncate">{reward.name}</h3>
                      <p className="text-[13px] text-gray-400 mt-0.5">Activity: {reward.activity}</p>
                      <div className="mt-2 inline-flex">
                        <span className="px-3 py-1 rounded-full bg-[#eff6ff] text-[#3b82f6] text-[12px] font-bold">
                          {reward.target}
                        </span>
                      </div>
                    </div>
                    {/* Action Buttons (Absolute right or flex-end) */}
                    <div className="flex flex-col gap-2 shrink-0 absolute right-5 top-5">
                      <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-[#fef2F2] flex items-center justify-center text-red-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Add New Reward Form */}
          <section>
            <h2 className="text-[18px] font-bold text-[#0f172a] mb-4">Add New Reward</h2>
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-400/70 space-y-6">
              
              {/* Reward Name */}
              <div>
                <label className="block text-[14px] font-medium text-[#1e293b] mb-2">Reward Name</label>
                <input 
                  type="text" 
                  name="rewardName"
                  value={formData.rewardName}
                  onChange={handleChange}
                  placeholder="e.g. Early Riser Badge" 
                  className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] placeholder:text-gray-300 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                />
              </div>

              {/* Choose Activity */}
              <div>
                <label className="block text-[14px] font-medium text-[#1e293b] mb-2">Choose Activity</label>
                <div className="relative">
                  <select 
                    name="activity"
                    value={formData.activity}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] appearance-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all bg-white"
                  >
                    <option value="Chanting (Japa)">Chanting (Japa)</option>
                    <option value="Reading">Reading</option>
                    <option value="Meditation">Meditation</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Consistency Target */}
              <div>
                <label className="block text-[14px] font-medium text-[#1e293b] mb-2">Consistency Target</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type="number" 
                      name="count"
                      value={formData.count}
                      onChange={handleChange}
                      placeholder="Count" 
                      className="w-full border border-gray-300 rounded-2xl px-5 pl-5 pr-14 py-3.5 text-[15px] text-[#0f172a] placeholder:text-gray-300 focus:border-[#1a73e8] outline-none transition-all"
                    />
                    <span className="absolute right-4 top-[14px] text-[12px] text-gray-400 font-medium">Daily</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="days"
                      value={formData.days}
                      onChange={handleChange}
                      placeholder="Days" 
                      className="w-full border border-gray-300 rounded-2xl px-5 pl-5 pr-20 py-3.5 text-[15px] text-[#0f172a] placeholder:text-gray-300 focus:border-[#1a73e8] outline-none transition-all"
                    />
                    <span className="absolute right-4 top-[14px] text-[12px] text-gray-400 font-medium">Duration</span>
                  </div>
                </div>
                <p className="text-[12px] text-gray-400 mt-2 ml-1">e.g. 16 rounds for 12 days</p>
              </div>

              {/* Minimum Count / Threshold */}
              <div>
                <label className="block text-[14px] font-medium text-[#1e293b] mb-2">Minimum Count / Threshold</label>
                <input 
                  type="text" 
                  name="threshold"
                  value={formData.threshold}
                  onChange={handleChange}
                  placeholder="e.g. Minimum 10 rounds daily" 
                  className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] placeholder:text-gray-300 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="w-1/2 py-4 rounded-full border border-gray-300 text-[#0f172a] font-bold text-[16px] hover:bg-gray-50 active:scale-95 transition-all text-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="w-1/2 py-4 rounded-full bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold text-[16px] shadow-lg shadow-[#1a73e8]/30 active:scale-[0.98] transition-all text-center"
                >
                  Save Reward
                </button>
              </div>

            </div>
          </section>

        </div>

      </div>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorRewardsManagement;
