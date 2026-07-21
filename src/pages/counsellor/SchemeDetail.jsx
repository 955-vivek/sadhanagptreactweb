import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { getSchemes, getSchemeActivities, saveScheme, deleteActivityFromScheme, deleteScheme } from '../../api/markingSchemes';
import SchemeActivityPickerModal from './SchemeActivityPickerModal';
import SchemeNameModal from './SchemeNameModal';
import EditChoiceModal from './EditChoiceModal';
import ConfirmModal from '../../components/shared/ConfirmModal';

const getBadgeStyles = (type) => {
  if (type === 'Daily') return 'bg-[rgba(29,233,182,0.12)] text-[#1de9b6]';
  if (type === 'Weekly') return 'bg-[rgba(239,159,39,0.12)] text-[#EF9F27]';
  return 'bg-[rgba(255,255,255,0.1)] text-[#6b7a99]';
};

const parseCondition = (conditionStr) => {
  const opMap = {
    '>=': 'At least',
    '<=': 'Upto',
    '>': 'After',
    '<': 'Before'
  };

  const str = (conditionStr || '').trim();
  
  for (const [op, text] of Object.entries(opMap)) {
    if (str.startsWith(op)) {
      let remainder = str.substring(op.length).trim();
      remainder = remainder.replace(/\bboolean\b/gi, 'days');
      return { value: remainder, rule: text };
    }
  }

  // Fallback for word-based rules if they already exist
  const rules = ["Before", "After", "Up To", "Up to", "At Least", "Exact Time", "Yes", "No"];
  const lowerStr = str.toLowerCase();
  
  for (const rule of rules) {
    const lowerRule = rule.toLowerCase();
    if (lowerStr.startsWith(lowerRule)) {
      let remainder = str.substring(rule.length).trim();
      remainder = remainder.replace(/\bboolean\b/gi, 'days');
      let titleCaseRule = rule.toLowerCase() === "up to" ? "Up To" : rule;
      titleCaseRule = titleCaseRule.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      return { value: remainder || str, rule: titleCaseRule };
    }
  }
  
  if (str) console.warn(`Unrecognized condition format: "${str}"`);
  return { value: str.replace(/\bboolean\b/gi, 'days'), rule: "" };
};

const CONDITION_OPTIONS = {
  time: [
    { label: "Before", symbol: "<=", value: "Before" },
    { label: "After", symbol: ">=", value: "After" },
    { label: "Exact Time", symbol: "=", value: "Exact Time" }
  ],
  minNumb: [
    { label: "At Least", symbol: ">=", value: "At Least" },
    { label: "Up To", symbol: "<=", value: "Up To" }
  ],
  yesNo: [
    { label: "Yes", symbol: "=", value: "Yes" },
    { label: "No", symbol: "=", value: "No" }
  ]
};

const getOptionsForRule = (rule) => {
  if (["Before", "After", "Exact Time"].includes(rule)) return CONDITION_OPTIONS.time;
  if (["At Least", "Up To", "Up to"].includes(rule)) return CONDITION_OPTIONS.minNumb;
  if (["Yes", "No"].includes(rule)) return CONDITION_OPTIONS.yesNo;
  return [];
};


const SchemeTable = ({ data, isEditing, onDelete, onRowMarkChange, onRowConditionChange, onMaxMarksChange }) => {
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [openRuleDropdownIdx, setOpenRuleDropdownIdx] = useState(null);
  const options = Array.from({ length: Math.floor((data.maxMarks || 0) / 5) + 1 }, (_, i) => i * 5).reverse();

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[16px] p-[12px] sm:p-[14px] mb-4 md:mb-0 w-full max-w-full box-border border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] break-words">

      {/* Card Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <span className="text-[16px] leading-none">{data.icon}</span>
          <div className="flex flex-col gap-[4px]">
            <h3 className="font-semibold text-[13px] sm:text-[14px] text-[#0F172A] dark:text-white leading-none">{data.title}</h3>
            {data.badge && (
              <div className="flex gap-[4px]">
                {data.badge.split(' + ').map(b => (
                  <span key={b} className={`text-[10px] rounded-[20px] px-[6px] py-[2px] ${getBadgeStyles(b)} leading-none font-medium`}>{b}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center h-8 gap-3">
          <div className="flex items-center rounded-full bg-[#059669]/10 dark:bg-[rgba(0,212,170,0.15)] text-[#059669] dark:text-[#00D4AA] text-[12px] font-semibold border border-transparent px-1 py-0.5">
            {isEditing && (
              <button
                onClick={() => {
                  if (data.maxMarks > 5) onMaxMarksChange(data.id, data.maxMarks - 5);
                }}
                disabled={data.maxMarks <= 5}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
              </button>
            )}
            <span className="px-2">{data.maxMarks} pts</span>
            {isEditing && (
              <button
                onClick={() => onMaxMarksChange(data.id, data.maxMarks + 5)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
          </div>
          {isEditing && (
            <button
              onClick={() => onDelete(data.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7a99] hover:bg-red-500/10 hover:text-red-400 transition-colors bg-[rgba(255,255,255,0.03)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="pt-2 flex-1 flex flex-col relative">
        {data.subTables ? (
          <div className="flex flex-col flex-1 relative gap-[8px]">
            {data.subTables.map((sub, sIdx) => (
              <div key={sIdx}>
                <h4 className="text-[9px] text-[#6b7a99] font-medium mb-[4px]">{sub.subHeader}</h4>
                <div className="grid grid-cols-3 gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">{sub.headers ? sub.headers[0] : 'Condition-Values'}</div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Conditions</div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider text-right sm:text-left sm:pl-6">{sub.headers ? sub.headers[1] : 'Marks'}</div>
                </div>
                <div className="flex flex-col">
                  {sub.rows.map((row, idx) => {
                    const isPositive = row.marks > 0;
                    const isZero = row.marks === 0;
                    const isNegative = row.marks < 0;
                    const isLastRow = idx === sub.rows.length - 1;
                    const canEdit = isEditing && !isLastRow && !isNegative;
                    let marksColor = isPositive ? 'text-[#059669] dark:text-[#00D4AA]' : isZero ? 'text-[#64748B] dark:text-[#94A3B8]' : 'text-[#DC2626] dark:text-[#FF5C5C]';
                    const parsed = parseCondition(row.condition);
                    const dropdownKey = `sub-${sIdx}-${idx}`;

                    const isYesNo = (data.type || '').toLowerCase().includes('yes') || ["Yes", "No"].includes(parsed.rule);
                    const isTime = (data.type || '').toLowerCase() === 'time' || String(parsed.value).includes(':');
                    const inputType = isTime ? 'time' : 'number';

                    let displayValue = parsed.value;
                    let displaySuffix = '';

                    if (inputType === 'number') {
                      const match = String(parsed.value).match(/^-?\d*\.?\d+/);
                      if (match) {
                        displayValue = match[0];
                        displaySuffix = String(parsed.value).substring(match[0].length);
                      }
                    }

                    return (
                      <div key={idx} className="relative grid grid-cols-3 gap-2 items-center min-h-[28px] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] last:border-0 hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-200 px-2 -mx-2 rounded-lg py-[2px]">
                        <div className="relative flex items-center pr-2">
                          {canEdit && !isYesNo ? (
                            <div className="flex items-center w-full">
                              <input
                                type={inputType}
                                value={displayValue}
                                onChange={(e) => {
                                  const newCondition = `${parsed.rule} ${e.target.value}${displaySuffix}`.trim();
                                  onRowConditionChange(data.id, sIdx, idx, newCondition);
                                }}
                                className="w-[60%] min-w-[40px] bg-slate-100 dark:bg-white/5 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-teal-500 dark:focus:border-[#1de9b6] rounded px-1.5 py-0.5 text-[11px] text-[#0F172A] dark:text-gray-200 outline-none transition-colors"
                              />
                              {displaySuffix && (
                                <span className="ml-1 text-[11px] text-[#0F172A] dark:text-gray-200 whitespace-nowrap">{displaySuffix.trim()}</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#0F172A] dark:text-gray-200 font-medium truncate">{parsed.value}</div>
                          )}
                        </div>
                        
                        <div className="relative flex items-center">
                          <div
                            onClick={() => canEdit && getOptionsForRule(parsed.rule).length > 0 ? setOpenRuleDropdownIdx(openRuleDropdownIdx === dropdownKey ? null : dropdownKey) : null}
                            className={`flex items-center gap-1 text-[11px] font-medium truncate ${canEdit && getOptionsForRule(parsed.rule).length > 0 ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 py-1 px-2 -ml-2 rounded-md transition-colors text-teal-600 dark:text-[#1de9b6]' : 'text-[#64748B] dark:text-gray-400'}`}
                          >
                            <span>{parsed.rule}</span>
                            {canEdit && getOptionsForRule(parsed.rule).length > 0 && (
                              <svg className="w-3 h-3 text-gray-400 dark:text-[#6b7a99] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            )}
                          </div>
                          
                          {/* Rule Dropdown */}
                          {openRuleDropdownIdx === dropdownKey && canEdit && (
                            <div className="absolute top-[100%] left-0 mt-1 w-[140px] bg-white dark:bg-[#112240] border border-gray-400/70 dark:border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                              {getOptionsForRule(parsed.rule).map(opt => (
                                <div
                                  key={opt.value}
                                  onClick={() => {
                                    const newValue = (opt.value === 'Yes' || opt.value === 'No') ? opt.value : `${opt.value} ${parsed.value === parsed.rule ? '' : parsed.value}`.trim();
                                    onRowConditionChange(data.id, sIdx, idx, newValue);
                                    setOpenRuleDropdownIdx(null);
                                  }}
                                  className={`px-3 py-2 text-[12px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center ${parsed.rule === opt.value ? 'text-teal-600 dark:text-[#1de9b6] bg-teal-50 dark:bg-teal-900/20' : 'text-slate-700 dark:text-gray-300'}`}
                                >
                                  <span>{opt.label}</span>
                                  <span className="text-[#64748B] dark:text-gray-500 font-mono text-[10px]">{opt.symbol}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-end sm:justify-start sm:pl-6 relative">
                          <div
                            onClick={() => canEdit ? setOpenDropdownIdx(openDropdownIdx === dropdownKey ? null : dropdownKey) : null}
                            className={`flex items-center gap-1.5 ${canEdit ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 py-1 px-2 -ml-2 rounded-md transition-colors' : ''}`}
                          >
                            <span className={`text-[11px] sm:text-[12px] font-semibold ${marksColor}`}>
                              {row.marks > 0 ? `+${row.marks}` : row.marks}
                            </span>
                            {canEdit && (
                              <svg className="w-3 h-3 ml-1 text-gray-400 dark:text-[#6b7a99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            )}
                          </div>
                          
                          {/* Dropdown */}
                          {openDropdownIdx === dropdownKey && canEdit && (
                            <div className="absolute top-[100%] right-0 sm:left-6 mt-1 w-[80px] bg-white dark:bg-[#112240] border border-gray-400/70 dark:border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                              {options.map(opt => (
                                <div
                                  key={opt}
                                  onClick={() => {
                                    onRowMarkChange(data.id, sIdx, idx, opt);
                                    setOpenDropdownIdx(null);
                                  }}
                                  className={`px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center ${row.marks === opt ? 'text-teal-600 dark:text-[#1de9b6] bg-teal-50 dark:bg-teal-900/20' : 'text-slate-700 dark:text-gray-300'}`}
                                >
                                  {opt > 0 ? `+${opt}` : opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {sIdx < data.subTables.length - 1 && (
                  <div className="h-[0.5px] bg-[rgba(255,255,255,0.06)] my-[4px]" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col flex-1 relative">
            <div className="grid grid-cols-3 gap-2 pb-2 mb-1 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
              <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Condition-Values</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Conditions</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider text-right sm:text-left sm:pl-6">Marks</div>
            </div>
            <div className="flex flex-col flex-1 relative">
              {data.rows?.map((row, idx) => {
                const isPositive = row.marks > 0;
                const isZero = row.marks === 0;
                const isNegative = row.marks < 0;
                const isLastRow = idx === data.rows.length - 1;
                const canEdit = isEditing && !isLastRow && !isNegative;
                let marksColor = isPositive ? 'text-[#059669] dark:text-[#00D4AA]' : isZero ? 'text-[#64748B] dark:text-[#94A3B8]' : 'text-[#DC2626] dark:text-[#FF5C5C]';
                const parsed = parseCondition(row.condition);
                const dropdownKey = `main-${idx}`;
                
                const isYesNo = (data.type || '').toLowerCase().includes('yes') || ["Yes", "No"].includes(parsed.rule);
                const isTime = (data.type || '').toLowerCase() === 'time' || String(parsed.value).includes(':');
                const inputType = isTime ? 'time' : 'number';
                
                let displayValue = parsed.value;
                let displaySuffix = '';

                if (inputType === 'number') {
                  const match = String(parsed.value).match(/^-?\d*\.?\d+/);
                  if (match) {
                    displayValue = match[0];
                    displaySuffix = String(parsed.value).substring(match[0].length);
                  }
                }
                
                return (
                  <div key={idx} className="relative grid grid-cols-3 gap-2 items-center min-h-[28px] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] last:border-0 hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-200 px-2 -mx-2 rounded-lg py-[2px]">
                    <div className="relative flex items-center pr-2">
                      {canEdit && !isYesNo ? (
                        <div className="flex items-center w-full">
                          <input
                            type={inputType}
                            value={displayValue}
                            onChange={(e) => {
                              const newCondition = `${parsed.rule} ${e.target.value}${displaySuffix}`.trim();
                              onRowConditionChange(data.id, null, idx, newCondition);
                            }}
                            className="w-[60%] min-w-[40px] bg-slate-100 dark:bg-white/5 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-teal-500 dark:focus:border-[#1de9b6] rounded px-1.5 py-0.5 text-[11px] text-[#0F172A] dark:text-gray-200 outline-none transition-colors"
                          />
                          {displaySuffix && (
                            <span className="ml-1 text-[11px] text-[#0F172A] dark:text-gray-200 whitespace-nowrap">{displaySuffix.trim()}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#0F172A] dark:text-gray-200 font-medium truncate">{parsed.value}</div>
                      )}
                    </div>
                    
                    <div className="relative flex items-center">
                      <div
                        onClick={() => canEdit && getOptionsForRule(parsed.rule).length > 0 ? setOpenRuleDropdownIdx(openRuleDropdownIdx === dropdownKey ? null : dropdownKey) : null}
                        className={`flex items-center gap-1 text-[11px] font-medium truncate ${canEdit && getOptionsForRule(parsed.rule).length > 0 ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 py-1 px-2 -ml-2 rounded-md transition-colors text-teal-600 dark:text-[#1de9b6]' : 'text-[#64748B] dark:text-gray-400'}`}
                      >
                        <span>{parsed.rule}</span>
                        {canEdit && getOptionsForRule(parsed.rule).length > 0 && (
                          <svg className="w-3 h-3 text-gray-400 dark:text-[#6b7a99] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </div>
                      
                      {/* Rule Dropdown */}
                      {openRuleDropdownIdx === dropdownKey && canEdit && (
                        <div className="absolute top-[100%] left-0 mt-1 w-[140px] bg-white dark:bg-[#112240] border border-gray-400/70 dark:border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                          {getOptionsForRule(parsed.rule).map(opt => (
                            <div
                              key={opt.value}
                              onClick={() => {
                                const newValue = (opt.value === 'Yes' || opt.value === 'No') ? opt.value : `${opt.value} ${parsed.value === parsed.rule ? '' : parsed.value}`.trim();
                                onRowConditionChange(data.id, null, idx, newValue);
                                setOpenRuleDropdownIdx(null);
                              }}
                              className={`px-3 py-2 text-[12px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center ${parsed.rule === opt.value ? 'text-teal-600 dark:text-[#1de9b6] bg-teal-50 dark:bg-teal-900/20' : 'text-slate-700 dark:text-gray-300'}`}
                            >
                              <span>{opt.label}</span>
                              <span className="text-[#64748B] dark:text-gray-500 font-mono text-[10px]">{opt.symbol}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end sm:justify-start sm:pl-6 relative">
                      <div
                        onClick={() => canEdit ? setOpenDropdownIdx(openDropdownIdx === dropdownKey ? null : dropdownKey) : null}
                        className={`flex items-center gap-1.5 ${canEdit ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 py-1 px-2 -ml-2 rounded-md transition-colors' : ''}`}
                      >
                        <span className={`text-[11px] sm:text-[12px] font-semibold ${marksColor}`}>
                          {row.marks > 0 ? `+${row.marks}` : row.marks}
                        </span>
                        {canEdit && (
                          <svg className="w-3 h-3 ml-1 text-gray-400 dark:text-[#6b7a99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </div>
                      
                      {/* Dropdown */}
                      {openDropdownIdx === dropdownKey && canEdit && (
                        <div className="absolute top-[100%] right-0 sm:left-6 mt-1 w-[80px] bg-white dark:bg-[#112240] border border-gray-400/70 dark:border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                          {options.map(opt => (
                            <div
                              key={opt}
                              onClick={() => {
                                onRowMarkChange(data.id, null, idx, opt);
                                setOpenDropdownIdx(null);
                              }}
                              className={`px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center ${row.marks === opt ? 'text-teal-600 dark:text-[#1de9b6] bg-teal-50 dark:bg-teal-900/20' : 'text-slate-700 dark:text-gray-300'}`}
                            >
                              {opt > 0 ? `+${opt}` : opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {data.note && (
              <p className="mt-[12px] text-[11px] text-[#6b7a99] italic">{data.note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SchemeDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const schemeId = Number(id) || id;

  const [scheme, setScheme] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Mode State (Path A: clone-then-extend)
  const [isEditing, setIsEditing] = useState(false);
  const [schemeDraft, setSchemeDraft] = useState([]);
  const [editModeType, setEditModeType] = useState('fork');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEditChoiceModal, setShowEditChoiceModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deleteActivityTarget, setDeleteActivityTarget] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const resSchemes = await getSchemes(true);
      const currentScheme = resSchemes.schemes.find(s => s.id == schemeId);
      if (currentScheme) setScheme(currentScheme);

      const resAct = await getSchemeActivities(schemeId);
      setActivities(resAct.activities || []);
      
      if (location.state?.autoEdit && currentScheme) {
        setEditModeType('mutate');
        setSchemeDraft([...(resAct.activities || [])]);
        setIsEditing(true);
        setIsDirty(false);
        navigate('.', { replace: true, state: {} });
      }
      
      setLoading(false);
    };
    fetchData();
  }, [schemeId, location.state, navigate]);

  const handleEditInitiate = () => {
    if (scheme?.isSystemDefault) {
      handleEditClick('fork');
    } else {
      setShowEditChoiceModal(true);
    }
  };

  const handleEditClick = (type = 'fork') => {
    setEditModeType(type);
    setSchemeDraft([...activities]);
    setIsEditing(true);
    setIsDirty(false);
  };

  const handleCancelEdit = async () => {
    if (scheme?.isProvisional) {
      await deleteScheme(schemeId);
      navigate('/counsellor/marking-scheme');
      return;
    }
    setIsEditing(false);
    setSchemeDraft([]);
    setIsDirty(false);
  };

  const handleDeleteActivity = async (activityId) => {
    setDeleteActivityTarget(activityId);
  };

  const confirmDeleteActivity = () => {
    if (!deleteActivityTarget) return;
    setSchemeDraft(prev => prev.filter(a => a.id !== deleteActivityTarget));
    setIsDirty(true);
    setDeleteActivityTarget(null);
  };

  const handleAddActivity = (newActivity) => {
    setSchemeDraft(prev => [...prev, newActivity]);
    setIsDirty(true);
    setShowPickerModal(false);
  };

  const handleRowMarkChange = (activityId, subTableIdx, rowIdx, newMark) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      if (subTableIdx !== null && newAct.subTables) {
        newAct.subTables[subTableIdx].rows[rowIdx].marks = newMark;
      } else if (newAct.rows) {
        newAct.rows[rowIdx].marks = newMark;
      }
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleRowConditionChange = (activityId, subTableIdx, rowIdx, newCondition) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      if (subTableIdx !== null && newAct.subTables) {
        newAct.subTables[subTableIdx].rows[rowIdx].condition = newCondition;
      } else if (newAct.rows) {
        newAct.rows[rowIdx].condition = newCondition;
      }
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleMaxMarksChange = (activityId, newMaxMarks) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      newAct.maxMarks = newMaxMarks;
      
      if (newAct.subTables) {
        newAct.subTables.forEach(sub => {
          sub.rows.forEach(row => {
            if (row.marks > newMaxMarks) row.marks = newMaxMarks;
          });
        });
      } else if (newAct.rows) {
        newAct.rows.forEach(row => {
          if (row.marks > newMaxMarks) row.marks = newMaxMarks;
        });
      }
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleSaveFlow = () => {
    if (editModeType === 'mutate' && !scheme?.isProvisional) {
      handleCreateScheme(scheme.name); // Skips name modal, passes existing name
    } else {
      setShowNameModal(true);
    }
  };

  const handleCreateScheme = async (name) => {
    const targetId = editModeType === 'mutate' ? schemeId : null;
    await saveScheme(name, schemeDraft, targetId, false);
    setShowNameModal(false);
    setIsEditing(false);
    setIsDirty(false);
    setSchemeDraft([]);
    // Reload activities to reflect new draft
    const resAct = await getSchemeActivities(schemeId);
    setActivities(resAct.activities || []);
    // Fetch scheme again in case name changed
    const resSchemes = await getSchemes();
    const updatedScheme = resSchemes.schemes.find(s => s.id == schemeId);
    if (updatedScheme) setScheme(updatedScheme);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0b1628] flex items-center justify-center text-[#6b7a99]">Loading...</div>;
  }

  const renderList = isEditing ? schemeDraft : activities;
  const totalActivities = renderList.length;
  const currentTotalMarks = renderList.reduce((acc, act) => acc + (act.maxMarks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1628] font-sans pb-28 transition-colors duration-300 flex flex-col relative">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b1628]/80 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-4 transition-all duration-300 box-border">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-[200px]">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-slate-500 dark:text-[#6b7a99] hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.06)] active:scale-90 transition-all"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white leading-none tracking-tight truncate">
                {scheme?.name || 'Scheme Details'}
              </h1>
              <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-[#1de9b6] mt-1 truncate">
                {isEditing ? 'Editing session (unsaved)' : 'Full Activity List'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {!isEditing ? (
              <button
                onClick={handleEditInitiate}
                className="flex items-center gap-1.5 px-[14px] py-[6px] border border-teal-500 dark:border-[#1de9b6] text-teal-600 dark:text-[#1de9b6] rounded-[8px] text-[13px] font-medium hover:bg-teal-50 dark:hover:bg-[#1de9b6]/10 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-[14px] py-[6px] text-gray-500 dark:text-[#6b7a99] rounded-[8px] text-[13px] font-medium hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFlow}
                  disabled={!isDirty}
                  className="px-[14px] py-[6px] bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-[8px] text-[13px] font-medium hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {editModeType === 'mutate' ? 'Save' : 'Save as New'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`flex-1 w-[90%] max-w-[1080px] mx-auto px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] ${isEditing ? 'py-4' : 'py-8'} transition-all duration-300 box-border`}>

        {/* KPI Section */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 md:mb-10">
          <div className="bg-[#FFFFFF] dark:bg-[#112240] rounded-[16px] p-4 border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-sm flex flex-col justify-center h-[72px] md:h-[81px] backdrop-blur-sm">
            <p className="text-[10px] md:text-[12px] font-medium text-slate-500 dark:text-[#6b7a99] mb-1">Total Activities</p>
            <h2 className="text-[24px] md:text-[32px] font-bold text-[#0F172A] dark:text-white leading-none">{totalActivities}</h2>
          </div>

          <div className={`bg-gradient-to-r from-[#059669] to-[#10B981] dark:from-[rgba(29,233,182,0.1)] dark:to-[rgba(29,233,182,0.05)] rounded-[16px] p-4 border dark:border-[rgba(29,233,182,0.2)] shadow-md flex flex-col justify-center h-[72px] md:h-[81px] text-white transition-colors duration-300`}>
            <p className={`text-[10px] md:text-[12px] font-medium mb-1 dark:text-[#1de9b6]`}>Max Possible Marks</p>
            <h2 className={`text-[24px] md:text-[32px] font-bold leading-none dark:text-white`}>{currentTotalMarks}</h2>
          </div>
        </div>

        {/* Marking Scheme Grid */}
        {renderList.length > 0 ? (
          <div className="block md:grid md:grid-cols-2 md:gap-4 mb-6">
            {renderList.map((act) => (
              <SchemeTable
                key={act.id}
                data={act}
                isEditing={isEditing}
                onDelete={handleDeleteActivity}
                onRowMarkChange={handleRowMarkChange}
                onRowConditionChange={handleRowConditionChange}
                onMaxMarksChange={handleMaxMarksChange}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 mb-6 text-center text-[#6b7a99] bg-[#112240] rounded-[16px] border border-[rgba(255,255,255,0.06)]">
            <p>No activities configured for this scheme yet.</p>
          </div>
        )}

        {/* Action Button for Edit Mode (Below List) */}
        {isEditing && (
          <div className="mt-2">
            <button
              onClick={() => setShowPickerModal(true)}
              className="w-full py-4 rounded-[12px] border-2 border-dashed border-[#1de9b6]/50 text-[#1de9b6] text-[14px] font-semibold hover:bg-[#1de9b6]/10 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Add marking scheme for activity
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditChoiceModal && (
        <EditChoiceModal
          schemeName={scheme?.name}
          onClose={() => setShowEditChoiceModal(false)}
          onEditInPlace={() => {
            handleEditClick('mutate');
            setShowEditChoiceModal(false);
          }}
          onFork={() => {
            handleEditClick('fork');
            setShowEditChoiceModal(false);
          }}
        />
      )}

      {showPickerModal && (
        <SchemeActivityPickerModal
          onClose={() => setShowPickerModal(false)}
          onApply={handleAddActivity}
        />
      )}

      {showNameModal && (
        <SchemeNameModal
          onClose={() => setShowNameModal(false)}
          onCreate={handleCreateScheme}
        />
      )}

      {/* Delete Activity Modal */}
      <ConfirmModal
        isOpen={!!deleteActivityTarget}
        onClose={() => setDeleteActivityTarget(null)}
        onConfirm={confirmDeleteActivity}
        title="Remove Activity"
        description="Are you sure you want to remove this activity from the scheme?"
        confirmText="Remove"
        cancelText="Cancel"
      />

    </div>
  );
};

export default SchemeDetail;
