import { useNavigate } from 'react-router-dom';
import LogoIcon from '../components/shared/LogoIcon';
import GoogleButton from '../components/shared/GoogleButton';
import FooterNote from '../components/shared/FooterNote';
import ThemeToggle from '../components/shared/ThemeToggle';
import { useEffect, useState } from 'react';
import { postRequest } from '../services/api';
import { processResponse } from '../utils/apiUtils';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {

  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type) => {
    setToast({ show: true, message: message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    // Capture referral link (?ref=BASE64_ENCODED_USER_ID)
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      try {
        const counsellorId = atob(ref);
        postRequest('/verify-counsellor', { counsellor_id: counsellorId }, (response) => {
          const data = response?.data;

          if (data?.status === 1) {
            // ✅ Valid counsellor → store in localStorage
            localStorage.setItem('referred_counsellor_id', counsellorId);
            const msg = Array.isArray(data.message) ? data.message[0] : data.message;
            showToast(msg || "Referral applied successfully!", "success");
            console.log("Referral verified.", data.data);
          } else {
            // ❌ Invalid or missing counsellor
            localStorage.removeItem('referred_counsellor_id');
            const msg = Array.isArray(data?.message) ? data.message[0] : (data?.message || "Invalid referral link.");
            showToast(msg, "error");
          }

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      } catch (e) {
        localStorage.removeItem('referred_counsellor_id');
        showToast("Invalid referral link format.", "error");
        console.error("Invalid referral code", e);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const rawStorage = localStorage.getItem('user_details');

      const user = JSON.parse(rawStorage || '{}');

      // If we have at least an email or token, the user has already authenticated with Google
      if (user.access_token || user.email) {
        if (user.user_type) {
          // If they already have a role, send them to dashboard or Step 2
          if (user.access_token) {
            navigate(`/${user.user_type}/dashboard`);
          } else {
            navigate(`/${user.user_type}/onboarding-step-2`);
          }
        } else {
          // If they are new and haven't picked a role yet
          navigate("/onboarding");
        }
      }
    } catch (e) {
      console.error("Error reading localStorage", e);
    }
  }, [navigate]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#f1f5f9] via-[#f8fafc] to-[#eef2f6] dark:from-[#0F172A] dark:via-[#0F172A] dark:to-[#0F172A] font-sans px-6 transition-colors duration-300 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <LogoIcon />

      <h1 className="text-[32px] font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-4 tracking-tight text-center transition-colors duration-300">
        Hare Krishna
      </h1>

      <p className="text-[16px] text-[#64748b] dark:text-[#CBD5E1] text-center mb-12 font-medium transition-colors duration-300">
        Track your habits, stay consistent
      </p>

      <GoogleButton />

      <div className="w-full flex items-center gap-3 my-6">
        <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700 transition-colors duration-300"></div>
        <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors duration-300">or</span>
        <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700 transition-colors duration-300"></div>
      </div>

      <button
        onClick={() => navigate('/email-login')}
        className="w-full py-4 px-6 bg-white dark:bg-[#1E293B] border-2 border-orange-100 dark:border-[#475569] rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-50 dark:hover:bg-[#334155] hover:border-orange-200 dark:hover:border-[#64748b] transition-all duration-300 active:scale-[0.98] group"
      >
        <svg className="w-5 h-5 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-[15px] font-bold text-[#7c2d12] dark:text-[#F8FAFC] transition-colors duration-300">Login with Email</span>
      </button>

      <FooterNote />

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error'
                ? 'bg-red-50 border-red-100 text-red-700'
                : 'bg-green-50 border-green-100 text-green-700'
              }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="text-[14px] font-bold whitespace-nowrap">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;
