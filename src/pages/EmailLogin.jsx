import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '../components/shared/LogoIcon';
import FooterNote from '../components/shared/FooterNote';
import { postRequest } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../components/shared/ThemeToggle';

// Show OTP on UI for Testing

const EmailLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('enterEmail'); // 'enterEmail' | 'enterOtp'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };
  const [generatedOtp, setGeneratedOtp] = useState(null);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await postRequest('send-email-otp', { email }, (res) => res);
      const data = response?.data;
      if (data?.status === 1) {
        showToast(data.message || 'OTP sent to your email.', 'success');
        setGeneratedOtp(data.otp); 
        setStep('enterOtp');
      } else {
        const errorMsg = Array.isArray(data?.message) ? data.message[0] : (data?.message || 'Failed to send OTP.');
        showToast(errorMsg, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      showToast('Please enter a valid OTP.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await postRequest('verify-email-otp', { email, otp }, (res) => res);
      const data = response?.data;
      if (data?.status === 1) {
        const userDetails = data?.data || {};
        localStorage.setItem('user_details', JSON.stringify(userDetails));
        showToast('Logged in successfully!', 'success');

        if (userDetails.user_type) {
          navigate(`/${userDetails.user_type}/dashboard`);
        } else {
          navigate('/onboarding');
        }
      } else {
        const errorMsg = Array.isArray(data?.message) ? data.message[0] : (data?.message || 'Invalid OTP.');
        showToast(errorMsg, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred during verification.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        "Chant and be happy"
      </p>

      <div className="w-full max-w-[340px] bg-white dark:bg-[#1E293B] p-6 rounded-[20px] shadow-sm border border-gray-400/70 dark:border-[#334155] flex flex-col items-center transition-colors duration-300">
        <AnimatePresence mode="wait">
          {step === 'enterEmail' ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-4"
            >
              <div className="space-y-1 text-left w-full">
                <label className="text-[13px] font-bold text-gray-700 dark:text-[#CBD5E1] ml-1 transition-colors duration-300">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendOtp();
                    }
                  }}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-[#475569] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-800 dark:text-[#F8FAFC] placeholder:text-gray-400 dark:placeholder:text-[#94A3B8]"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-[#e86026] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#d55520] hover:shadow-lg transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : 'Receive OTP'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-4"
            >
              <div className="text-center space-y-1 mb-2">
                <p className="text-[13px] text-gray-500 dark:text-[#CBD5E1] transition-colors duration-300">OTP sent to</p>
                <p className="font-bold text-gray-800 dark:text-[#F8FAFC] transition-colors duration-300">{email}</p>
              </div>
              <label className="text-[13px] font-bold text-gray-700 dark:text-[#CBD5E1] ml-1 transition-colors duration-300">OTP is : {generatedOtp}</label>
              <div className="space-y-1 text-left w-full">
                <label className="text-[13px] font-bold text-gray-700 dark:text-[#CBD5E1] ml-1 transition-colors duration-300">Verification Code</label>
                <input
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={otp}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyOtp();
                    }
                  }}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-[#475569] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-center text-xl tracking-[8px] font-bold text-gray-800 dark:text-[#F8FAFC] placeholder:text-gray-400 dark:placeholder:text-[#94A3B8] placeholder:tracking-normal placeholder:text-sm"
                  disabled={loading}
                />
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-[#e86026] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#d55520] hover:shadow-lg transition-all disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : 'Verify & Login'}
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full text-[13px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50 mt-2 mb-1"
                >
                  Resend OTP
                </button>
                <button
                  onClick={() => setStep('enterEmail')}
                  className="w-full text-[13px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50 mt-2 mb-1"
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-8 text-[14px] font-bold text-gray-500 hover:text-gray-800 hover:underline transition-colors"
      >
        Back to Google Login
      </button>

      <div className="mt-auto py-8 z-10 w-full">
        <FooterNote />
      </div>

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
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

export default EmailLogin;
