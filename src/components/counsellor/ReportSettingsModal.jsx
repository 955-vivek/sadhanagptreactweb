import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import ExportAnalyticsModal from '../shared/ExportAnalyticsModal';

const ReportSettingsModal = ({ isOpen, onClose, userDetails, showToast, groups = [], onExportClick }) => {
  const [autoReportStatus, setAutoReportStatus] = useState(1);
  const [emailFrequencyDays, setEmailFrequencyDays] = useState(7);
  const [emailStartDate, setEmailStartDate] = useState('');
  const [emailEndDate, setEmailEndDate] = useState('');
  
  const [exportDuration, setExportDuration] = useState('7');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  
  const [reportGroupId, setReportGroupId] = useState('all');
  const [reportSubgroupId, setReportSubgroupId] = useState('all');
  const [labels, setLabels] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New States for Activity Reminders
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);

  // Fetch the latest parameters from the Profile API whenever the Gear Icon is clicked
  useEffect(() => {
    if (isOpen && userDetails?.user_id) {
      getRequest('/counslor-user-profile', { user_id: userDetails.user_id }, (response) => {
        const res = response?.data;
        if (res?.code === 200 || res?.status === 1 || res?.success) {
          const profile = res.data?.user || {};
          setAutoReportStatus(profile.auto_report_status === 1);
          const freq = profile.report_frequency_days;
          if (freq === -1) {
            setEmailFrequencyDays('custom');
            if (profile.email_start_date) setEmailStartDate(profile.email_start_date.split('T')[0]);
            if (profile.email_end_date) setEmailEndDate(profile.email_end_date.split('T')[0]);
          } else {
            setEmailFrequencyDays(freq || 7);
          }

          setReportGroupId(profile.report_group_id || 'all');
          setReportSubgroupId(profile.report_subgroup_id || 'all');
          
          setReminderEnabled(
            profile.reminder_enabled === 1 || profile.reminder_enabled === true ||
            profile.reminder_status === 1 || profile.reminder_status === true
          );
          setReminderDays(profile.reminder_days || 3);
        }
      });
    }
  }, [isOpen, userDetails]);

  useEffect(() => {
    if (reportGroupId && reportGroupId !== 'all' && userDetails?.user_id) {
      getRequest('/lable-list', { user_id: userDetails.user_id, center_id: reportGroupId }, (response) => {
        const res = response.data;
        if (res && res.code === 200 && Array.isArray(res.data)) {
          setLabels(res.data.map(l => ({ id: l.label_id, name: l.label_name })));
        }
      });
    } else {
      setLabels([]);
    }
  }, [reportGroupId, userDetails]);

  const handleToggleActivityReminders = async () => {
    const turningOn = !reminderEnabled;
    if (turningOn) {
      setReminderEnabled(true);
      postRequest('/update-reminder-preferences', {
        user_id: userDetails.user_id,
        reminder_enabled: true,
        reminder_days: reminderDays || 3
      }, (res) => {
        if (res.data?.status !== 1 && !res.data?.success && res.data?.code !== 200) {
          showToast('Failed to update reminder settings.', 'error');
          setReminderEnabled(false);
        }
      });
    } else {
      setReminderEnabled(false);
      postRequest('/update-reminder-preferences', {
        user_id: userDetails.user_id,
        reminder_enabled: false,
        reminder_days: reminderDays || 3
      }, (res) => {
        if (res.data?.status !== 1 && !res.data?.success && res.data?.code !== 200) {
          showToast('Failed to update reminder settings.', 'error');
          setReminderEnabled(true); // Revert on failure
        }
      });
    }
  };

  const handleSave = () => {
    setIsSubmitting(true);

    const emailPayload = {
      user_id: userDetails.user_id,
      auto_report_status: autoReportStatus ? 1 : 0,
      report_frequency_days: emailFrequencyDays === 'custom' ? -1 : Number(emailFrequencyDays),
      email_start_date: emailFrequencyDays === 'custom' ? emailStartDate : null,
      email_end_date: emailFrequencyDays === 'custom' ? emailEndDate : null,
      report_group_id: reportGroupId,
      report_subgroup_id: reportSubgroupId
    };

    const reminderPayload = {
      user_id: userDetails.user_id,
      reminder_enabled: reminderEnabled ? 1 : 0,
      reminder_days: reminderDays
    };

    Promise.all([
      new Promise(resolve => postRequest('/toggle-email-report', emailPayload, resolve)),
      new Promise(resolve => postRequest('/update-reminder-preferences', reminderPayload, resolve))
    ]).then(([emailRes, reminderRes]) => {
      setIsSubmitting(false);
      showToast("Settings updated successfully!", "success");
      onClose();
    }).catch(() => {
      setIsSubmitting(false);
      showToast("Failed to update settings.", "error");
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-0">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#0F172A] rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-colors duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a73e8] to-[#2563eb] px-6 py-5 flex items-center justify-between shadow-md z-10">
            <h2 className="text-xl font-bold text-white tracking-tight">Report Settings</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh] custom-scrollbar">

            {/* Filter Area - Now always active */}
            <div className="space-y-4">
              
              {/* Group Select */}
              <div>
                <label className="block text-[#0f172a] dark:text-[#F8FAFC] font-bold text-sm mb-1.5">Group Filter</label>
                <select
                  value={reportGroupId}
                  onChange={(e) => {
                    setReportGroupId(e.target.value);
                    setReportSubgroupId('all');
                  }}
                  className="w-full bg-gray-50 dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] text-gray-900 dark:text-[#F8FAFC] text-sm rounded-xl focus:ring-[#1a73e8] focus:border-[#1a73e8] block p-3 font-medium outline-none transition-colors duration-300"
                >
                  <option value="all">All Groups</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              {/* Sub-group Select */}
              {reportGroupId !== 'all' && labels.length > 0 && (
                <div>
                  <label className="block text-[#0f172a] dark:text-[#F8FAFC] font-bold text-sm mb-1.5">Sub-Group Filter</label>
                  <select
                    value={reportSubgroupId}
                    onChange={(e) => setReportSubgroupId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] text-gray-900 dark:text-[#F8FAFC] text-sm rounded-xl focus:ring-[#1a73e8] focus:border-[#1a73e8] block p-3 font-medium outline-none transition-colors duration-300"
                  >
                    <option value="all">All Sub-Groups</option>
                    {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              {/* Frequency Selector for Export */}
              <div>
                <label className="block text-[#0f172a] dark:text-[#F8FAFC] font-bold text-sm mb-1.5">Report Duration</label>
                <select
                  value={exportDuration}
                  onChange={(e) => setExportDuration(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] text-gray-900 dark:text-[#F8FAFC] text-sm rounded-xl focus:ring-[#1a73e8] focus:border-[#1a73e8] block p-3 font-medium outline-none transition-colors duration-300 mb-2"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="custom">Custom Range</option>
                </select>

                {exportDuration === 'custom' && (
                  <div className="flex gap-2 items-center bg-gray-50 dark:bg-[#1E293B] p-2 rounded-xl border border-gray-300 dark:border-[#334155] mt-2">
                    <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full bg-transparent outline-none dark:text-white dark:[color-scheme:dark] text-sm" />
                    <span className="text-gray-400 font-bold text-sm">to</span>
                    <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full bg-transparent outline-none dark:text-white dark:[color-scheme:dark] text-sm text-right" />
                  </div>
                )}
              </div>
            </div>

            {/* Export Button based on Filters */}
            <button
              onClick={() => onExportClick && onExportClick(reportGroupId, reportSubgroupId, { duration: exportDuration, startDate: exportStartDate, endDate: exportEndDate })}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-[#0f172a] dark:text-[#F8FAFC] font-bold py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Report Data
            </button>

            {/* Email Reports Toggle - Moved Below Export Button */}
            <div className="flex flex-col mt-6 pt-6 border-t border-gray-200 dark:border-gray-800/60 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[#0f172a] dark:text-[#F8FAFC] font-bold">Email Reports</h3>
                  <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Receive automated CSV mentee logs</p>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoReportStatus ? 'bg-[#1a73e8]' : 'bg-gray-200 dark:bg-[#334155]'}`}
                  onClick={() => setAutoReportStatus(prev => !prev ? 1 : 0)}
                >
                  <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoReportStatus ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Email Report Duration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#0f172a] dark:text-[#F8FAFC] font-bold text-sm">Automated Report Duration</label>
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {emailFrequencyDays === 'custom' ? 'Custom' : `${emailFrequencyDays} Days`}
                  </span>
                </div>
                <div className="space-y-3">
                  <select
                    value={emailFrequencyDays}
                    onChange={(e) => setEmailFrequencyDays(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] text-gray-900 dark:text-[#F8FAFC] text-sm rounded-xl focus:ring-[#1a73e8] focus:border-[#1a73e8] block p-3 font-medium outline-none transition-colors duration-300"
                  >
                    <option value={2}>2 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                    <option value="custom">Custom Date Range</option>
                  </select>

                  {emailFrequencyDays === 'custom' && (
                    <div className="flex gap-2 items-center bg-gray-50 dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] rounded-xl p-2.5">
                      <input 
                        type="date" 
                        value={emailStartDate} 
                        onChange={e => setEmailStartDate(e.target.value)} 
                        className="w-full bg-transparent outline-none dark:text-white dark:[color-scheme:dark] text-sm" 
                      />
                      <span className="text-gray-400 font-bold text-sm">to</span>
                      <input 
                        type="date" 
                        value={emailEndDate} 
                        onChange={e => setEmailEndDate(e.target.value)} 
                        className="w-full bg-transparent outline-none dark:text-white dark:[color-scheme:dark] text-sm text-right" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1a73e8]/30 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Settings...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportSettingsModal;
