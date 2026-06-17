import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { getRequest } from '../../services/api';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { userDetails } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchNotifications = (pageNum = 1, append = false) => {
    if (!userDetails?.user_id) return;
    
    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    const payload = {
      user_id: userDetails.user_id,
      page_no: pageNum
    };

    getRequest('/student-notification-list', payload, (res) => {
      console.log("Notifications API Response:", res);
      const resData = res?.data;
      if (resData && resData.status === 1) {
        const newData = Array.isArray(resData.data) ? resData.data : (resData.data?.data || []);
        
        if (append) {
          setNotifications(prev => [...prev, ...newData]);
        } else {
          setNotifications(newData);
        }

        // Check if there are more for next page
        if (newData.length < 5) setHasMore(false);
        else setHasMore(true);
      }
      setIsLoading(false);
      setIsFetchingMore(false);
    });
  };

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchNotifications(1, false);
    }
  }, [isOpen]);

  const loadMore = (e) => {
    e.stopPropagation();
    if (isFetchingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[340px] bg-white dark:bg-[#1E293B] shadow-2xl z-[70] flex flex-col"
          >
            {/* Panel Header */}
            <div className="px-6 py-8 border-b border-gray-100 dark:border-[#334155] flex items-center justify-between bg-white dark:bg-[#1E293B] relative">
              <div>
                <h2 className="text-[22px] font-black text-[#0f172a] dark:text-[#F8FAFC] tracking-tight">Updates</h2>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                   <span className="text-[11px] font-bold text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest">Recent Activity</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-[#334155] text-gray-400 dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#475569] hover:text-gray-900 dark:hover:text-[#F8FAFC] transition-all active:scale-95"
                aria-label="Close notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-4 py-8 space-y-4 bg-[#fcfcfc] dark:bg-[#0F172A] custom-scrollbar">
              {isLoading && page === 1 ? (
                <div className="flex flex-col items-center justify-center pt-20 gap-3">
                   <div className="w-8 h-8 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-gray-400 dark:text-[#CBD5E1] text-[13px] font-bold">Checking for updates...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-20 px-8">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-200 dark:text-[#334155]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-400 dark:text-[#94a3b8]">All caught up!</h3>
                  <p className="text-[13px] text-gray-300 dark:text-[#475569] mt-1">No new notifications at the moment.</p>
                </div>
              ) : (
                <>
                  {notifications.map((notif, idx) => {
                    const isRead = String(notif.status) === '1';
                    const timeStr = notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
                    
                    return (
                      <motion.div 
                        key={notif.id || idx} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-5 rounded-[28px] bg-white dark:bg-[#1E293B] shadow-sm border ${isRead ? 'border-transparent dark:border-[#334155]' : 'border-orange-100 dark:border-orange-900/50 bg-orange-50/10 dark:bg-orange-900/10'} relative group hover:shadow-md transition-all cursor-pointer overflow-hidden`}
                      >
                        {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />}
                        <div className="flex gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${isRead ? 'bg-gray-50 dark:bg-[#334155] text-gray-300 dark:text-[#CBD5E1]' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                               <h3 className={`text-[15px] leading-tight ${isRead ? 'font-bold text-gray-500 dark:text-[#94a3b8]' : 'font-black text-[#0f172a] dark:text-[#F8FAFC]'}`}>{notif.heading}</h3>
                               {!isRead && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1.5"></span>}
                            </div>
                            <p className="text-[13px] text-gray-400 dark:text-[#CBD5E1] mt-1.5 font-medium leading-relaxed">{notif.description}</p>
                            <div className="mt-2 flex items-center gap-1">
                              <span className="text-[10px] font-bold text-gray-300 dark:text-[#475569] uppercase tracking-widest">{timeStr}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Load More Button inside Notifications Panel */}
                  {hasMore && notifications.length >= 5 && (
                    <div className="pt-2 pb-10 flex justify-center">
                       <button 
                         onClick={loadMore}
                         disabled={isFetchingMore}
                         className="px-8 py-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-full text-[12px] font-black text-[#1a73e8] dark:text-blue-400 shadow-sm hover:border-[#1a73e8]/20 dark:hover:border-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                       >
                         {isFetchingMore ? (
                           <div className="w-3.5 h-3.5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                         ) : 'Earlier Updates'}
                       </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
