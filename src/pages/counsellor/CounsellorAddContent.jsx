import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import { getRequest, postRequest, postRequestWithFile } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import ThemeToggle from '../../components/shared/ThemeToggle';

const CounsellorAddContent = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [activeTab, setActiveTab] = useState('Add'); // 'Add' or 'View'
  const [contentType, setContentType] = useState('quote');
  const [quoteContent, setQuoteContent] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [urlLink, setUrlLink] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Real Data State
  const [centers, setCenters] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState([]); // Array of { center_id, labels: [] }
  const [currentGroupLabels, setCurrentGroupLabels] = useState({}); // { center_id: [label_objects] }
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  // View Content State
  const [publishedContent, setPublishedContent] = useState([]);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [contentPage, setContentPage] = useState(1);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [isFetchingMoreContents, setIsFetchingMoreContents] = useState(false);
  const [viewFilterGroup, setViewFilterGroup] = useState('All');
  const [viewFilterLabel, setViewFilterLabel] = useState('All');
  const [viewFilterType, setViewFilterType] = useState('All');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Compression Utility
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.8); // 80% quality
        };
      };
    });
  };

  // Fetch groups on mount
  useEffect(() => {
    setIsLoadingGroups(true);
    getRequest('/group-list', { user_id: userDetails?.user_id }, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        const centersData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCenters(centersData);
      }
      setIsLoadingGroups(false);
    });
  }, [userDetails?.user_id]);

  const fetchPublishedContent = (pageNum = 1, append = false) => {
    if (append) setIsFetchingMoreContents(true);
    else setIsFetchingContent(true);

    const payload = {
      user_id: userDetails.user_id,
      center_id: viewFilterGroup === 'All' ? '' : viewFilterGroup,
      label_id: viewFilterLabel === 'All' ? '' : viewFilterLabel,
      content_type: viewFilterType === 'All' ? '' : viewFilterType,
      page_no: pageNum
    };

    getRequest('/counsellor-content-list', payload, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        const newData = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        if (append) {
          setPublishedContent(prev => [...prev, ...newData]);
        } else {
          setPublishedContent(newData);
        }

        if (newData.length < 5) setHasMoreContent(false);
        else setHasMoreContent(true);
      }
      setIsFetchingContent(false);
      setIsFetchingMoreContents(false);
    });
  };

  useEffect(() => {
    if (activeTab === 'View') {
      setContentPage(1);
      fetchPublishedContent(1, false);
    }
  }, [activeTab, viewFilterGroup, viewFilterLabel, viewFilterType]);

  const loadMoreLibrary = () => {
    if (isFetchingMoreContents || !hasMoreContent) return;
    const nextPage = contentPage + 1;
    setContentPage(nextPage);
    fetchPublishedContent(nextPage, true);
  };

  const fetchLabelsForGroup = (centerId) => {
    if (currentGroupLabels[centerId]) return;
    getRequest('/lable-list', { user_id: userDetails?.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        const labelsData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCurrentGroupLabels(prev => ({
          ...prev,
          [centerId]: labelsData.map(l => ({ id: l.label_id, name: l.label_name }))
        }));
      }
    });
  };

  const toggleGroup = (centerId) => {
    setSelectedAudience(prev => {
      const exists = prev.find(a => a.center_id === centerId);
      if (exists) {
        return prev.filter(a => a.center_id !== centerId);
      } else {
        fetchLabelsForGroup(centerId);
        return [...prev, { center_id: centerId, labels: [] }];
      }
    });
  };

  const toggleLabel = (centerId, labelId) => {
    setSelectedAudience(prev => prev.map(a => {
      if (a.center_id === centerId) {
        const labels = a.labels.includes(labelId)
          ? a.labels.filter(id => id !== labelId)
          : [...a.labels, labelId];
        return { ...a, labels };
      }
      return a;
    }));
  };

  const contentTypes = [
    {
      id: 'quote',
      title: 'Text Quote',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
      )
    },
    {
      id: 'Image',
      title: 'Image',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      )
    },
    {
      id: 'YouTube',
      title: 'YouTube',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
        </svg>
      )
    },
    {
      id: 'URL',
      title: 'URL Link',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0F172A] font-sans pb-28 transition-colors duration-300">
      {/* Container holding the mobile width cleanly if opened on desktop */}
      <div className="w-full max-w-md mx-auto relative bg-white dark:bg-[#0F172A] min-h-screen shadow-sm transition-colors duration-300">

        {/* Header */}
        <div className="bg-white dark:bg-[#0F172A] sticky top-0 z-20 border-b border-gray-300 dark:border-[#1E293B] px-6 py-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-black text-[#0f172a] dark:text-[#F8FAFC] tracking-tight transition-colors duration-300">Content Hub</h1>
              <ThemeToggle />
            </div>
            <div className="flex bg-gray-100/80 dark:bg-[#1E293B] p-1 rounded-2xl transition-colors duration-300">
              <button
                onClick={() => setActiveTab('Add')}
                className={`px-5 py-2 rounded-xl text-[13px] font-black transition-all ${activeTab === 'Add' ? 'bg-white dark:bg-[#0F172A] text-[#1a73e8] dark:text-[#60A5FA] shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC]'
                  }`}
              >
                Create
              </button>
              <button
                onClick={() => setActiveTab('View')}
                className={`px-5 py-2 rounded-xl text-[13px] font-black transition-all ${activeTab === 'View' ? 'bg-white dark:bg-[#0F172A] text-[#1a73e8] dark:text-[#60A5FA] shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC]'
                  }`}
              >
                Library
              </button>
            </div>
          </div>

          <div className="flex items-center text-gray-400 gap-2">
            <div className={`w-2 h-2 rounded-full ${activeTab === 'Add' ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span className="text-[12px] font-bold uppercase tracking-widest">
              {activeTab === 'Add' ? 'Publishing Mode' : 'Content Management'}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 pt-6 pb-20">
          {activeTab === 'Add' ? (
            <>
              {/* Content Type Selector */}
              <div className="mb-8">
                <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3">CONTENT TYPE</h2>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 pt-1 px-5 -mx-5 whitespace-nowrap">
                  {contentTypes.map((type) => {
                    const isActive = contentType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        className={`flex-shrink-0 relative flex flex-col items-center justify-center w-[100px] h-[100px] rounded-full transition-all duration-200 border-2 active:scale-95 ${isActive
                          ? 'bg-[#1a73e8] border-[#1a73e8] shadow-[0_4px_16px_rgba(26,115,232,0.4)] text-white'
                          : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#334155] text-[#64748b] dark:text-[#94A3B8] hover:border-gray-200 dark:hover:border-[#475569] shadow-sm'
                          }`}
                      >
                        <div className="mb-2">{type.icon}</div>
                        <span className={`text-[12px] font-semibold ${isActive ? 'text-white' : 'text-[#64748b] dark:text-[#94A3B8]'}`}>
                          {type.title}
                        </span>
                        {isActive && (
                          <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-white"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Content Input Area */}
              <div className="mb-8">
                <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3 uppercase">
                  {contentType === 'quote' ? 'QUOTE CONTENT' : contentType === 'Image' ? 'UPLOAD IMAGE' : contentType === 'YouTube' ? 'YOUTUBE LINK' : 'WEBSITE URL'}
                </h2>

                {contentType === 'quote' && (
                  <div className="border border-gray-400/70 dark:border-[#475569] rounded-[28px] overflow-hidden shadow-sm bg-white dark:bg-[#1E293B] focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all">
                    {/* Formatting Toolbar Mock */}
                    <div className="flex items-center gap-2 p-3 border-b border-gray-300 dark:border-[#334155] bg-gray-50/50 dark:bg-[#0F172A]/50">
                      <button className="w-8 h-8 rounded hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-sm text-gray-500 dark:text-[#CBD5E1] flex items-center justify-center transition-all font-serif font-bold">B</button>
                      <button className="w-8 h-8 rounded hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-sm text-gray-500 dark:text-[#CBD5E1] flex items-center justify-center transition-all font-serif italic">I</button>
                      <button className="w-8 h-8 rounded hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-sm text-gray-500 dark:text-[#CBD5E1] flex items-center justify-center transition-all underline">U</button>
                      <div className="w-px h-5 bg-gray-300 dark:bg-[#475569] mx-1"></div>
                      <button className="w-8 h-8 rounded hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-sm text-gray-500 dark:text-[#CBD5E1] flex items-center justify-center transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
                      </button>
                      <button className="w-8 h-8 rounded hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-sm text-gray-500 dark:text-[#CBD5E1] flex items-center justify-center transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" /></svg>
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={quoteContent}
                        onChange={(e) => {
                          if (e.target.value.length <= 500) setQuoteContent(e.target.value);
                        }}
                        placeholder="Type the inspirational quote here..."
                        className="w-full min-h-[140px] p-5 text-[16px] text-[#0f172a] dark:text-[#F8FAFC] placeholder-[#94a3b8] focus:outline-none resize-none bg-transparent"
                      />
                      <div className="absolute bottom-3 right-5 text-[12px] font-medium text-[#c0cbd8]">
                        {quoteContent.length}/500
                      </div>
                    </div>
                  </div>
                )}

                {contentType === 'Image' && (
                  <div
                    onClick={() => document.getElementById('imageInput').click()}
                    className="relative w-full min-h-[200px] border-2 border-dashed border-[#cbd5e1] dark:border-[#475569] rounded-[28px] bg-[#f8fafc] dark:bg-[#1E293B] flex flex-col items-center justify-center hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:border-[#94a3b8] transition-all cursor-pointer group overflow-hidden"
                  >
                    <input
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedImage(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />

                    {imagePreview ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-white font-bold text-[14px]">Change Image</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center text-[#1a73e8] dark:text-[#60A5FA] mb-3 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-[14px] font-bold text-[#0f172a] dark:text-[#F8FAFC]">Click to upload image</p>
                        <p className="text-[12px] text-[#94a3b8] mt-1">PNG, JPG or WEBP (max. 5MB)</p>
                      </>
                    )}
                  </div>
                )}

                {contentType === 'YouTube' && (
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="Paste YouTube link here..."
                      className="w-full p-5 pl-14 border border-gray-300 dark:border-[#475569] rounded-[28px] text-[16px] text-[#0f172a] dark:text-[#F8FAFC] placeholder-[#94a3b8] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all bg-white dark:bg-[#1E293B] shadow-sm"
                    />
                  </div>
                )}

                {contentType === 'URL' && (
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1a73e8]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={urlLink}
                      onChange={(e) => setUrlLink(e.target.value)}
                      placeholder="Paste website URL here..."
                      className="w-full p-5 pl-14 border border-gray-300 dark:border-[#475569] rounded-[28px] text-[16px] text-[#0f172a] dark:text-[#F8FAFC] placeholder-[#94a3b8] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all bg-white dark:bg-[#1E293B] shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* Multi-Audience Multi-Select */}
              <div className="mb-8">
                <h2 className="text-[12px] font-bold text-[#64748b] tracking-wider mb-3 uppercase">MANAGE AUDIENCE</h2>

                {isLoadingGroups ? (
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[13px] text-gray-500 font-bold">Loading groups...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group Selector */}
                    <div className="flex flex-wrap gap-2">
                      {centers.map(center => {
                        const isSelected = selectedAudience.some(a => a.center_id === center.center_id);
                        return (
                          <button
                            key={center.center_id}
                            onClick={() => toggleGroup(center.center_id)}
                            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all border-2 ${isSelected
                              ? 'bg-[#1a73e8] border-[#1a73e8] text-white'
                              : 'bg-white border-gray-300 text-[#64748b] hover:border-gray-300'
                              }`}
                          >
                            {center.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Respective Labels Selector */}
                    {selectedAudience.map(audienceItem => {
                      const center = centers.find(c => c.center_id === audienceItem.center_id);
                      const labels = currentGroupLabels[audienceItem.center_id] || [];

                      return (
                        <div key={audienceItem.center_id} className="bg-[#f8fafc] rounded-[24px] p-5 border border-gray-400/70">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                              </div>
                              <span className="text-[14px] font-extrabold text-[#0f172a]">{center?.name}</span>
                            </div>
                            {audienceItem.labels.length === 0 && (
                              <span className="bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                Broadcast to All
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-gray-500 leading-snug mb-4 font-medium pl-8">
                            Target specific students, or leave unselected to broadcast to everyone in {center?.name}.
                          </p>
                          {labels.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {labels.map(lbl => {
                                const isLabelSelected = audienceItem.labels.includes(lbl.id);
                                return (
                                  <button
                                    key={lbl.id}
                                    onClick={() => toggleLabel(audienceItem.center_id, lbl.id)}
                                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border-2 ${isLabelSelected
                                      ? 'bg-blue-100 border-blue-200 text-blue-700'
                                      : 'bg-white border-transparent text-gray-500 hover:border-gray-200'
                                      }`}
                                  >
                                    {lbl.name}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[12px] text-gray-400 font-medium italic">Getting labels...</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={async () => {
                    setIsPublishing(true);
                    // Prepare flattened audience lists
                    const group_ids = selectedAudience.map(a => a.center_id);
                    const label_ids = selectedAudience.flatMap(a => a.labels);

                    // Prepare final content based on type
                    let contentData = "";
                    if (contentType === 'quote') contentData = quoteContent;
                    if (contentType === 'YouTube') contentData = youtubeLink;
                    if (contentType === 'URL') contentData = urlLink;

                    try {
                      const formData = new FormData();
                      const uid = userDetails?.user_id || localStorage.getItem('user_id');

                      formData.append('counsellor_id', uid);
                      formData.append('user_id', uid);

                      // Send 'quote' exactly as required by the backend
                      const backendType = contentType.toLowerCase();
                      formData.append('content_type', backendType);

                      formData.append('group_ids', JSON.stringify(group_ids));
                      formData.append('label_ids', JSON.stringify(label_ids));

                      if (contentType === 'Image' && selectedImage) {
                        const compressed = await compressImage(selectedImage);
                        formData.append('image', compressed);
                        // If backend expects 'content' field even for images (as a title or placeholder)
                        formData.append('content', "Image Shared");
                      } else {
                        formData.append('content', contentData);
                      }

                      console.log("Publishing FormData payload...");

                      postRequestWithFile(`/add-new-content?user_id=${uid}`, formData, (response) => {
                        const { message, type } = processResponse(response?.data || response);

                        // Prevent React crash: Extract string if message is an object
                        let finalMessage = message;
                        if (typeof message === 'object' && message !== null) {
                          finalMessage = Object.values(message)[0];
                        }

                        if (type === 'success') {
                          setSuccessMessage(finalMessage);
                          // Reset form state and switch to Library tab
                          setQuoteContent('');
                          setYoutubeLink('');
                          setUrlLink('');
                          setSelectedImage(null);
                          setImagePreview(null);
                          setSelectedAudience([]);
                          setActiveTab('View');
                          setTimeout(() => setSuccessMessage(''), 3000);
                        } else {
                          setErrorMessage(finalMessage || "Failed to publish");
                          setTimeout(() => setErrorMessage(''), 3000);
                        }
                        setIsPublishing(false);
                      });
                    } catch (err) {
                      console.error("Publishing Error:", err);
                      setErrorMessage("Error processing image");
                      setIsPublishing(false);
                    }
                  }}
                  disabled={selectedAudience.length === 0 || isPublishing}
                  className="w-full bg-[#1a73e8] text-white rounded-[24px] py-4 text-[16px] font-bold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                  {isPublishing ? 'Publishing...' : 'Publish Post'}
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full text-[#64748b] bg-transparent py-4 text-[16px] font-semibold active:opacity-70 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              {/* Library Filters */}
              <div className="bg-blue-50 dark:bg-[#1E293B] rounded-[32px] p-6 border border-blue-100 dark:border-[#334155] shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-[#0f172a] dark:text-[#F8FAFC]">Filter Library</h3>
                    <p className="text-[12px] font-bold text-blue-600/60 dark:text-blue-400/80 uppercase tracking-wider">By target audience</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Group Filter */}
                  <div>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Center / Group</p>
                    <select
                      value={viewFilterGroup}
                      onChange={(e) => {
                        setViewFilterGroup(e.target.value);
                        setViewFilterLabel('All');
                        if (e.target.value !== 'All') fetchLabelsForGroup(e.target.value);
                      }}
                      className="w-full bg-white dark:bg-[#0F172A] border-2 border-transparent focus:border-blue-200 dark:focus:border-blue-500 p-4 rounded-2xl text-[14px] font-bold text-[#0f172a] dark:text-[#F8FAFC] shadow-sm outline-none transition-all"
                    >
                      <option value="All">All Groups</option>
                      {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Label Filter */}
                  <AnimatePresence>
                    {viewFilterGroup !== 'All' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Specific Label</p>
                        <select
                          value={viewFilterLabel}
                          onChange={(e) => setViewFilterLabel(e.target.value)}
                          className="w-full bg-white dark:bg-[#0F172A] border-2 border-transparent focus:border-blue-200 dark:focus:border-blue-500 p-4 rounded-2xl text-[14px] font-bold text-[#0f172a] dark:text-[#F8FAFC] shadow-sm outline-none transition-all"
                        >
                          <option value="All">All Labels</option>
                          {(currentGroupLabels[viewFilterGroup] || []).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Content Type Filter */}
                  <div>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Content Type</p>
                    <select
                      value={viewFilterType}
                      onChange={(e) => setViewFilterType(e.target.value)}
                      className="w-full bg-white dark:bg-[#0F172A] border-2 border-transparent focus:border-blue-200 dark:focus:border-blue-500 p-4 rounded-2xl text-[14px] font-bold text-[#0f172a] dark:text-[#F8FAFC] shadow-sm outline-none transition-all"
                    >
                      <option value="All">All Types</option>
                      <option value="quote">Quotes / Text</option>
                      <option value="image">Images</option>
                      <option value="youtube">Videos</option>
                      <option value="url">Links</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Published Feed */}
              <div className="space-y-6 min-h-[40vh]">
                {isFetchingContent ? (
                  <div className="flex flex-col items-center justify-center pt-20 gap-3">
                    <div className="w-8 h-8 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold">Refreshing library...</p>
                  </div>
                ) : publishedContent.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {publishedContent.map((item, idx) => (
                      <motion.div
                        key={item.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="w-full"
                      >
                        {/* Quote / Text Format - Only if NOT a YouTube link */}
                        {(item.content_type === 'quote' || item.content_type === 'text' || item.content_type === '') && !extractYouTubeId(item.content) && (
                          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-400/70 dark:border-[#334155] border-l-8 border-l-blue-500 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-4">
                              <div className="opacity-20">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                              </div>
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <h2 className="text-[18px] font-bold text-[#1e293b] dark:text-[#E2E8F0] leading-relaxed italic mb-6">
                              {item.content}
                            </h2>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-[#334155]">
                              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">Published Quote</span>
                              <p className="text-[11px] font-extrabold text-[#1a73e8]">View Details</p>
                            </div>
                          </div>
                        )}

                        {/* Image Format */}
                        {(item.content_type === 'image' || item.content_type === 'image_quote') && (
                          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-400/70 dark:border-[#334155] transition-colors duration-300">
                            <div className="relative aspect-[4/5]">
                              <img
                                src={item.content.startsWith('http')
                                  ? item.content
                                  : `${import.meta.env.VITE_IMAGE_URL}${item.content.includes('/') ? item.content : '/uploads/content/' + item.content}`}
                                className="absolute inset-0 w-full h-full object-cover"
                                alt=""
                              />
                              <div className="absolute top-4 right-4">
                                <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">Published Image</span>
                              <p className="text-[11px] font-extrabold text-[#1a73e8]">View Details</p>
                            </div>
                          </div>
                        )}

                        {/* YouTube Format - Catch by type OR by link detection */}
                        {(item.content_type === 'youtube' || item.content_type === 'video' || extractYouTubeId(item.content)) && (
                          <div className="bg-white dark:bg-[#1E293B] rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-400/70 dark:border-[#334155] transition-colors duration-300">
                            <div className="aspect-video bg-black">
                              {extractYouTubeId(item.content) ? (
                                <iframe
                                  className="w-full h-full"
                                  src={`https://www.youtube.com/embed/${extractYouTubeId(item.content)}`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white bg-gray-900 text-[12px] font-bold">
                                  {item.content}
                                </div>
                              )}
                            </div>
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                  YouTube Post
                                </span>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-[#334155]">
                                <p className="text-[11px] font-medium text-gray-400 truncate max-w-[200px]">{item.content}</p>
                                <p className="text-[11px] font-extrabold text-[#1a73e8] shrink-0 ml-4">View Details</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* URL / Link Format */}
                        {(item.content_type === 'url') && (
                          <div
                            onClick={() => window.open(item.content, '_blank')}
                            className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-400/70 dark:border-[#334155] flex items-center gap-6 cursor-pointer active:scale-[0.98] transition-all"
                          >
                            <div className="w-14 h-14 rounded-[20px] bg-blue-50 dark:bg-[#0F172A] flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[15px] font-black text-[#1e293b] dark:text-[#F8FAFC]">Published Link</h3>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-[12px] font-medium text-gray-400 truncate">{item.content}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-400/70">
                    <p className="text-gray-400 font-bold">No content found for this audience</p>
                  </div>
                )}

                {/* Load More Button */}
                {hasMoreContent && publishedContent.length >= 5 && (
                  <div className="flex justify-center pt-2 pb-10">
                    <button
                      onClick={loadMoreLibrary}
                      disabled={isFetchingMoreContents}
                      className="px-8 py-3 bg-white border-2 border-gray-300 rounded-full text-[13px] font-black text-[#1a73e8] shadow-sm hover:border-gray-200 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isFetchingMoreContents ? (
                        <div className="w-4 h-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      )}
                      {isFetchingMoreContents ? 'Loading...' : 'Load More Content'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback Toasts */}
          <AnimatePresence>
            {(successMessage || errorMessage) && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${successMessage ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                  }`}
              >
                <span className="text-[14px] font-bold">{successMessage || errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Reusable Counsellor Bottom Navigation */}
      <CounsellorBottomNavigation />

    </div>
  );
};

export default CounsellorAddContent;
