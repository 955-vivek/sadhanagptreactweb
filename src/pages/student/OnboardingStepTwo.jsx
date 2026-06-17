import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequest, postRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/shared/ThemeToggle';

const OnboardingStepTwo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    birthday: '',
    counselorEmail: ''
  });

  const [counselors, setCounselors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [userDetails, setUserDetails] = useState(JSON.parse(localStorage.getItem('user_details') || 'null'));
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [counselorEmailError, setCounselorEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [birthdayError, setBirthdayError] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message: message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };


  useEffect(() => {
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

    if (initialDetails) {
      setFormData(prev => ({
        ...prev,
        name: initialDetails.name || prev.name,
        email: initialDetails.email || prev.email
      }));
    }
  }, []);

  // Fetch counselor list based on search text
  const fetchCounselors = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setCounselors([]);
      return;
    }

    setIsSearching(true);
    getRequest(`/counsellor-list`, { search_text: searchText }, (response) => {
      const res = response.data;

      // Handle the specific format: { data: [...], message: [...] }
      if (res && res.data && Array.isArray(res.data)) {
        setCounselors(res.data);
      } else if (Array.isArray(res)) {
        setCounselors(res);
      } else {
        setCounselors([]);
      }
      setIsSearching(false);
    });
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'name') {
      setNameError('');
    }

    if (name === 'email') {
      setEmailError('');
    }

    if (name === 'mobile') {
      setMobileError('');
    }

    if (name === 'birthday') {
      setBirthdayError('');
    }

    if (name === 'counselorEmail') {
      // Always clear error while user is actively typing/searching
      setCounselorEmailError('');
      fetchCounselors(value);
      // Reset selected counselor if user is typing a new search
      if (selectedCounselor) setSelectedCounselor(null);
    }
  };

  const handleSelectCounselor = (counselor) => {
    setSelectedCounselor(counselor);
    setCounselorEmailError(''); // Clear any error when a counsellor is picked from search
    setFormData({ ...formData, counselorEmail: counselor.email || counselor.name });
    setCounselors([]);
  };
  const referred_counsellor_id = localStorage.getItem('referred_counsellor_id');

  const handleContinue = async () => {
    // Validate counsellor field before submitting
    const counselorVal = formData.counselorEmail.trim();
    if (!referred_counsellor_id && counselorVal && !selectedCounselor && !isValidEmail(counselorVal)) {
      setCounselorEmailError('Please enter a valid email address or select a counsellor from the search results.');
      showToast('Invalid counsellor input. Please enter an email or pick from search.', 'error');
      return;
    }

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
      setEmailError('Invalid email format. Please enter a valid email address.');
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
    if (!formData.birthday) {
      setBirthdayError('Please select your date of birth.');
      return;
    }

    const currentDate = new Date();
    const selectedDate = new Date(formData.birthday);

    if (isNaN(selectedDate.getTime())) {
      setBirthdayError('Please enter a valid date of birth.');
      return;
    }

    if (selectedDate > currentDate) {
      setBirthdayError('Date of birth cannot be in the future.');
      return;
    }

    // Calculate age accurately
    let age = currentDate.getFullYear() - selectedDate.getFullYear();
    const monthDiff = currentDate.getMonth() - selectedDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < selectedDate.getDate())) {
      age--;
    }

    if (age < 5 || age > 120) {
      setBirthdayError('Age must be between 5 and 120 years.');
      return;
    }

    const userRole = userDetails?.user_type || 'student';

    // Construct the payload — if no counsellor selected, send the raw email for backend to auto-create

    const finalData = {
      counsellor_id: referred_counsellor_id ? referred_counsellor_id
        : (selectedCounselor ? selectedCounselor.user_id : null),
      new_counsellor_email: !selectedCounselor && formData.counselorEmail ? formData.counselorEmail.trim() : null,
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      birthday: formData.birthday,
      user_type: userRole,
      device_name: "Web Browser",
      added_from: "Web App",
      google_id: userDetails?.google_id,
      profile: userDetails?.picture || null // profile refers to picture URL
    };

    console.log("Final Onboarding Data Payload:", finalData);

    postRequest('/on-boarding', finalData, (response) => {
      const { message, type } = processResponse(response.data);
      const res = response.data;
      const resData = res.data || res;

      if (res.status === 1) {
        // Update localStorage with the latest tokens and user info from server
        if (resData) {
          const existingDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
          const updatedDetails = {
            ...existingDetails,
            ...resData
          };
          localStorage.setItem('user_details', JSON.stringify(updatedDetails));
          setUserDetails(resData);
        }

        showToast(message, "success");
        navigate('/student/dashboard');
      } else {
        showToast(message || 'Onboarding failed. Please check your details.', 'error');
        console.error("Failed to complete onboarding:", message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex justify-center font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] flex flex-col relative transition-colors duration-300">

        {/* Header section with back button and steps */}
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
            <span className="text-[14px] font-semibold text-[#475569] dark:text-[#CBD5E1] absolute left-1/2 -translate-x-1/2 transition-colors duration-300">
              Step 2 of 3
            </span>
            <ThemeToggle />
          </div>

          {/* Progress Bars */}
          <div className="flex gap-2 w-full mt-2">
            <div className="h-[4px] rounded-full bg-[#1a73e8] w-1/3"></div>
            <div className="h-[4px] rounded-full bg-[#1a73e8] w-1/3"></div>
            <div className="h-[4px] rounded-full bg-[#e2e8f0] dark:bg-[#334155] w-1/3 transition-colors duration-300"></div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">

          <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-2 tracking-tight transition-colors duration-300">
            Tell us a bit more
          </h1>
          <p className="text-[15px] text-[#64748b] dark:text-[#CBD5E1] font-medium mb-8 transition-colors duration-300">
            This helps us personalize your journey
          </p>

          <div className="space-y-6">

            {/* Name Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[15px] font-medium text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">Name</label>

                {/* This will show the error message dynamically */}
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
                placeholder="Enter your full name"
                // {/* This adds a red border if there is a nameError */}
                className={`w-full border dark:bg-[#1E293B] rounded-2xl px-5 py-3.5 text-[15px] outline-none transition-all duration-300 ${nameError
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  : 'border-[#cbd5e1] dark:border-[#475569] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  }`}
              />
            </div>


            {/* Email Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[15px] font-medium text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">Email</label>

                {/* This will show the error message dynamically */}
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
                // {/* This adds a red border if there is a nameError */}
                className={`w-full border dark:bg-[#1E293B] rounded-2xl px-5 py-3.5 text-[15px] outline-none transition-all duration-300 ${emailError
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  : 'border-[#cbd5e1] dark:border-[#475569] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  }`}
              />
            </div>

            {/* Mobile Number Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[15px] font-medium text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">Mobile Number</label>

                {/* This will show the error message dynamically */}
                {mobileError && (
                  <span className="text-[13px] font-semibold text-red-600 animate-in fade-in">
                    {mobileError}
                  </span>
                )}
              </div>

              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                // {/* This adds a red border if there is a mobileError */}
                className={`w-full border dark:bg-[#1E293B] rounded-2xl px-5 py-3.5 text-[15px] outline-none transition-all duration-300 ${mobileError
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  : 'border-[#cbd5e1] dark:border-[#475569] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  }`}
              />
            </div>

            {/* Lock Info Text */}
            <div className="flex items-center gap-2 mt-[-8px]">
              <svg className="w-[14px] h-[14px] text-[#64748b] dark:text-[#94A3B8]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-[13px] text-[#64748b] dark:text-[#94A3B8] font-medium transition-colors duration-300">We'll only use this for important updates</p>
            </div>

            {/* Date of Birth Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[15px] font-medium text-[#0f172a] dark:text-[#F8FAFC] transition-colors duration-300">Date of Birth</label>

                {/* This will show the error message dynamically */}
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
                placeholder="Enter your date of birth"
                // {/* This adds a red border if there is a birthdayError */}
                className={`w-full border dark:bg-[#1E293B] dark:[color-scheme:dark] rounded-2xl px-5 py-3.5 text-[15px] outline-none transition-all duration-300 ${birthdayError
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  : 'border-[#cbd5e1] dark:border-[#475569] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8]'
                  }`}
              />
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-[#f1f5f9] dark:bg-[#1E293B] my-6 transition-colors duration-300"></div>

            {/* Counselor Email Input */}
            {!referred_counsellor_id && (<div>
              <label className="block text-[15px] font-medium text-[#0f172a] dark:text-[#F8FAFC] mb-2 transition-colors duration-300">
                Counsellor
                <span className="ml-1 text-[13px] font-normal text-[#64748b] dark:text-[#94A3B8]">(search by name or enter email)</span>
              </label>
              <div className="relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    name="counselorEmail"
                    value={formData.counselorEmail}
                    onChange={handleChange}
                    placeholder="Search by name or enter counsellor email"
                    className={`w-full border dark:bg-[#1E293B] rounded-2xl pl-5 pr-12 py-3.5 text-[15px] text-[#0f172a] dark:text-[#F8FAFC] placeholder:text-[#94a3b8] focus:ring-1 outline-none transition-all duration-300 ${counselorEmailError
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-[#cbd5e1] dark:border-[#475569] focus:border-[#1a73e8] focus:ring-[#1a73e8]'
                      }`}
                  />
                  <div className="absolute right-4 text-[#64748b]">
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Search Results Dropdown */}
                {counselors.length > 0 && !selectedCounselor && (
                  <div className="absolute z-30 w-full mt-2 bg-white dark:bg-[#1E293B] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl shadow-xl overflow-hidden max-h-[220px] overflow-y-auto">
                    {counselors.map((counselor) => (
                      <div
                        key={counselor.user_id}
                        onClick={() => handleSelectCounselor(counselor)}
                        className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#334155] border-b border-[#f1f5f9] dark:border-[#334155] last:border-none cursor-pointer group transition-colors duration-300"
                      >
                        <p className="text-[15px] font-bold text-[#0f172a] dark:text-[#F8FAFC] group-hover:text-[#1a73e8] transition-colors">
                          {counselor.name}
                        </p>
                        <p className="text-[13px] text-[#64748b] dark:text-[#CBD5E1] transition-colors">
                          {counselor.email}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Error Message */}
                {counselorEmailError && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm border bg-red-50 text-red-600 border-red-100 animate-in fade-in slide-in-from-top-1">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{counselorEmailError}</span>
                  </div>
                )}

                {/* Selected / Invited Indicator */}
                {!counselorEmailError && (selectedCounselor || (!selectedCounselor && isValidEmail(formData.counselorEmail))) && (
                  <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm border animate-in fade-in slide-in-from-top-1 transition-colors duration-300 ${selectedCounselor ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/50'
                    }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{selectedCounselor ? 'Counsellor selected' : 'New counsellor will be invited'}</span>
                    <button
                      onClick={() => {
                        setSelectedCounselor(null);
                        setCounselorEmailError('');
                        setFormData({ ...formData, counselorEmail: '' });
                      }}
                      className={`ml-auto ${selectedCounselor ? 'text-blue-400 hover:text-blue-600' : 'text-green-400 hover:text-green-600'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>)}

          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 w-full max-w-md bg-white dark:bg-[#0F172A] p-6 border-t border-gray-50 dark:border-[#1E293B] z-20 transition-colors duration-300">
          <button
            onClick={handleContinue}
            className="w-full bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold text-[16px] py-4 rounded-full shadow-lg shadow-[#1a73e8]/30 transition-all active:scale-[0.98] outline-none"
          >
            Continue
          </button>
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error'
              ? 'bg-red-50 border-red-100 text-red-700'
              : 'bg-green-50 border-green-100 text-green-700'
              }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="text-[14px] font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingStepTwo;
