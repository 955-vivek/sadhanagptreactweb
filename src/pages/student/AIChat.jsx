import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import BottomNavigation from '../../components/student/BottomNavigation';
import { getRequest } from '../../services/api';

// ✅ Outside component
// ✅ Direct Google Gemini 2.0 Flash Integration
const callAI = async (messages) => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    // Using v1beta as it supports gemini-2.0-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

    // Map roles to Gemini format (user -> user, ai/assistant -> model)
    const contents = messages.map(m => ({
        role: m.role === 'model' || m.role === 'ai' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ contents })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "AI request failed");
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Empty response from AI");
    }

    return data.candidates[0].content.parts[0].text;
};

// ✅ Premium Markdown Renderer with Section Cards
const MarkdownMessage = ({ text }) => {
    const renderInline = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-black text-[#1a73e8]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-gray-600">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const renderLine = (line, idx) => {
        const cleanLine = line.trim();
        if (!cleanLine) return <div key={idx} className="h-3" />;

        // Primary Headers (##)
        if (line.startsWith('## ')) {
            const title = line.replace('## ', '');
            const isRoutine = title.toLowerCase().includes('routine');
            return (
                <div key={idx} className={`mt-8 mb-4 flex items-center gap-3 ${isRoutine ? 'text-[#8b5cf6]' : 'text-[#1a73e8]'}`}>
                    <div className={`w-1.5 h-6 rounded-full ${isRoutine ? 'bg-[#8b5cf6]' : 'bg-[#1a73e8]'}`} />
                    <h2 className="text-[17px] font-black uppercase tracking-tight">{title}</h2>
                </div>
            );
        }

        // Section Cards (detecting bold headers like **Strengths:**)
        if (cleanLine.startsWith('**') && cleanLine.endsWith(':**')) {
            const title = cleanLine.replace(/\*\*|:/g, '');
            const isStrength = title.toLowerCase().includes('strength');
            const isConflict = title.toLowerCase().includes('conflict') || title.toLowerCase().includes('improvement');
            
            return (
                <div key={idx} className={`mt-5 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit ${
                    isStrength ? 'bg-green-50 text-green-700' : 
                    isConflict ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'
                }`}>
                    <span className="text-[14px]">
                       {isStrength ? '✨' : isConflict ? '🎯' : '📝'}
                    </span>
                    <span className="text-[12px] font-black uppercase tracking-widest">{title}</span>
                </div>
            );
        }

        // Lists
        if (line.match(/^[\*\-]\s+/)) {
            const content = line.replace(/^[\*\-]\s+/, '');
            return (
                <div key={idx} className="flex items-start gap-3 my-2.5 pl-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mt-[8px] shrink-0" />
                    <p className="text-[14.5px] leading-[1.6] text-[#334155] font-bold">
                        {renderInline(content)}
                    </p>
                </div>
            );
        }

        // Numbered Lists
        if (line.match(/^\d+\.\s+/)) {
            const num = line.match(/^(\d+)\./)[1];
            const content = line.replace(/^\d+\.\s+/, '');
            return (
                <div key={idx} className="bg-white border border-gray-100 rounded-[20px] p-4 my-3 shadow-sm flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#1a73e8] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {num}
                    </span>
                    <p className="text-[14px] leading-relaxed text-[#334155] font-bold">
                        {renderInline(content)}
                    </p>
                </div>
            );
        }

        return (
            <p key={idx} className="text-[14.5px] leading-[1.7] text-[#475569] my-1.5 font-bold">
                {renderInline(line)}
            </p>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {text.split('\n').map((line, idx) => renderLine(line, idx))}
        </div>
    );
};

const AIChat = () => {
    const navigate = useNavigate();
    const { userDetails } = useOutletContext();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        let isMounted = true;
        const initAnalysis = async () => {
            if (!userDetails?.user_id || analyticsData) return;
            
            // Initial greeting
            setMessages([{
                role: 'ai',
                text: `Hare Krishna, ${userDetails?.name || 'there'}! How may I help you today?`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

            // Load data in background but keep loader OFF
            setIsTyping(false); 
            getRequest('/student-activities-analytics', { user_id: userDetails.user_id, filter: '2days' }, async (response) => {
                if (!isMounted) return;
                const rawData = response.data?.data || response.data;
                setAnalyticsData(rawData);
                setIsTyping(false); // Double check it stays off
            });
        };
        initAnalysis();
        return () => { isMounted = false; };
    }, [userDetails?.user_id]);

    const generateInitialAnalysis = async (data) => {
        setIsTyping(true);
        try {
            const prompt = `
                You are an advanced Behavioral & Spiritual AI Coach. 
                Analyze the following 2-day activity data for ${userDetails.name}:
                ${JSON.stringify(data || analyticsData)}

                Structure your response precisely:
                ## Behavioral and Spiritual Analysis:
                **Strengths:**
                * Bullet points...
                **Areas for Improvement/Conflict:**
                * Bullet points...

                ## Suggestion for a "Best Routine":
                Include structured timing and strategic core principles.
                
                Keep the tone professional, encouraging, and deeply insightful.
            `;

            const responseText = await callAI([{ role: 'user', content: prompt }]);

            setMessages(prev => [...prev, {
                role: 'ai',
                text: responseText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (err) {
            console.error("AI Analysis Error:", err);
            setMessages(prev => [...prev, { role: 'ai', text: `Analysis Error: ${err.message}`, time: 'Now' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async (e, directText = null) => {
        if (e) e.preventDefault();
        const messageText = directText || input;
        if (!messageText.trim() || isTyping) return;

        // Reset input immediately for better UX
        const userMsg = {
            role: 'user',
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setInput('');
        setMessages(prev => [...prev, userMsg]);

        // If user asks for an analysis
        if (messageText.toLowerCase().includes('analyze') || messageText.toLowerCase().includes('report')) {
            await generateInitialAnalysis(analyticsData);
            return;
        }

        setIsTyping(true);
        try {
            const systemContext = analyticsData
                ? `Context - Student's 2-day activity data: ${JSON.stringify(analyticsData)}\n\n`
                : '';

            const chatMessages = [
                ...messages.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: m.text
                })),
                { role: 'user', content: systemContext + messageText }
            ];

            const responseText = await callAI(chatMessages);

            setMessages(prev => [...prev, {
                role: 'ai',
                text: responseText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (err) {
            console.error("AI Chat Error:", err);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: "I'm unable to process that right now. Let's try again.",
                time: 'Now'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-40">
            <div className="w-full max-w-md mx-auto relative min-h-screen flex flex-col">

                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 py-5 max-w-md mx-auto shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#0f172a] hover:bg-gray-50 active:scale-90 transition-all border border-gray-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-[17px] font-black text-[#0f172a] leading-none tracking-tight">{userDetails?.name || ""}</h1>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse"></div>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Cognitive Analysis</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1a73e8]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 pt-28 px-4 space-y-5 overflow-y-auto pb-10">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                            >
                                {msg.role === 'ai' && (
                                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1a73e8] to-[#6366f1] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                )}

                                <div className={`max-w-[85%] rounded-[24px] shadow-sm ${
                                    msg.role === 'user'
                                        ? 'bg-[#1a73e8] rounded-tr-none px-5 py-4'
                                        : 'bg-white border border-gray-100 rounded-tl-none px-5 py-4'
                                }`}>
                                    {msg.role === 'user' ? (
                                        <p className="text-[15px] leading-relaxed font-semibold text-white">{msg.text}</p>
                                    ) : (
                                        <MarkdownMessage text={msg.text} />
                                    )}
                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-3 block ${
                                        msg.role === 'user' ? 'text-white/50' : 'text-gray-300'
                                    }`}>
                                        {msg.time}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div
                              key="typing-indicator" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                             exit={{ opacity: 0, scale: 0.9 }}
                             className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
     <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
     </div>
     <div className="bg-white border border-gray-100 px-5 py-4 rounded-[24px] rounded-tl-none">
     <div className="flex gap-1.5">
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} />
                    </AnimatePresence>
                </div>

                {/* Suggestion Chips */}
                {!isTyping && (
                    <div className="px-4 mb-3 flex gap-2 overflow-x-auto no-scrollbar">
                        {['Perform 2-Day Analysis', 'Best routine?', 'How to improve?'].map(chip => (
                            <button
                                key={chip}
                                onClick={() => handleSendMessage(null, chip)}
                                className="px-4 py-2 bg-white border border-gray-100 rounded-full text-[12px] font-black text-gray-500 whitespace-nowrap shadow-sm hover:border-blue-200 hover:text-[#1a73e8] transition-all"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Bar */}
                <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-4 pb-28">
                    <form onSubmit={handleSendMessage} className="relative max-w-md mx-auto">
                        <input
                            type="text"
                            placeholder="Deep dive into your progress..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-[#f8fafc] border-2 border-transparent focus:bg-white focus:border-blue-100 rounded-full py-4 pl-6 pr-14 text-[15px] font-bold text-[#0f172a] transition-all placeholder:text-gray-300 outline-none shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#1a73e8] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-all disabled:opacity-30"
                        >
                            <svg className="w-5 h-5 rotate-45 -mt-0.5 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9-7-9-7V11H3v2h9v4z" /></svg>
                        </button>
                    </form>
                </div>

            </div>
            <BottomNavigation />
        </div>
    );
};

export default AIChat;
