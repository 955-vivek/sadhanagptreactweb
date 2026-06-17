import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPushNotifications } from '../../utils/notificationUtils';

const ReminderPopup = ({ userId, onGranted, onDenied }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return; // Notifications not supported
      }

      // Check if user dismissed it previously
      const isDismissed = localStorage.getItem('hide_notification_reminder_popup') === 'true';
      if (isDismissed) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        // If no active subscription, show the popup
        if (!subscription) {
          // Small delay so it doesn't instantly snap in their face on load
          const timer = setTimeout(() => setIsVisible(true), 1500);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error checking subscription in popup:', error);
      }
    };

    checkStatus();
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_notification_reminder_popup', 'true');
    }
    setIsVisible(false);
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      await subscribeToPushNotifications(userId);
      window.dispatchEvent(new Event('push_subscription_changed'));
      setIsVisible(false);
      onGranted?.('Reminders enabled successfully');
    } catch (error) {
      console.error(error);
      onDenied?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#1E293B] rounded-[24px] p-6 w-full max-w-sm shadow-2xl relative"
          >
            {/* Close X button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex justify-center mb-4 text-[#1a73e8]">
               <svg className="w-12 h-12 bg-blue-50 dark:bg-[#334155] rounded-full p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>

            <h3 className="text-[20px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] text-center mb-2">Enable Reminders</h3>
            <p className="text-[#64748b] dark:text-[#CBD5E1] text-[14px] text-center mb-6 font-medium">
              Stay updated with weekly sadhana reminders so you never miss a day.
            </p>

            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full py-3.5 bg-[#1a73e8] text-white font-bold rounded-xl hover:bg-[#155fc3] transition-colors shadow-lg shadow-[#1a73e8]/20 flex justify-center items-center mb-4"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Enable'}
            </button>

            <label className="flex items-center justify-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium select-none">Don't show again</span>
            </label>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReminderPopup;
