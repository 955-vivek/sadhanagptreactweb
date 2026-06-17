import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import BottomNavigation from '../../components/student/BottomNavigation';
import AddMentorModal from '../../components/shared/AddMentorModal';
import EditPersonalInfoModal from '../../components/shared/EditPersonalInfoModal';
import ConfirmModal from '../../components/shared/ConfirmModal';
import MentorDetailsModal from '../../components/shared/MentorDetailsModal';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { getRequest, postRequest, postRequestWithFile } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';


const Profile = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [selectedMentorDetails, setSelectedMentorDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message: message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const [userInfo, setUserInfo] = useState({
    name: '',
    mobile: '',
    email: '',
    profile_image: '',
    reminder_enabled: false,
    reminder_days: 3
  });

  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const handleSavePreferences = (enabled, days) => {
    setUserInfo(prev => ({ ...prev, reminder_enabled: enabled, reminder_days: days }));
    setIsSavingPreferences(true);

    const payload = {
      user_id: userDetails.user_id,
      reminder_enabled: enabled,
      reminder_days: days
    };

    postRequest('/update-reminder-preferences', payload, (response) => {
      setIsSavingPreferences(false);
      const { message, type } = processResponse(response.data);
      if (type === 'success' || response.data?.status === 1) {
        showToast("Preferences saved!", "success");
      } else {
        showToast(message || "Failed to save preferences", "error");
      }
    });
  };

  const [mentors, setMentors] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsPushEnabled(true);
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const browserSubscription = registration ? await registration.pushManager.getSubscription() : null;

        if (userDetails?.user_id) {
          getRequest('/check-push-status', { user_id: userDetails.user_id }, async (response) => {
            const backendHasSub = response.data?.isSubscribed;
            if (browserSubscription && !backendHasSub) {
              await browserSubscription.unsubscribe();
              setIsPushEnabled(false);
            } else if (browserSubscription && backendHasSub) {
              setIsPushEnabled(true);
            } else {
              setIsPushEnabled(false);
            }
          });
        } else {
          setIsPushEnabled(!!browserSubscription);
        }
      } catch (e) {
        setIsPushEnabled(false);
      }
    };

    if (userDetails?.user_id) {
      checkSubscription();
    }
  }, [userDetails?.user_id]);

  const handlePostFeedback = () => {
    if (!feedbackText.trim() || !userDetails?.user_id) return;
    setIsSubmittingFeedback(true);

    const payload = {
      user_id: userDetails.user_id,
      name: userInfo.name, // adding the name field
      message: feedbackText
    };

    postRequest('/app-feedback', payload, (response) => {
      setIsSubmittingFeedback(false);
      const { message, type } = processResponse(response.data);
      if (type === 'success' || response.data?.status === 1) {
        showToast("Feedback submitted successfully!", "success");
        setFeedbackText('');
      } else {
        showToast(message || "Failed to submit feedback", "error");
      }
    });
  };

  console.log("User details in Profile:", userDetails);
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size should not exceed 5 MB.", "error");
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Invalid file type. Only JPG, JPEG, PNG, WEBP are allowed.", "error");
      return;
    }

    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append("profile", file);
    formData.append("user_id", userDetails.user_id);

    postRequestWithFile(`/upload-profile-image?user_id=${userDetails.user_id}`, formData, (response) => {
      setIsUploadingImage(false);
      const res = response?.data || response;
      if (res && (res.code === 200 || res.status === 1 || res.status === "success")) {
        showToast("Profile picture updated successfully!", "success");
        setIsProfileModalOpen(false);
        const newImageUrl = res.data?.profile_image;
        if (newImageUrl) {
          setUserInfo(prev => ({ ...prev, profile_image: newImageUrl }));
          const stored = JSON.parse(localStorage.getItem('user_details')) || {};
          stored.picture = newImageUrl;
          localStorage.setItem('user_details', JSON.stringify(stored));
        }
      } else {
        const errorMsg = typeof res?.message === 'object' ? Object.values(res.message)[0] : res?.message;
        showToast(errorMsg || "Failed to upload image", "error");
      }
    });
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_IMAGE_URL}${path}`;
  };

  const handleImageRemove = () => {
    console.log("---- REMOVE IMAGE DEBUG ----");
    console.log("1. Current user object:", userDetails);
    console.log("2. user_id:", userDetails?.user_id);
    console.log("3. profile_image URL/path:", userInfo?.profile_image);
    console.log("4. API request payload:", {});
    console.log("Endpoint being called:", `/remove-profile-image?user_id=${userDetails.user_id}`);

    setIsUploadingImage(true);
    postRequest(`/remove-profile-image?user_id=${userDetails.user_id}`, {}, (response) => {
      setIsUploadingImage(false);
      setIsRemoveConfirmOpen(false);
      
      console.log("5. API response raw:", response);
      const res = response?.data || response;
      console.log("Parsed res:", res);

      if (res && (res.code === 200 || res.status === 1 || res.status === "success")) {
        console.log("7. Final state update: Setting profile_image to empty string");
        showToast("Profile picture removed successfully!", "success");
        setIsProfileModalOpen(false);
        setUserInfo(prev => ({ ...prev, profile_image: '' }));
        const stored = JSON.parse(localStorage.getItem('user_details')) || {};
        stored.picture = '';
        localStorage.setItem('user_details', JSON.stringify(stored));
      } else {
        console.log("6. Backend error response:", res);
        const errorMsg = typeof res?.message === 'object' ? Object.values(res.message)[0] : res?.message;
        console.log("Extracted error message:", errorMsg);
        showToast(errorMsg || "Failed to remove image", "error");
      }
    });
  };

  const fetchProfile = () => {
    if (!userDetails?.user_id) return;
    setIsLoading(true);
    getRequest('/user-profile', { user_id: userDetails.user_id }, (response) => {
      const res = response.data;
      const dataObj = res?.data || res;

      if (dataObj.user) {
        setUserInfo({
          name: dataObj.user.name || '',
          mobile: dataObj.user.mobile || dataObj.user.phone || '',
          email: dataObj.user.email || '',
          profile_image: dataObj.user.profile || "",
          reminder_enabled: dataObj.user.reminder_enabled === 1 || dataObj.user.reminder_enabled === true,
          reminder_days: dataObj.user.reminder_days || 3
        });
      }

      if (Array.isArray(dataObj.mentors)) setMentors(dataObj.mentors);
      else if (dataObj.mentor && Array.isArray(dataObj.mentor)) setMentors(dataObj.mentor);

      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchProfile();
    
    // Sync browser subscription with backend
    const syncSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const browserSubscription = registration ? await registration.pushManager.getSubscription() : null;

        if (userDetails?.user_id) {
          getRequest('/check-push-status', { user_id: userDetails.user_id }, async (response) => {
            const backendHasSub = response.data?.isSubscribed;
            if (browserSubscription && !backendHasSub) {
              await browserSubscription.unsubscribe();
              setUserInfo(prev => ({ ...prev, reminder_enabled: false }));
            }
          });
        }
      } catch (e) {
        console.error("Sync error:", e);
      }
    };
    syncSubscription();
  }, [userDetails]);

  const handleAddMentor = (counselorData) => {
    let newMentor;
    if (typeof counselorData === 'object' && counselorData !== null) {
      newMentor = {
        name: counselorData.name || 'Unknown Mentor',
        email: counselorData.email || '',
        temple: 'New Connection',
        avatar: counselorData.profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(counselorData.name || 'Mentor')}&background=f97316&color=fff`
      };

      // Hit the API to add counsellor
      const payload = {
        user_id: userDetails.user_id,
        counsller_id: counselorData.user_id
      };

      postRequest('/add-counsllor', payload, (response) => {
        const { message, type } = processResponse(response.data);
        console.log("Add Counsellor Response:", response);

        if (type === 'success') {
          showToast(message);
          fetchProfile();
        } else {
          showToast(message, type);
        }
      });

    } else {
      const query = String(counselorData);
      newMentor = {
        name: query.includes('@') ? query.split('@')[0] : query,
        temple: 'New Connection',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(query)}&background=f97316&color=fff`
      };
    }

    setMentors([...mentors, newMentor]);
    setIsAddMentorOpen(false);
  };

  const handleSaveInfo = (newInfo) => {
    // Update local state right away for snappy UI
    setUserInfo({ ...userInfo, ...newInfo });
    setIsEditInfoOpen(false);

    // Post to backend
    const payload = {
      user_id: userDetails.user_id,
      name: newInfo.name,
      mobile: newInfo.mobile
    };

    postRequest('/edit-profile', payload, (response) => {
      const { message, type } = processResponse(response.data);
      const res = response.data;
      if (type === 'success' && res.data) {
        showToast(message);
        fetchProfile();
      } else {
        showToast(message, type);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#fdfcf5] dark:bg-[#0F172A] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <header className="px-8 pt-12 pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-black text-[#0f172a] dark:text-[#F8FAFC] tracking-tight leading-tight">My Profile</h1>
            <p className="text-[14px] font-bold text-gray-500/60 dark:text-[#CBD5E1] mt-0.5">Account Details</p>
          </div>
          <ThemeToggle />
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-32 pb-32 gap-3">
            <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Identity */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div 
                  className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white ring-8 ring-white/50 relative cursor-pointer group-hover:ring-[#1a73e8]/30 transition-all duration-300"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <img
                    src={getImageUrl(userInfo.profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || userInfo.email || userDetails?.email || 'User')}&background=1a73e8&color=fff&size=400`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt="Profile"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    <span className="text-white text-xs font-bold uppercase tracking-wider">View</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  onChange={handleImageUpload} 
                />
              </div>
              <div className="flex items-center gap-3 mt-5">
                <h2 className="text-[24px] font-black text-[#0f172a] tracking-tight">{userInfo.name}</h2>
              </div>
              {/* <button 
            onClick={() => navigate('/student/ai-chat')}
            className="mt-4 px-6 py-2.5 bg-white border-2 border-[#1a73e8]/10 rounded-full flex items-center gap-2.5 text-[#1a73e8] font-black text-[14px] shadow-sm hover:bg-[#1a73e8]/5 hover:border-[#1a73e8]/20 active:scale-95 transition-all"
          >
            <div className="w-5 h-5 bg-[#1a73e8] rounded-md flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.535 4h5.07a1 1 0 01.99 1.145C11.205 14.505 9.715 15.5 8 15.5s-3.205-.995-4.525-2.355A1 1 0 014.465 12z" clipRule="evenodd" /></svg>
            </div>
            Chat with AI
          </button> */}
            </div>

            {/* Personal Info */}
            <section className="px-8 mb-10">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[13px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest">Personal Info</h3>
                <button
                  onClick={() => setIsEditInfoOpen(true)}
                  className="text-[13px] font-black text-[#f97316]"
                >
                  Edit
                </button>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-blue-200 dark:border-[#475569] space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#fcf8ed] dark:bg-orange-900/20 flex items-center justify-center text-[#94a3b8] dark:text-orange-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-gray-300 dark:text-[#CBD5E1] uppercase tracking-widest mb-1">Email</p>
                    <p className="text-[16px] font-bold text-[#1e293b] dark:text-[#F8FAFC]">{userInfo.email}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-50 dark:bg-[#334155]"></div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#fcf8ed] dark:bg-orange-900/20 flex items-center justify-center text-[#94a3b8] dark:text-orange-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-gray-300 dark:text-[#CBD5E1] uppercase tracking-widest mb-1">Phone</p>
                    <p className="text-[16px] font-bold text-[#1e293b] dark:text-[#F8FAFC]">{userInfo.mobile}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* My Mentors */}
            <section className="px-8 pb-10">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[13px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest">My Mentors</h3>
                <button
                  onClick={() => setIsAddMentorOpen(true)}
                  className="w-8 h-8 rounded-full bg-[#fef3c7]/60 dark:bg-orange-900/40 flex items-center justify-center text-[#f97316] font-black text-[20px] transition-all hover:bg-[#fef3c7] dark:hover:bg-orange-900/60"
                >
                  +
                </button>
              </div>
              <div className="space-y-4">
                {mentors.length === 0 ? (
                  <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-blue-200 dark:border-[#475569] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-200 dark:text-orange-400 flex items-center justify-center mb-3">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <p className="text-[14px] font-bold text-gray-400 dark:text-[#CBD5E1]">No mentor assigned yet</p>
                  </div>
                ) : (
                  mentors.map((mentor, idx) => (
                    <motion.div
                      key={mentor.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedMentorDetails(mentor)}
                      className="bg-white dark:bg-[#1E293B] rounded-[40px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-blue-200 dark:border-[#475569] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer hover:border-orange-100 dark:hover:border-orange-500/50"
                    >
                      <div className="flex items-center gap-4">
                        <img src={getImageUrl(mentor.avatar || mentor.profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=f97316&color=fff`} className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-gray-100 dark:bg-gray-800" alt="" />
                        <div>
                          <h4 className="text-[16px] font-black text-[#1e293b] dark:text-[#F8FAFC]">{mentor.name}</h4>
                          <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                            <svg className="w-3.5 h-3.5 text-[#f97316]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                            <span className="text-[12px] font-bold tracking-tight">{mentor.temple || 'Assigned Mentor'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest mb-1">View</span>
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* Notification Preferences */}
            {/* Notification Preferences */}
            {isPushEnabled && (
            <section className="px-8 mb-10">
              <div className="bg-white rounded-[40px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-blue-200 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[16px] font-black text-[#1e293b]">Activity Reminders</h4>
                    <p className="text-[13px] font-bold text-gray-400 mt-1">Get notified if you miss your Sadhana activities</p>
                  </div>
                  <button
                    onClick={() => {
                      const newEnabled = !userInfo.reminder_enabled;
                      handleSavePreferences(newEnabled, userInfo.reminder_days || 3);
                    }}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${userInfo.reminder_enabled ? 'bg-[#f97316]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${userInfo.reminder_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {userInfo.reminder_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="h-px bg-gray-50 w-full mb-6"></div>
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-bold text-[#1e293b]">Remind me after missing</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#f8fafc] rounded-xl border-2 border-transparent focus-within:border-[#f97316]/20 overflow-hidden">
                            <button
                              onClick={() => userInfo.reminder_days > 1 && handleSavePreferences(userInfo.reminder_enabled, userInfo.reminder_days - 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={userInfo.reminder_days}
                              onChange={(e) => {
                                if (e.target.value === '') {
                                  setUserInfo(prev => ({ ...prev, reminder_days: '' }));
                                  return;
                                }
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0 && val <= 10) handleSavePreferences(!!userInfo.reminder_enabled, val);
                              }}
                              onBlur={() => {
                                if (userInfo.reminder_days === '' || userInfo.reminder_days < 1) {
                                  handleSavePreferences(!!userInfo.reminder_enabled, 3);
                                }
                              }}
                              className="w-12 text-center bg-transparent text-[#1e293b] font-black text-[14px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => userInfo.reminder_days < 10 && handleSavePreferences(!!userInfo.reminder_enabled, userInfo.reminder_days + 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            </button>
                          </div>
                          <span className="text-[14px] font-bold text-gray-400">days</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
            )}

            {/* App Feedback Section */}
            <section className="px-8 mb-10">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">App Feedback</h3>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)] border border-blue-200 dark:border-[#334155] flex flex-col items-center">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us how we can improve this app..."
                  className="w-full bg-[#f8fafc] dark:bg-[#0F172A] text-[#1e293b] dark:text-[#F8FAFC] font-medium text-[14px] rounded-3xl p-5 outline-none border-2 border-transparent focus:border-[#f97316]/20 transition-all resize-none h-28 shadow-inner"
                />
                <button
                  onClick={handlePostFeedback}
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                  className="mt-4 w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-black py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  {isSubmittingFeedback ? 'Posting...' : 'Post Feedback'}
                </button>
              </div>
            </section>




            {/* Logout Section */}
            <section className="px-8 pb-10">
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
                className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-black py-5 rounded-[32px] border-2 border-red-200 dark:border-red-900/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout Account
              </button>
            </section>
          </>
        )}

      </div>

      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-[95%] sm:w-[90%] max-w-md md:max-w-lg lg:max-w-xl bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="flex-shrink-0 flex justify-between items-center p-5 border-b border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1E293B]">
                <h3 className="text-lg font-black text-slate-800 dark:text-[#F8FAFC] tracking-tight">Profile Picture</h3>
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#334155] text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#475569] flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 md:p-8 flex flex-col items-center overflow-y-auto">
                <div className="w-full max-w-sm aspect-square bg-[#f8fafc] dark:bg-[#0F172A] rounded-3xl border-2 border-gray-100 dark:border-[#334155] overflow-hidden flex items-center justify-center shadow-inner relative group p-2 md:p-4 mb-6">
                  <img
                    src={getImageUrl(userInfo.profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || userInfo.email || userDetails?.email || 'User')}&background=1a73e8&color=fff&size=400`}
                    className="w-full h-full object-contain rounded-xl"
                    alt="Profile Preview"
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="w-10 h-10 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-3">
                  <button 
                    onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full py-3.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl font-bold text-[15px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Update Photo
                  </button>

                  {userInfo.profile_image && (
                    <button 
                      onClick={() => setIsRemoveConfirmOpen(true)}
                      disabled={isUploadingImage}
                      className="w-full py-3.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-[15px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddMentorModal
        isOpen={isAddMentorOpen}
        onClose={() => setIsAddMentorOpen(false)}
        onAdd={handleAddMentor}
      />

      <EditPersonalInfoModal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        userInfo={userInfo}
        onSave={handleSaveInfo}
      />

      <ConfirmModal 
        isOpen={isRemoveConfirmOpen}
        onClose={() => setIsRemoveConfirmOpen(false)}
        onConfirm={handleImageRemove}
        title="Remove Profile Picture?"
        description="This action will remove your current profile photo. You can upload a new one anytime later."
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isUploadingImage}
      />

      <MentorDetailsModal 
        isOpen={!!selectedMentorDetails}
        onClose={() => setSelectedMentorDetails(null)}
        mentor={selectedMentorDetails}
      />

      <BottomNavigation />

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

export default Profile;
