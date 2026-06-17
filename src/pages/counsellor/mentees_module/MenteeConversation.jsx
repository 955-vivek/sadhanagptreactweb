import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest, postRequest } from '../../../services/api';

const MenteeConversation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { userDetails } = useOutletContext();
  const studentInfo = location.state?.student || { name: 'Student' };

  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notesList, setNotesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editing state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const editorRef = useRef(null);

  const fetchNotes = () => {
    setIsLoading(true);
    getRequest('/student-notes-list', { student_id: id, user_id: userDetails?.user_id }, (res) => {
      if (res.data?.status === 1 || res.data?.success) {
        setNotesList(res.data.data || []);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (userDetails?.user_id) fetchNotes();
  }, [userDetails?.user_id, id]);

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleEditClick = (note) => {
    // Determine the ID field (it could be id or note_id depending on backend)
    const nid = note.id || note.note_id; 
    setEditingNoteId(nid);
    
    // Set date safely converting from UTC to local
    if (note.meeting_date) {
      const d = new Date(note.meeting_date);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      } else {
        setDate(String(note.meeting_date).split('T')[0]);
      }
    }
    
    if (editorRef.current) {
      editorRef.current.innerHTML = note.note_text || '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    const d = new Date();
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleDelete = (note) => {
    const nid = note.id || note.note_id;
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    
    postRequest('/delete-note', { note_id: nid, user_id: userDetails.user_id }, (res) => {
      if (res.data?.status === 1 || res.data?.success) {
        fetchNotes();
      } else {
        alert(res.data?.message || "Failed to delete note");
      }
    });
  };

  const handleSubmit = () => {
    const noteText = editorRef.current?.innerHTML || '';
    if (!noteText.trim() || noteText === '<br>') return;
    
    setIsSubmitting(true);
    
    if (editingNoteId) {
      postRequest('/edit-note', { 
        note_id: editingNoteId, 
        user_id: userDetails.user_id, 
        note_text: noteText, 
        meeting_date: date 
      }, (res) => {
        setIsSubmitting(false);
        if (res.data?.status === 1 || res.data?.success) {
          handleCancelEdit();
          fetchNotes();
        } else {
          alert(res.data?.message || "Failed to update note");
        }
      });
    } else {
      postRequest('/add-note', { 
        user_id: userDetails.user_id, 
        student_id: id, 
        note_text: noteText, 
        meeting_date: date 
      }, (res) => {
        setIsSubmitting(false);
        if (res.data?.status === 1 || res.data?.success) {
          handleCancelEdit();
          fetchNotes();
        } else {
          alert(res.data?.message || "Failed to save note");
        }
      });
    }
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    
    let y, m, d_day;
    const d = new Date(dateStr);
    
    // If it's a valid date, extract local time parts to counter UTC shift
    if (!isNaN(d.getTime())) {
      y = d.getFullYear();
      m = d.getMonth() + 1;
      d_day = d.getDate();
    } else {
      // Fallback for raw strings
      const datePart = String(dateStr).split('T')[0];
      if (!datePart.includes('-')) return dateStr;
      const parts = datePart.split('-');
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d_day = parseInt(parts[2], 10);
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${d_day}-${months[m - 1]}-${y}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] pb-28 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-[#334155] sticky top-0 z-10 px-6 py-6 flex items-center justify-between transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#334155] flex items-center justify-center text-gray-800 dark:text-[#F8FAFC] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-black text-gray-800 dark:text-[#F8FAFC]">Conversation Logs</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        
        {/* Header Info */}
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-[#334155] mb-6 flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            {studentInfo.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 dark:text-[#F8FAFC]">{studentInfo.name}</h2>
            <p className="text-xs font-bold text-gray-400 dark:text-[#94A3B8]">Log new discussion</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-6 mb-10">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Meeting Date</label>
            {editingNoteId && (
              <button onClick={handleCancelEdit} className="text-xs font-bold text-red-500 mr-2">Cancel Edit</button>
            )}
          </div>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="w-full bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-100 dark:border-[#334155] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-gray-800 dark:text-[#F8FAFC] [color-scheme:light] dark:[color-scheme:dark] transition-all"
          />

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Notes</label>
            
            {/* Custom Simple Editor Container */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden flex flex-col">
              
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#334155] border-b border-gray-100 dark:border-[#475569] transition-colors">
                <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#475569] rounded-lg text-gray-700 dark:text-[#F8FAFC] font-bold transition-colors">B</button>
                <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#475569] rounded-lg text-gray-700 dark:text-[#F8FAFC] italic transition-colors">I</button>
                <button onClick={() => handleFormat('underline')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#475569] rounded-lg text-gray-700 dark:text-[#F8FAFC] underline transition-colors">U</button>
                <div className="w-px h-4 bg-gray-300 dark:bg-[#475569] mx-1 transition-colors"></div>
                <button onClick={() => handleFormat('insertUnorderedList')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#475569] rounded-lg text-gray-700 dark:text-[#F8FAFC] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>

              {/* Editable Area */}
              <div 
                ref={editorRef}
                contentEditable={true}
                className="w-full min-h-[150px] p-4 outline-none font-medium text-gray-700 dark:text-[#F8FAFC] prose prose-sm dark:prose-invert max-w-none transition-colors"
                placeholder="Type your meeting notes here..."
              />
            </div>
            
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                editingNoteId ? 'Update Log' : 'Save Log'
              )}
            </button>
          </div>
        </div>

        {/* Past Logs List */}
        <div>
          <h3 className="text-sm font-black text-gray-800 dark:text-[#F8FAFC] mb-4 px-2">Past Conversations</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notesList.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-[#1E293B] rounded-3xl border border-dashed border-gray-200 dark:border-[#334155] transition-colors duration-300">
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold text-sm">No logs found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notesList.map((note) => (
                <div key={note.id || note.note_id} className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-[#334155] group transition-colors duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {formatDateLabel(note.meeting_date)}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(note)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(note)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div 
                    className="text-sm font-medium text-gray-700 dark:text-[#F8FAFC] prose prose-sm dark:prose-invert max-w-none leading-relaxed transition-colors"
                    dangerouslySetInnerHTML={{ __html: note.note_text }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MenteeConversation;
