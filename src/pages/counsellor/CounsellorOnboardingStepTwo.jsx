import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/shared/ThemeToggle';

const CounsellorOnboardingStepTwo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    birthday: '',
    templeId: ''

  });

  const [temples, setTemples] = useState([]);
  const [isFetchingTemples, setIsFetchingTemples] = useState(true);

  const [userDetails, setUserDetails] = useState(JSON.parse(localStorage.getItem('user_details') || 'null'));
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Inline validation error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [birthdayError, setBirthdayError] = useState('');
  const [templeError, setTempleError] = useState('');

  const showToast = (message, type = 'success') => {
    const msg = Array.isArray(message) ? message[0] : message;
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    /*
    const params = new URLSearchParams(window.location.search);
    const userDataParam = params.get('user_data');
    const userParam = params.get('user');

    let initialDetails = userDetails;

    if (userDataParam || userParam) {
      try {
        const rawData = userDataParam || userParam;
        initialDetails = JSON.parse(decodeURIComponent(rawData));
       
        localStorage.setItem('user_details', JSON.stringify(initialDetails));
        setUserDetails(initialDetails);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error("Failed to parse user data from URL", err);
      }
    }
    */

    let initialDetails = userDetails;

    if (initialDetails) {
      setFormData(prev => ({
        ...prev,
        name: initialDetails.name || prev.name,
        email: initialDetails.email || prev.email
      }));
    }

    // Fetch the list of dynamically available temples/centers
    getRequest('/temple-list', { page_no: 1 }, (response) => {
       console.log("Temple API response:", response);
       const res = response.data;
       let templeData = [];
       if (Array.isArray(res)) {
           templeData = res;
       } else if (res && res.data) {
           if (Array.isArray(res.data)) templeData = res.data;
           else if (Array.isArray(res.data.temple_list)) templeData = res.data.temple_list;
           else if (Array.isArray(res.data.temples)) templeData = res.data.temples;
           else if (Array.isArray(res.data.data)) templeData = res.data.data;
       } else if (res && Array.isArray(res.temple_list)) {
           templeData = res.temple_list;
       } else if (res && Array.isArray(res.temples)) {
           templeData = res.temples;
       }
       
       if (Array.isArray(templeData) && templeData.length > 0) {
           setTemples(templeData);
       } else {
           console.warn("Could not find a valid temple array in response:", response);
       }
       setIsFetchingTemples(false);
    });

  }, []);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear the corresponding error when user types
    if (name === 'name') setNameError('');
    if (name === 'email') setEmailError('');
    if (name === 'mobile') setMobileError('');
    if (name === 'birthday') setBirthdayError('');
    if (name === 'templeId') setTempleError('');
  };

  const handleContinue = async () => {
    // Basic frontend validation
    if (!formData.name.trim()) { setNameError('Please enter your name.'); return; }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(formData.name.trim())) {
      setNameError('Invalid name format.');
      setFormData(prev => ({ ...prev, name: '' }));
      return;
    }
    if (!formData.email.trim()) { setEmailError('Please enter your email.'); return; }
    if (!isValidEmail(formData.email)) {
      setEmailError('Invalid email format.');
      setFormData(prev => ({ ...prev, email: '' }));
      return;
    }
    if (!formData.mobile.trim()) { setMobileError('Please enter your mobile number.'); return; }
    if (!/^[0-9]+$/.test(formData.mobile)) {
      setMobileError('Invalid mobile number format.');
      setFormData(prev => ({ ...prev, mobile: '' }));
      return;
    }
    if (formData.mobile.length !== 10) {
      setMobileError('Mobile number must be 10 digits.');
      setFormData(prev => ({ ...prev, mobile: '' }));
      return;
    }
    if (formData.birthday) {
      const currentDate = new Date();
      const selectedDate = new Date(formData.birthday);
      if (isNaN(selectedDate.getTime())) {
        setBirthdayError('Please enter a valid date of birth.'); return;
      }
      if (selectedDate > currentDate) {
        setBirthdayError('Date of birth cannot be in the future.'); return;
      }
      let age = currentDate.getFullYear() - selectedDate.getFullYear();
      const monthDiff = currentDate.getMonth() - selectedDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < selectedDate.getDate())) {
        age--;
      }
      if (age < 5 || age > 120) {
        setBirthdayError('Age must be between 5 and 120 years.'); return;
      }
    }
    if (!formData.templeId) { setTempleError('Please select a temple.'); return; }

    const userRole = userDetails?.userRole || 'counsellor';
    
    const finalData = {
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      temple_id: formData.templeId,
      birthday: formData.birthday || null,
      user_type: userRole,
      device_name: "Web Browser",
      added_from: "Web App",
      google_id: userDetails?.google_id || userDetails?.id,
      profile: userDetails?.picture || null
      
    };

   
    postRequest('/on-boarding', finalData, (response) => {
      const res = response.data;
      const { message } = processResponse(res);

      if (res.status === 1) {
        if (res?.data) {
          const existingDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
          const updatedDetails = {
            ...existingDetails,
            ...(res.data || res) 
          };
          localStorage.setItem('user_details', JSON.stringify(updatedDetails));
          setUserDetails(res.data);
        }
       navigate('/counsellor/dashboard'); 
      } else {
        showToast(message || "Failed to complete onboarding", "error");
        console.error("Failed to complete onboarding:", message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex justify-center font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] flex flex-col relative transition-colors duration-300">

        <div className="pt-6 pb-2 px-6 flex flex-col gap-4 sticky top-0 bg-white dark:bg-[#0F172A] z-10 w-full transition-colors duration-300">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-[#0f172a] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#1E293B] rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-200" />
                <div className="w-8 h-2 rounded-full bg-blue-600" />
              </div>
              <ThemeToggle />
            </div>
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight leading-tight transition-colors duration-300"> Almost there </h1>
            <p className="text-[15px] font-medium text-[#64748b] dark:text-[#CBD5E1] mt-1.5 leading-relaxed transition-colors duration-300"> Complete your Counsellor profile </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 hide-scrollbar">
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[13px] font-bold text-[#475569] dark:text-[#CBD5E1] uppercase tracking-wider transition-colors duration-300"> Full Name </label>
                {nameError && (
                  <span className="text-[13px] font-semibold text-red-600 animate-in fade-in">
                    {nameError}
                  </span>
                )}
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                // {/* This adds a red border if there is a nameError */}
                className={`w-full bg-[#f8fafc] dark:bg-[#1E293B] border-2 focus:bg-white dark:focus:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all duration-300 placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#94A3B8] ${nameError ? 'border-red-400 focus:border-red-500' : 'border-transparent dark:border-[#475569] focus:border-blue-500'}`}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[13px] font-bold text-[#475569] dark:text-[#CBD5E1] uppercase tracking-wider transition-colors duration-300"> Email Address </label>
                {emailError && (
                  <span className="text-[13px] font-semibold text-red-600 animate-in fade-in">
                    {emailError}
                  </span>
                )}
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full bg-[#f8fafc] dark:bg-[#1E293B] border-2 focus:bg-white dark:focus:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all duration-300 placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#94A3B8] ${emailError ? 'border-red-400 focus:border-red-500' : 'border-transparent dark:border-[#475569] focus:border-blue-500'}`}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[13px] font-bold text-[#475569] dark:text-[#CBD5E1] uppercase tracking-wider transition-colors duration-300"> Mobile Number </label>
                {mobileError && (
                  <span className="text-[13px] font-semibold text-red-600 animate-in fade-in">
                    {mobileError}
                  </span>
                )}
              </div>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                className={`w-full bg-[#f8fafc] dark:bg-[#1E293B] border-2 focus:bg-white dark:focus:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all duration-300 placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#94A3B8] ${mobileError ? 'border-red-400 focus:border-red-500' : 'border-transparent dark:border-[#475569] focus:border-blue-500'}`}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[13px] font-bold text-[#475569] dark:text-[#CBD5E1] uppercase tracking-wider transition-colors duration-300">Birthday </label>
                {birthdayError && (
                  <span className="text-[13px] font-semibold text-red-600 animate-in fade-in">
                    {birthdayError}
                  </span>
                )}
              </div>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                placeholder="Enter your Birth Date"
                className={`w-full bg-[#f8fafc] dark:bg-[#1E293B] dark:[color-scheme:dark] border-2 focus:bg-white dark:focus:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all duration-300 placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#94A3B8] ${birthdayError ? 'border-red-400 focus:border-red-500' : 'border-transparent dark:border-[#475569] focus:border-blue-500'}`}
              />
            </div>
            <div className="relative">
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[13px] font-bold text-[#475569] dark:text-[#CBD5E1] uppercase tracking-wider transition-colors duration-300"> Temple / Center Name </label>
                {templeError && (
                  <span className="text-[13px] font-semibold text-red-600 animate-in fade-in">
                    {templeError}
                  </span>
                )}
              </div>
              <div className="relative">
                  <select
                    name="templeId"
                    value={formData.templeId}
                    onChange={handleChange}
                    disabled={isFetchingTemples || temples.length === 0}
                    className={`w-full appearance-none bg-[#f8fafc] dark:bg-[#1E293B] border-2 focus:bg-white dark:focus:bg-[#0F172A] text-[#0f172a] dark:text-[#F8FAFC] text-[15px] font-semibold px-4 py-3.5 pr-10 rounded-xl outline-none transition-all duration-300 disabled:opacity-60 ${templeError ? 'border-red-400 focus:border-red-500' : 'border-transparent dark:border-[#475569] focus:border-blue-500'}`}
                  >
                    <option value="" disabled className="text-gray-400">
                      {isFetchingTemples ? "Fetching temples..." : "Select your base temple..."}
                    </option>
                    {temples.map(temple => {
                        const id = temple.temple_id || temple.id;
                        const name = temple.temple_name || temple.name;
                        return <option key={id} value={id}>{name}</option>;
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed sm:absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-[#0F172A] border-t border-gray-100 dark:border-[#1E293B] z-20 transition-colors duration-300">
          <button
            onClick={handleContinue}
            className="w-full bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(26,115,232,0.3)] transition-all active:scale-[0.98] outline-none"
          >
            Continue to Dashboard
          </button>
        </div>

        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border w-max max-w-[90%] ${
                toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
              }`}
            >
              <div className="font-bold text-[14px]">{toast.message}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CounsellorOnboardingStepTwo;
