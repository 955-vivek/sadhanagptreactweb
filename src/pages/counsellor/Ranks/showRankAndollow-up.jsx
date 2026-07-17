import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { getRequest } from '../../../services/api';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';

const MedalIcon = ({ rank }) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;

    const colors = isGold
        ? { grad1: '#FDE68A', grad2: '#F59E0B', stroke: '#D97706', text: '#78350F' }
        : isSilver
            ? { grad1: '#F1F5F9', grad2: '#94A3B8', stroke: '#64748B', text: '#1E293B' }
            : { grad1: '#FDBA74', grad2: '#C2410C', stroke: '#9A3412', text: '#7C2D12' };

    return (
        <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow">
            <defs>
                <linearGradient id={`medal-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.grad1} />
                    <stop offset="100%" stopColor={colors.grad2} />
                </linearGradient>
            </defs>
            <polygon points="4,2 10,2 13,12 7,12" fill="#2563EB" />
            <polygon points="20,2 14,2 11,12 17,12" fill="#3B82F6" />
            <circle cx="12" cy="15" r="8" fill={`url(#medal-${rank})`} stroke={colors.stroke} strokeWidth="1" />
            <circle cx="12" cy="15" r="6" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
            <text x="12" y="18.5" textAnchor="middle" fill={colors.text} fontSize="10" fontWeight="900" fontFamily="sans-serif">
                {rank}
            </text>
        </svg>
    );
};

const ShowRankAndFollowUp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userDetails } = useOutletContext();

    // We expect { type: 'rank' | 'followup', groups: [...] } to be passed in the route state
    const type = location.state?.type || 'rank';
    const groups = location.state?.groups || [];
    const title = type === 'rank' ? 'Students Rank' : 'Needs Follow-up';

    const [allData, setAllData] = useState([]);
    const [data, setData] = useState([]);
    const [filterGroup, setFilterGroup] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    // Reset to page 1 when the filter or limit changes
    useEffect(() => {
        setPage(1);
    }, [filterGroup, limit]);

    // Fetch the data from the backend (which returns all records)
    useEffect(() => {
        const endpoint = type === 'rank' ? '/student-rank' : '/student-followup';
        const payload = filterGroup === 'all' 
            ? { user_id: userDetails.user_id } 
            : { center_id: filterGroup };

        getRequest(endpoint, payload, (response) => {
            if (response.data?.status === 1 || response.data?.code === 200) {
                const dataKey = type === 'rank' ? 'ranks' : 'students';
                const fetchedArray = response.data.data?.[dataKey] || [];
                setAllData(fetchedArray);
            }
        });
    }, [type, filterGroup, userDetails.user_id]);

    // Client-side pagination logic
    useEffect(() => {
        setTotalPages(Math.ceil(allData.length / limit) || 1);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        setData(allData.slice(startIndex, endIndex));
    }, [allData, page, limit]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] pb-28 relative">
            <div className="w-full max-w-md mx-auto">
                {/* Top Header */}
                <div className="flex items-center px-6 pt-6 pb-4">
                    <button onClick={() => navigate(-1)} className="text-[#64748b] dark:text-[#CBD5E1] font-bold">Back</button>
                    <h1 className="flex-1 text-center text-[18px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC]">
                        {title}
                    </h1>
                </div>

                {/* Dropdown Filter */}
                <div className="px-6 py-4 flex gap-3">
                    <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-2 flex-1 font-bold text-sm"
                    >
                        <option value="all">All Groups</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>

                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-2 w-28 font-bold text-sm"
                    >
                        {/* <option value={2}>2 / page</option> */}
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                        <option value={50}>50 / page</option>
                    </select>
                </div>

                {/* List of Students */}
                <div className="px-6 space-y-3">
                    {(() => {

                        if (data.length === 0) {
                            return (
                                <div className="text-center py-8 text-gray-500 font-bold dark:text-gray-400">
                                    Nothing to show
                                </div>
                            );
                        }

                        return data.map((student, index) => (
                            <div key={index} className="flex items-center p-4 border rounded-2xl bg-white dark:bg-slate-800 dark:border-slate-700">
                                {/* Rank / Medal Icon */}
                                <div className="w-8 h-8 flex items-center justify-center mr-4">
                                    {type === 'rank' && student.rank <= 3 ? (
                                        <MedalIcon rank={student.rank} />
                                    ) : (
                                        <span className="font-bold text-gray-500">{student.rank || index + 1}</span>
                                    )}
                                </div>

                                {/* Student Details */}
                                <div className="flex-1 truncate mr-3">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">{student.student_name}</h3>
                                </div>

                                {/* Right Side Info */}
                                <div className="text-right shrink-0 flex flex-col items-end">
                                    {type === 'rank' ? (
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{student.percentage || 0}%</span>
                                    ) : (
                                        <>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{student.percentage || 0}%</span>
                                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap mt-0.5">Last active: {student.last_active}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 mt-2 mb-4">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors"
                        >
                            <span>&larr;</span> Previous
                        </button>
                        
                        <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                            Page {page} of {totalPages}
                        </span>
                        
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-colors"
                        >
                            Next <span>&rarr;</span>
                        </button>
                    </div>
                )}
            </div>
            <CounsellorBottomNavigation />
        </div>
    );
};

export default ShowRankAndFollowUp;
