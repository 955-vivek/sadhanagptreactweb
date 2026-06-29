import React from 'react';

const EditChoiceModal = ({ schemeName, onClose, onEditInPlace, onFork }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[360px] bg-[#112240] rounded-[24px] p-6 shadow-2xl border border-[rgba(255,255,255,0.06)] animate-in zoom-in-95 fade-in duration-200">
        <h2 className="text-white text-[16px] font-medium mb-[16px]">Edit Scheme</h2>
        <p className="text-[13px] text-[#6b7a99] mb-[24px]">
          How would you like to edit <strong className="text-white font-medium">"{schemeName}"</strong>?
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={onEditInPlace}
            className="w-full flex items-center gap-3 p-4 rounded-[12px] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.05)] text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div>
              <div className="text-white text-[14px] font-medium">Edit this scheme</div>
              <div className="text-[#6b7a99] text-[12px] mt-0.5">Update the current grading rules directly</div>
            </div>
          </button>
          
          <button 
            onClick={onFork}
            className="w-full flex items-center gap-3 p-4 rounded-[12px] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.05)] text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
            </div>
            <div>
              <div className="text-white text-[14px] font-medium">Create a new scheme from this</div>
              <div className="text-[#6b7a99] text-[12px] mt-0.5">Use as a template to create a new scheme</div>
            </div>
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditChoiceModal;
