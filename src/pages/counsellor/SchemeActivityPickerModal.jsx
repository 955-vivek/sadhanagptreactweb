import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivities } from '../../api/markingSchemes';

const SchemeActivityPickerModal = ({ onClose, onApply }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Config State
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [badgeType, setBadgeType] = useState('Daily');
  const [maxMarks, setMaxMarks] = useState(25);
  const [conditionRows, setConditionRows] = useState([{ condition: '', marks: 0 }]);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getActivities();
        setActivities(res.activities || []);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setError("Failed to load activities. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  const handleSelectActivity = (act) => {
    setSelectedActivity(act);
  };

  const handleAddCondition = () => {
    if (conditionRows.length < 6) {
      setConditionRows([...conditionRows, { condition: '', marks: 0 }]);
    }
  };

  const handleRemoveCondition = (index) => {
    if (conditionRows.length > 1) {
      setConditionRows(conditionRows.filter((_, i) => i !== index));
    }
  };

  const handleConditionChange = (index, field, value) => {
    const newRows = [...conditionRows];
    newRows[index][field] = value;
    setConditionRows(newRows);
  };

  const isConfigValid = () => {
    return conditionRows.some(row => row.condition.trim() !== '' && row.marks !== '');
  };

  const handleApply = () => {
    onApply({
      id: selectedActivity.id + '_' + Date.now(),
      title: selectedActivity.name || selectedActivity.title,
      icon: selectedActivity.icon,
      maxMarks,
      badge: badgeType,
      rows: conditionRows.filter(r => r.condition.trim() !== '')
    });
  };

  const filteredActivities = activities.filter(a => {
    const actName = a.name || a.title || '';
    return actName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderStepIndicator = (title) => (
    <div className="flex flex-col items-center mb-6 w-full shrink-0">
      <h2 className="text-white text-[16px] font-medium mb-3">{title}</h2>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step >= s ? 'bg-[#1de9b6]' : 'bg-[rgba(255,255,255,0.1)]'}`} />
            {s < 3 && <div className={`w-6 h-[2px] transition-colors ${step > s ? 'bg-[#1de9b6]' : 'bg-[rgba(255,255,255,0.05)]'}`} />}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[400px] h-[85vh] sm:h-auto sm:max-h-[85vh] bg-[#0b1628] rounded-[28px] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:fade-in duration-200 ease-out shadow-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">

        {/* Drag Handle (Mobile only) */}
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="w-[36px] h-[4px] rounded-full bg-[rgba(255,255,255,0.15)]" />
        </div>

        {/* Internal Content Wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden p-5 pt-2 sm:pt-6">

          {step === 1 && (
            <>
              {renderStepIndicator("Add Activity")}

              {/* Search */}
              <div className="relative mb-[16px] shrink-0">
                <svg className="absolute left-[14px] top-[12px] w-[16px] h-[16px] text-[#6b7a99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#112240] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[10px] pl-[40px] text-[14px] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#1de9b6] transition-colors"
                />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="text-center py-6 text-[#6b7a99] text-[13px]">Loading...</div>
                ) : error ? (
                  <div className="text-center py-6 text-red-400 text-[13px]">{error}</div>
                ) : filteredActivities.length > 0 ? (
                  filteredActivities.map(act => {
                    const isSelected = selectedActivity?.id === act.id;
                    return (
                      <div
                        key={act.id}
                        onClick={() => handleSelectActivity(act)}
                        className={`flex items-center justify-between p-3 rounded-[12px] border cursor-pointer transition-colors ${isSelected ? 'bg-[rgba(29,233,182,0.05)] border-[#1de9b6]' : 'bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.03)]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(29,233,182,0.12)] flex items-center justify-center text-[#1de9b6]">
                            {act.icon.startsWith('ti-') ? <i className={act.icon + " text-[18px]"}></i> : <span className="text-[18px]">{act.icon}</span>}
                          </div>
                          <span className={`text-[14px] font-medium ${isSelected ? 'text-[#1de9b6]' : 'text-white'}`}>{act.name || act.title}</span>
                        </div>
                        <div className={`w-[20px] h-[20px] rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'border-[#1de9b6] bg-[#1de9b6]' : 'border-[#3d4f70]'}`}>
                          {isSelected && <svg className="w-3 h-3 text-[#0b1628]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-[#6b7a99] text-[13px]">No activities found</div>
                )}
              </div>

              {/* Footer link & Buttons */}
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] shrink-0 space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/counsellor/activities');
                  }}
                  className="w-full text-center text-[12px] text-[#6b7a99] hover:text-[#1de9b6] transition-colors py-1"
                >
                  If you don't find activity here, create one
                </button>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedActivity}
                    className="flex-1 py-3.5 rounded-[12px] bg-[#1de9b6] text-[#042C53] text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {renderStepIndicator("Configure Activity")}

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {/* Toggle Daily / Weekly */}
                <div className="bg-[#112240] p-1 rounded-[12px] flex mb-6 border border-[rgba(255,255,255,0.06)]">
                  {['Daily', 'Weekly'].map(type => (
                    <button
                      key={type}
                      onClick={() => setBadgeType(type)}
                      className={`flex-1 py-2 rounded-[8px] text-[13px] font-medium transition-all ${badgeType === type
                          ? 'bg-[#1de9b6] text-[#042C53] shadow-sm'
                          : 'text-[#6b7a99] hover:text-white'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Max Marks Stepper */}
                <div className="flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-4 mb-6">
                  <div>
                    <div className="text-[13px] font-medium text-white">Max Possible Marks</div>
                    <div className="text-[11px] text-[#6b7a99] mt-0.5">Maximum points for this activity</div>
                  </div>
                  <div className="flex items-center gap-3 bg-[#112240] rounded-full px-2 py-1 border border-[rgba(255,255,255,0.06)]">
                    <button
                      onClick={() => setMaxMarks(Math.max(0, maxMarks - 5))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#6b7a99] hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors"
                    >
                      –
                    </button>
                    <span className="text-[14px] font-semibold text-[#1de9b6] w-[24px] text-center">{maxMarks}</span>
                    <button
                      onClick={() => setMaxMarks(maxMarks + 5)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#6b7a99] hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Conditions List */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[13px] font-medium text-[#8899bb]">Conditions & Marks</h3>
                    <span className="text-[11px] text-[#3d4f70]">{conditionRows.length}/6 rows</span>
                  </div>

                  <div className="space-y-2">
                    {conditionRows.map((row, index) => (
                      <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Up to 04:45"
                          value={row.condition}
                          onChange={(e) => handleConditionChange(index, 'condition', e.target.value)}
                          className="flex-[2] sm:flex-1 bg-[#112240] border border-[rgba(255,255,255,0.1)] rounded-[10px] p-[10px] text-[13px] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#1de9b6] transition-colors min-w-[120px]"
                        />
                        <input
                          type="number"
                          placeholder="pts"
                          value={row.marks}
                          onChange={(e) => handleConditionChange(index, 'marks', e.target.value ? Number(e.target.value) : '')}
                          className="w-[70px] bg-[#112240] border border-[rgba(255,255,255,0.1)] rounded-[10px] p-[10px] text-center text-[13px] font-medium text-[#1de9b6] focus:outline-none focus:border-[#1de9b6] transition-colors"
                        />
                        {conditionRows.length > 1 ? (
                          <button
                            onClick={() => handleRemoveCondition(index)}
                            className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[#6b7a99] hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        ) : (
                          <div className="w-[32px] shrink-0 hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>

                  {conditionRows.length < 6 && (
                    <button
                      onClick={handleAddCondition}
                      className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-[#1de9b6] hover:opacity-80 transition-opacity px-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      Add condition
                    </button>
                  )}
                </div>
              </div>

              {/* Config Footer */}
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] shrink-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3.5 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3.5 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    >
                      Back
                    </button>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!isConfigValid()}
                    className="flex-[1.2] py-3.5 rounded-[12px] bg-[#1de9b6] text-[#042C53] text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {renderStepIndicator("Confirm Activity")}

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div className="bg-[#112240] rounded-[16px] p-5 border border-[rgba(255,255,255,0.06)] flex flex-col items-center text-center">
                  <div className="w-[64px] h-[64px] rounded-[16px] bg-[rgba(29,233,182,0.12)] flex items-center justify-center text-[#1de9b6] mb-4">
                    {selectedActivity?.icon.startsWith('ti-') ? <i className={selectedActivity.icon + " text-[32px]"}></i> : <span className="text-[32px]">{selectedActivity?.icon}</span>}
                  </div>
                  <h3 className="text-[18px] font-bold text-white mb-1">{selectedActivity?.name || selectedActivity?.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)] text-[12px] text-[#8899bb]">{badgeType}</span>
                    <span className="px-2.5 py-1 rounded-full bg-[rgba(29,233,182,0.1)] text-[12px] text-[#1de9b6] font-medium">{maxMarks} Max Marks</span>
                  </div>

                  <div className="w-full mt-4 text-left">
                    <h4 className="text-[13px] font-medium text-[#8899bb] mb-3 px-1 border-b border-[rgba(255,255,255,0.05)] pb-2">Configured Conditions ({conditionRows.filter(r => r.condition.trim() !== '').length})</h4>
                    <div className="space-y-2">
                      {conditionRows.filter(r => r.condition.trim() !== '').map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-[rgba(255,255,255,0.03)] px-3 py-2.5 rounded-[10px]">
                          <span className="text-[13px] text-white">{row.condition}</span>
                          <span className="text-[13px] font-medium text-[#1de9b6]">+{row.marks} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Config Footer */}
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] shrink-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3.5 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3.5 rounded-[12px] bg-[rgba(255,255,255,0.05)] text-white text-[14px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    >
                      Back
                    </button>
                  </div>
                  <button
                    onClick={handleApply}
                    className="flex-[1.2] py-3.5 rounded-[12px] bg-[#1de9b6] text-[#042C53] text-[14px] font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1de9b6]/20"
                  >
                    ADD
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default SchemeActivityPickerModal;
