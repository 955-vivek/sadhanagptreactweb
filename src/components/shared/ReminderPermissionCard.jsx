import React, { useState, useEffect } from 'react';
import { postRequest } from '../../services/api';
import { subscribeToPushNotifications } from '../../utils/notificationUtils';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'push_reminders_granted';

const ReminderPermissionCard = ({ userId, onGranted, onDenied }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const checkSubscriptionStatus = async () => {
    // Browser doesn't support notifications → hide
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsVisible(false);
      return;
    }
    
    // Permission was permanently denied → hide
    if (Notification.permission === 'denied') {
      setIsVisible(false);
      return;
    }

    // Immediate UI update from localStorage
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setIsEnabled(true);
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setIsEnabled(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        setIsEnabled(false);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error verifying push subscription:', error);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();

    window.addEventListener('push_subscription_changed', checkSubscriptionStatus);
    return () => {
      window.removeEventListener('push_subscription_changed', checkSubscriptionStatus);
    };
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleAllow = async () => {
  setLoading(true);
  try {
    const isSuccess = await subscribeToPushNotifications(userId);
    if (isSuccess) {
      setIsEnabled(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      window.dispatchEvent(new Event('push_subscription_changed'));
      onGranted?.('Reminders enabled successfully');
    } else {
      onDenied?.('User denied or skipped permission');
    }
  } catch (error) {
    console.error('Push notification error:', error);
    let errorMessage = error.message || 'Failed to subscribe';
    
    // Handle browser-specific push service blocks (e.g., Brave Browser, Ungoogled Chromium, Incognito)
    if (errorMessage.toLowerCase().includes('push service error')) {
      errorMessage = 'Browser blocked push service. If using Brave, please enable "Use Google services for push messaging" in Settings > Privacy, or try Chrome/Edge.';
    }
    
    onDenied?.(errorMessage);
  } finally {
    setLoading(false);
  }
};


  const handleDisable = async () => {
    setLoading(true);
    try {
      const readyRegistration = await navigator.serviceWorker.ready;
      const subscription = await readyRegistration.pushManager.getSubscription();
      
      console.log('Existing subscription before unsubscribe:', subscription);

      // Step 1: Browser-side unsubscribe
      if (subscription) {
        const successful = await subscription.unsubscribe();
        console.log('Result of subscription.unsubscribe():', successful);
        
        const checkSub = await readyRegistration.pushManager.getSubscription();
        console.log('Subscription after unsubscribe:', checkSub);
        
        if (checkSub !== null) {
          throw new Error('Browser failed to remove push subscription');
        }
      } else {
        console.log('No active browser subscription found.');
      }
      
      // Step 2: Backend unsubscribe — remove subscription records from DB
      if (userId) {
        await new Promise((resolve, reject) => {
          postRequest('/notifications-unsubscribe', { user_id: userId }, (response) => {
            console.log('Backend unsubscribe API response:', response);
            
            if (response?.data?.status === 1 || response?.status === 200) {
              resolve();
            } else {
              // Backend failed but browser unsubscribe already succeeded,
              // so we still proceed (notifications won't arrive without a browser subscription)
              console.warn('Backend unsubscribe returned non-success, but browser is already unsubscribed.');
              resolve();
            }
          });
        });
      }

      // Step 3: Update UI state
      localStorage.removeItem(STORAGE_KEY);
      setIsEnabled(false);
      setShowConfirmModal(false);
      window.dispatchEvent(new Event('push_subscription_changed'));
      onGranted?.('Reminders disabled successfully'); 

      // Final Validation Log
      const finalCheck = await readyRegistration.pushManager.getSubscription();
      console.log('Final Validation - Current Subscription:', finalCheck);

    } catch (error) {
      console.error('Error unsubscribing:', error);
      onDenied?.(error.message || 'Failed to disable reminders');
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="px-6 mt-2 mb-4">
        <div className={`border shadow-sm rounded-[16px] p-4 flex items-center justify-between transition-colors duration-300 ${isEnabled ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50' : 'bg-white dark:bg-[#1E293B] border-[#1a73e8]/20 dark:border-[#334155]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-[#eff6ff] dark:bg-[#334155] text-[#1a73e8] dark:text-[#CBD5E1]'}`}>
              {isEnabled ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-bold text-sm transition-colors ${isEnabled ? 'text-green-800 dark:text-green-400' : 'text-[#0f172a] dark:text-[#F8FAFC]'}`}>
                {isEnabled ? 'Reminders Enabled' : 'Enable Reminders'}
              </p>
              <p className={`text-[11px] font-medium leading-tight transition-colors ${isEnabled ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-[#94a3b8]'}`}>
                {isEnabled ? 'You will receive weekly push notifications' : 'Get weekly push notifications'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => isEnabled ? setShowConfirmModal(true) : handleAllow()}
            disabled={loading}
            className={`px-4 py-2 text-white text-xs font-bold rounded-full transition-all shadow-md active:scale-[0.96] disabled:opacity-70 flex-shrink-0 min-w-[72px] flex justify-center ${
              isEnabled 
                ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' 
                : 'bg-[#1a73e8] hover:bg-[#155fc3] shadow-[#1a73e8]/20'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isEnabled ? 'Disable' : 'Allow'
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B] rounded-[24px] p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-[20px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] mb-2">Disable notifications?</h3>
              <p className="text-[#64748b] dark:text-[#CBD5E1] text-[15px] mb-6 font-medium">
                You will no longer receive weekly push notifications from SadhnaGPT.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-[#F8FAFC] font-bold rounded-xl hover:bg-[#e2e8f0] dark:hover:bg-[#475569] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Disable'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReminderPermissionCard;
