import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import BottomNavigation from '../../components/student/BottomNavigation';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { getRequest } from '../../services/api';

// Helper to extract YouTube Thumbnail instantly
const getYouTubeThumbnail = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`
    : '';
};

// Helper for native Web Share API
const handleShare = async (title, url) => {
  if (navigator.share) {
    try {
      await navigator.share({ title: title || 'Inspiration', text: 'Check this out!', url: url });
    } catch (err) {
      console.log('Error sharing', err);
    }
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  }
};

const Inspiration = () => {
  const { userDetails } = useOutletContext();
  const [activeFilter, setActiveFilter] = useState('All');
  const [inspirations, setInspirations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const filters = ['All', 'Quote', 'Video', 'Link', 'Image']; // Adjusted to match potential content_types

  const fetchInspirations = (pageNum = 1, append = false) => {
    if (!userDetails?.user_id) return;

    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    let typeParam = "";
    if (activeFilter === 'Quote') typeParam = "quote";
    else if (activeFilter === 'Video') typeParam = "youtube";
    else if (activeFilter === 'Link') typeParam = "url";
    else if (activeFilter === 'Image') typeParam = "image";

    const payload = {
      user_id: userDetails.user_id,
      page_no: pageNum,
      search_text: "",
      content_type: typeParam
    };

    getRequest('/student-content-list', payload, (res) => {
      const resData = res?.data;
      if (resData && resData.status === 1) {
        const newData = Array.isArray(resData.data) ? resData.data : (resData.data?.data || []);

        if (append) {
          setInspirations(prev => [...prev, ...newData]);
        } else {
          setInspirations(newData);
        }

        // If less than 5 items returned, assume no more content
        if (newData.length < 5) setHasMore(false);
        else setHasMore(true);
      }
      setIsLoading(false);
      setIsFetchingMore(false);
    });
  };

  useEffect(() => {
    setPage(1);
    fetchInspirations(1, false);
  }, [userDetails, activeFilter]);

  const loadMore = () => {
    if (isFetchingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchInspirations(nextPage, true);
  };

  const observerRef = useRef();
  const lastElementRef = useCallback(node => {
    if (isFetchingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchInspirations(nextPage, true);
          return nextPage;
        });
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isFetchingMore, hasMore, activeFilter, userDetails]);

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const filteredContent = inspirations; // Filtering now handled by API

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F172A] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <header className="px-6 pt-10 pb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight leading-tight">Daily Wisdom</h1>
            <p className="text-[14px] font-medium text-gray-400 mt-1">Tuesday, Oct 24</p>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            <button className="w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] shadow-sm flex items-center justify-center text-[#0f172a] dark:text-[#F8FAFC] active:scale-90 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="mb-8 flex flex-wrap gap-3 px-6 w-full">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all border ${activeFilter === filter
                ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-md dark:bg-blue-600 dark:border-blue-600'
                : 'bg-white dark:bg-[#1E293B] text-gray-500 dark:text-[#CBD5E1] border-blue-200 dark:border-[#475569] hover:border-blue-300 dark:hover:border-gray-500'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Content Feed */}
        <div className="px-6 space-y-8 min-h-[50vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading inspiration...</p>
            </div>
          ) : filteredContent.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredContent.map((item, idx) => {
                const isLast = idx === filteredContent.length - 1;
                return (
                  <motion.div
                    ref={isLast ? lastElementRef : null}
                    key={item.id || item.title || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.1 }}
                    className="w-full"
                  >
                    {/* Quote / Text Format */}
                    {(!item.content_type || item.content_type === 'text' || item.content_type === 'quote' || item.type === 'text') && (
                      <div className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-blue-200 dark:border-[#475569] border-l-8 border-l-blue-500">
                        <div className="mb-6 opacity-20 dark:text-[#F8FAFC]">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                        </div>
                        <h2 className="text-[22px] font-bold text-[#1e293b] dark:text-[#F8FAFC] leading-relaxed italic mb-8">
                          {item.content}
                        </h2>
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-[#334155]">
                          <span className="text-[11px] font-black text-gray-400 dark:text-[#CBD5E1] uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg">Daily Wisdom</span>
                          <button onClick={() => handleShare(item.content, window.location.href)} className="text-gray-400 hover:text-[#1e293b] dark:hover:text-[#F8FAFC] p-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Image Format */}
                    {(item.content_type === 'image' || item.content_type === 'image_quote') && (
                      <div className="relative rounded-[40px] overflow-hidden aspect-[4/5] shadow-2xl group border-4 border-white">
                        <img
                          src={item.content.startsWith('http')
                            ? item.content
                            : `${import.meta.env.VITE_IMAGE_URL}${item.content.includes('/') ? item.content : '/uploads/content/' + item.content}`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end">
                          <div className="flex justify-end pt-6">
                    ``        <button onClick={() => handleShare("Shared Image", item.content)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white/30 transition-all">
                              <svg className="w-5 h-5 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* YouTube Format */}
                    {(item.content_type === 'youtube') && (
                      <div className="bg-white dark:bg-[#1E293B] rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-blue-200 dark:border-[#475569]">
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
                            <div className="w-full h-full flex items-center justify-center text-white bg-gray-900 dark:bg-black">
                              Invalid Video URL
                            </div>
                          )}
                        </div>
                        <div className="p-8">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                              YouTube Lesson
                            </span>
                            <button onClick={() => handleShare("YouTube Inspiration", item.content)} className="text-gray-400 hover:text-[#1e293b] dark:hover:text-[#F8FAFC] p-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* URL / Link Format */}
                    {(item.content_type === 'url') && (
                      <div
                        onClick={() => window.open(item.content, '_blank')}
                        className="bg-white dark:bg-[#1E293B] rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-blue-200 dark:border-[#475569] flex items-center gap-6 cursor-pointer active:scale-[0.98] transition-all"
                      >
                        <div className="w-16 h-16 rounded-[24px] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[17px] font-black text-[#1e293b] dark:text-[#F8FAFC] leading-tight mb-2">Internal Resource</h3>
                          <p className="text-[13px] font-medium text-gray-400 dark:text-[#CBD5E1] truncate max-w-[180px]">{item.content}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 dark:text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="text-center pt-10">
              <p className="text-gray-500 font-medium text-lg">No content found</p>
            </div>
          )}
        </div>

        {/* Loading Spinner for Infinite Scroll */}
        {isFetchingMore && (
          <div className="flex justify-center pt-4 pb-10">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Inspiration;
