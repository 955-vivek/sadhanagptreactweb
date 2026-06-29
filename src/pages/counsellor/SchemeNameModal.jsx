import React, { useState } from 'react';

const SchemeNameModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[320px] bg-[#112240] rounded-[24px] p-6 shadow-2xl border border-[rgba(255,255,255,0.06)] animate-in zoom-in-95 fade-in duration-200">
        <h2 className="text-white text-[16px] font-medium mb-[16px] text-center">Name this scheme</h2>
        
        <input 
          type="text"
          autoFocus
          placeholder="e.g. My Special Scheme"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#0b1628] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[12px] text-[14px] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#1de9b6] transition-colors mb-[20px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
        />
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-[12px] bg-[#1de9b6] text-[#042C53] text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchemeNameModal;
