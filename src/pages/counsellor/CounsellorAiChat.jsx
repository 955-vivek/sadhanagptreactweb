import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import { postRequest } from '../../services/api';
import ThemeToggle from '../../components/shared/ThemeToggle';

// Markdown Renderer Component
const MarkdownMessage = ({ text }) => {
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-gray-600 dark:text-gray-400">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const cleanLine = line.trim();
        if (!cleanLine) return <div key={idx} className="h-1" />;

        if (cleanLine.startsWith('### ')) {
          return <h3 key={idx} className="text-sm font-black text-blue-600 dark:text-blue-400 mt-3">{cleanLine.replace('### ', '')}</h3>;
        }

        if (cleanLine.match(/^[\*\-]\s+/)) {
          const content = cleanLine.replace(/^[\*\-]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-[7px] shrink-0" />
              <p className="text-[14px] leading-[1.6] text-gray-700 dark:text-gray-300 font-medium">
                {renderInline(content)}
              </p>
            </div>
          );
        }

        if (cleanLine.match(/^\d+\.\s+/)) {
          const num = cleanLine.match(/^(\d+)\./)[1];
          const content = cleanLine.replace(/^\d+\.\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 mt-2">
              <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-black flex items-center justify-center shrink-0">
                {num}
              </span>
              <p className="text-[14px] leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                {renderInline(content)}
              </p>
            </div>
          );
        }

        return <p key={idx} className="text-[14px] leading-[1.6] text-gray-700 dark:text-gray-300 font-medium">{renderInline(line)}</p>;
      })}
    </div>
  );
};

const SUGGESTED_PROMPTS = [
  "Top Performer",
  "Needs Attention",
  "Compare Students",
  "Health Scores",
  "Risk Analysis",
  "Recommendations",
  "Weekly Trends",
  "KPIs"
];

const CounsellorAiChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userDetails } = useOutletContext();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages, isAnalyzing]);

  useEffect(() => {
    if (hasInitialized) return;
    
    const { studentIds, fromDate, toDate } = location.state || {};
    
    if (studentIds && studentIds.length > 0) {
      setHasInitialized(true);
      
      const payload = {
        studentIds,
        fromDate,
        toDate,
        messages: [{ role: 'user', content: studentIds.length === 1 ? 'Hello, please analyze this student.' : 'Hello, please analyze these students.' }]
      };

      setIsAnalyzing(true);
      
      postRequest('/api/ai/chat', payload, (response) => {
        setIsAnalyzing(false);
        if (response?.data?.status === 1) {
          setMessages([
            { role: 'assistant', text: response.data.reply }
          ]);
        } else {
          const reason = response?.data?.errorType ? `\n\n**Reason:** \`${response.data.errorType}\`` : "";
          setMessages([
            { role: 'assistant', text: `AI Service Error: ${response?.data?.message || "I could not generate insights right now."}${reason}` }
          ]);
        }
      });
    }
  }, [location.state, hasInitialized]);

  const handleSendMessage = (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isAnalyzing) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnalyzing(true);

    const { studentIds, fromDate, toDate } = location.state || {};
    
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.text
    }));
    apiMessages.push({ role: 'user', content: textToSend });

    const payload = {
      studentIds,
      fromDate,
      toDate,
      messages: apiMessages
    };

    postRequest('/api/ai/chat', payload, (response) => {
      console.log('AI API Response:', response);
      console.log('Response Data:', response?.data);
      
      setIsAnalyzing(false);
      if (response?.data?.status === 1) {
        setMessages(prev => [...prev, { role: 'assistant', text: response.data.reply }]);
      } else {
        const reason = response?.data?.errorType ? `\n\n**Reason:** \`${response.data.errorType}\`` : "";
        setMessages(prev => [...prev, { role: 'assistant', text: `AI Service Error: ${response?.data?.message || "I could not generate insights right now."}${reason}` }]);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F172A] font-sans pb-40 transition-colors duration-300 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#1E293B] flex items-center justify-between px-6 py-4 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#CBD5E1] hover:bg-gray-50 dark:hover:bg-[#1E293B] active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-[18px] font-black text-[#0f172a] dark:text-[#F8FAFC] leading-none tracking-tight">AI Sadhana Mentor</h1>
            <p className="text-[11px] font-bold text-[#1a73e8] dark:text-blue-400 mt-1">Analyze, compare, and receive insights.</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Chat Area */}
      <div className="pt-24 px-4 md:px-8 flex-1 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
          >
            <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                {msg.role === 'user' ? (
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                ) : (
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-sm'}`}>
                {msg.role === 'user' ? (
                  <p className="text-[14px] font-medium leading-relaxed">{msg.text}</p>
                ) : (
                  <MarkdownMessage text={msg.text} />
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
            <div className="flex items-start gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              </div>
              <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2 shadow-sm">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500"></motion.span>
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500"></motion.span>
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500"></motion.span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar & Chips */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] dark:from-[#0F172A] dark:via-[#0F172A] to-transparent pt-10 pb-4 px-4 z-40 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Quick Action Chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-3 pb-1">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button 
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={isAnalyzing}
                className="whitespace-nowrap px-4 py-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-full text-[12px] font-bold text-gray-600 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="relative flex items-center shadow-lg rounded-2xl">
            <input 
              type="text"
              placeholder="Ask AI Sadhana Mentor..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-5 pr-14 text-[14px] font-bold text-[#0f172a] dark:text-[#F8FAFC] shadow-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={isAnalyzing || !input.trim()}
              className="absolute right-3 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-50 disabled:active:scale-100 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounsellorAiChat;
