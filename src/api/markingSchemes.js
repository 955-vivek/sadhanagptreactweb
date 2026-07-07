// src/api/markingSchemes.js
import { postRequest } from '../services/api';

const LOCAL_KEY = 'mock_marking_schemes_data';
const LOCAL_SCHEMES_KEY = 'mock_custom_schemes_list';
let cachedGroupsPromise = null; // Cache the promise so we only hit the backend ONCE

const artificialDelay = (ms = 200) => new Promise(res => setTimeout(res, ms));

const fetchRealGroupsAndSync = async () => {
  // If we already fetched (or are currently fetching), wait for that same promise
  if (cachedGroupsPromise) return cachedGroupsPromise;

  cachedGroupsPromise = new Promise((resolve) => {
    try {
      const userDetailsStr = localStorage.getItem('user_details');
      if (!userDetailsStr) {
        resolve({ groups: [] });
        return;
      }

      const userDetails = JSON.parse(userDetailsStr);
      const userId = userDetails.user_id;

      // Call your actual backend endpoint ONCE with a 3-second timeout
      // to prevent the frontend from freezing when the backend database is down.
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Backend took too long (DB is likely down)")), 3000);
      });

      const apiPromise = new Promise((resolveApi) => {
        getRequest('/group-list', { user_id: userId, page_no: 1 }, (response) => {
          resolveApi(response);
        });
      });

      Promise.race([apiPromise, timeoutPromise])
        .then((response) => {
          clearTimeout(timeoutId);
          const resData = response?.data;
          let dbGroups = [];

          if (resData && resData.code === 200) {
            const rawGroups = Array.isArray(resData.data) ? resData.data :
              (resData.data && Array.isArray(resData.data.data) ? resData.data.data : []);

            dbGroups = rawGroups.map(g => ({
              id: g.id || g.center_id,
              name: g.name || g.center_name || 'Unnamed Group', // Fallback name
              memberCount: g.total_student || 0
            }));
          }

          processGroups(dbGroups);
        })
        .catch((err) => {
          console.error("Backend failed or timed out:", err.message);
          // BACKEND IS DOWN: Supply fallback mock groups so the UI doesn't break
          processGroups([
            { id: 991, name: "Mock DB Down Group A", memberCount: 15 },
            { id: 992, name: "Mock DB Down Group B", memberCount: 8 }
          ]);
        });

      function processGroups(dbGroups) {
        const localSavedData = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"groups": []}');

        const mergedGroups = dbGroups.map(dbGroup => {
          const localMatch = localSavedData.groups.find(lg => lg.id === dbGroup.id);
          return {
            ...dbGroup,
            markingSchemeId: localMatch && localMatch.markingSchemeId !== undefined
              ? localMatch.markingSchemeId
              : 1
          };
        });

        const finalData = { groups: mergedGroups };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(finalData));
        resolve(finalData);
      }
    } catch (err) {
      console.error("Failed to sync real groups:", err);
      resolve({ groups: [] });
    }
  });

  return cachedGroupsPromise;
};

// If data changes locally (assignments), update cache and localStorage
const updateLocalData = (data) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  cachedGroupsPromise = Promise.resolve(data);
};

export const getSchemes = async (includeProvisional = false) => {
  const data = await fetchRealGroupsAndSync();
  const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
  
  const filteredCustom = includeProvisional ? customSchemes : customSchemes.filter(s => !s.isProvisional);

  const defaultEnabled = localStorage.getItem('DEFAULT_SCHEME_ENABLED');

  const schemes = [
    {
      id: 1, // Default scheme
      name: 'Default Scheme',
      isSystemDefault: true,
      appliedGroupCount: (data.groups || []).filter(g => g.markingSchemeId === 1).length,
      isLocked: true,
      isEnabled: defaultEnabled !== 'false' // True by default unless explicitly false
    }
  ];

  filteredCustom.forEach(cs => {
    const count = (data.groups || []).filter(g => g.markingSchemeId === cs.id).length;
    schemes.push({
      ...cs,
      isSystemDefault: false,
      appliedGroupCount: count,
      isLocked: false,
      isEnabled: cs.isEnabled !== false, // Default true if undefined
      isProvisional: cs.isProvisional
    });
  });

  return { schemes };
};

export const getSchemeGroups = async (schemeId) => {
  const data = await fetchRealGroupsAndSync();
  const schemeGroups = (data.groups || []).filter(g => g.markingSchemeId === schemeId);

  return {
    schemeId,
    groupCount: schemeGroups.length,
    groups: schemeGroups.map(g => ({ id: g.id, name: g.name, memberCount: g.memberCount }))
  };
};

export const searchContentGroups = async (query) => {
  const data = await fetchRealGroupsAndSync();

  const q = (query || "").toLowerCase();

  // Bulletproof search to prevent undefined crashes
  const matched = (data.groups || []).filter(g => {
    const gName = g.name || "";
    return gName.toLowerCase().includes(q);
  });

  return {
    groups: matched.map(g => {
      let schemeObj = null;
      if (g.markingSchemeId === 1) schemeObj = { id: 1, name: "Default Scheme", isLocked: false };
      else if (g.markingSchemeId === 2) schemeObj = { id: 2, name: "Custom Scheme", isLocked: true };

      return {
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        markingScheme: schemeObj
      };
    })
  };
};

export const assignGroupsToScheme = async (schemeId, groupIds) => {
  await artificialDelay();
  const data = await fetchRealGroupsAndSync();

  data.groups = data.groups.map(g => {
    if (groupIds.includes(g.id)) {
      return { ...g, markingSchemeId: schemeId };
    }
    return g;
  });

  updateLocalData(data);
  return { schemeId, updatedGroupIds: groupIds };
};

export const removeGroupFromScheme = async (schemeId, groupId) => {
  await artificialDelay();
  const data = await fetchRealGroupsAndSync();

  data.groups = data.groups.map(g => {
    if (g.id === groupId && g.markingSchemeId === schemeId) {
      return { ...g, markingSchemeId: 1 };
    }
    return g;
  });

  updateLocalData(data);
  return { groupId, newSchemeId: 1 };
};

// ==========================================
// MOCK APIS FOR EDITING MARKING SCHEMES
// TODO: Replace these local mock functions with real API calls using fetch/axios later.
// ==========================================

export const getActivities = async () => {
  await artificialDelay(200);
  return {
    activities: [
        {
                "id": 101,
                "title": "Sleep Time",
                "icon": "😴",
                "activityType": "Daily",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "Up to 22:15",
                                "marks": "+25"
                                }
                      ]
                },
        {
                "id": 102,
                "title": "Wake Up Time",
                "icon": "🌅",
                "activityType": "Daily",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "Up to 04:45",
                                "marks": "+25"
                                }
                      ]
                },
        {
                "id": 103,
                "title": "Chanting Completion Time",
                "icon": "📿",
                "activityType": "Daily",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "Up to 07:15",
                                "marks": "+25"
                                }
                      ]
                },
        {
                "id": 104,
                "title": "Japa Number of Rounds",
                "icon": "📿",
                "activityType": "Daily",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "Target",
                                "marks": "+25"
                                }
                      ]
                },
        {
                "id": 105,
                "title": "Mangal Aarti Attended",
                "icon": "🙏",
                "activityType": "Daily",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "Yes (Daily)",
                                "marks": "+10"
                                }
                      ]
                },
        {
                "id": 106,
                "title": "Day Rest Duration",
                "icon": "⏱️",
                "activityType": "Daily",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "Up to 60 min",
                                "marks": "+25"
                                }
                      ]
                },
        {
                "id": 107,
                "title": "Hearing Duration",
                "icon": "👂",
                "activityType": "Daily",
                "maxMarks": 20,
                "conditions": [
                        {
                                "condition": "Above 25 min",
                                "marks": "+20"
                                }
                      ]
                },
        {
                "id": 108,
                "title": "Reading Duration",
                "icon": "📖",
                "activityType": "Daily",
                "maxMarks": 20,
                "conditions": [
                        {
                                "condition": "Above 25 min",
                                "marks": "+20"
                                }
                      ]
                },
        {
                "id": 109,
                "title": "Reading Miscellaneous Books",
                "icon": "📚",
                "activityType": "Daily",
                "maxMarks": 15,
                "conditions": [
                        {
                                "condition": "Above 25 min",
                                "marks": "+15"
                                }
                      ]
                },
        {
                "id": 110,
                "title": "Hearing Spiritual Master",
                "icon": "🎧",
                "activityType": "Daily",
                "maxMarks": 20,
                "conditions": [
                        {
                                "condition": "Above 25 min",
                                "marks": "+20"
                                }
                      ]
                },
        {
                "id": 111,
                "title": "Hearing Srila Prabhupada",
                "icon": "🎧",
                "activityType": "Daily",
                "maxMarks": 20,
                "conditions": [
                        {
                                "condition": "Above 25 min",
                                "marks": "+20"
                                }
                      ]
                },
        {
                "id": 112,
                "title": "Hearing Miscellaneous",
                "icon": "🎧",
                "activityType": "Daily",
                "maxMarks": 20,
                "conditions": [
                        {
                                "condition": "Above 25 min",
                                "marks": "+20"
                                }
                      ]
                },
        {
                "id": 113,
                "title": "Menial Services",
                "icon": "🧹",
                "activityType": "Weekly",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "120 min & above",
                                "marks": "+25"
                                }
                      ]
                },
        {
                "id": 114,
                "title": "Shloka Memorisation",
                "icon": "📜",
                "activityType": "Weekly",
                "maxMarks": 25,
                "conditions": [
                        {
                                "condition": "More than 30 min",
                                "marks": "+25"
                                }
                      ]
                }
      ]
    };
};

export const getSchemeActivities = async (schemeId) => {
  await artificialDelay(200);
  if (schemeId === 1) {
    return {
      activities: [
        {
          id: 'def1',
          title: 'Chanting',
          icon: '📿',
          maxMarks: 25,
          badge: 'Daily',
          rows: [{ condition: 'Completed Target', marks: 25 }]
        },
        {
          id: 'def2',
          title: 'Reading',
          icon: '📖',
          maxMarks: 20,
          badge: 'Daily',
          rows: [{ condition: '20 min', marks: 20 }]
        },
        {
          id: 'def3',
          title: 'Hearing',
          icon: '👂',
          maxMarks: 20,
          badge: 'Daily',
          rows: [{ condition: '20 min', marks: 20 }]
        }
      ]
    };
  }

  // Load custom scheme activities
  const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
  const scheme = customSchemes.find(s => s.id === schemeId);
  return {
    activities: scheme ? (scheme.activities || []) : []
  };
};

export const saveScheme = async (name, activities, schemeId = null, isProvisional = false) => {
  const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
  
  if (isProvisional) {
    // DO NOT hit backend for temporary drafts/clones
    if (schemeId) {
      const index = customSchemes.findIndex(s => s.id === schemeId);
      if (index >= 0) {
        customSchemes[index] = { ...customSchemes[index], name, activities, isProvisional };
        localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
        return { scheme: customSchemes[index] };
      }
    }
    const newScheme = {
      id: Date.now(), 
      name,
      activities,
      isEnabled: true,
      isProvisional
    };
    customSchemes.push(newScheme);
    localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
    return { scheme: newScheme };
  }

  // Production Backend Saving
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const counsellorId = userDetails.user_id;
  if (!counsellorId) throw new Error("User not authenticated.");

  const targetCenterId = schemeId || Date.now(); 
  const payload = {
    center_id: targetCenterId,
    counsellor_id: counsellorId,
    name: name,
    isProvisional: isProvisional,
    activities: activities
  };

  return new Promise((resolve, reject) => {
    postRequest('/save-marking-scheme', payload, (response) => {
      if (response && response.data && response.data.code === 200) {
        const existingIdx = customSchemes.findIndex(s => s.id === targetCenterId);
        const savedScheme = { id: targetCenterId, name, activities, isEnabled: true, isProvisional: false };
        if (existingIdx >= 0) customSchemes[existingIdx] = savedScheme;
        else customSchemes.push(savedScheme);
        localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
        
        resolve({ scheme: savedScheme });
      } else {
        reject(new Error(response?.data?.message?.[0] || "Failed to save scheme to database."));
      }
    });
  });
};

export const deleteScheme = async (schemeId) => {
  await artificialDelay(300);
  let customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
  customSchemes = customSchemes.filter(s => s.id !== schemeId);
  localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
  return { success: true };
};

export const toggleSchemeStatus = async (schemeId, isEnabled) => {
  await artificialDelay(200);

  if (schemeId === 1) {
    localStorage.setItem('DEFAULT_SCHEME_ENABLED', isEnabled ? 'true' : 'false');
    return { success: true };
  }

  const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
  const index = customSchemes.findIndex(s => s.id === schemeId);
  if (index >= 0) {
    customSchemes[index] = { ...customSchemes[index], isEnabled };
    localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
  }
  return { success: true };
};

export const deleteActivityFromScheme = async (schemeId, activityId) => {
  await artificialDelay(200);
  // Log deletion. Real backend would process this here.
  console.log(`[Mock API] Deleted activity ${activityId} from scheme ${schemeId}`);
  return { success: true };
};

