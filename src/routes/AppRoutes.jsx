import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import RoleSelection from '../pages/RoleSelection';
import EmailLogin from '../pages/EmailLogin';
import OnboardingStepTwo from '../pages/student/OnboardingStepTwo';
import StudentDashboard from '../pages/student/StudentDashboard';
import UnderConstruction from '../pages/UnderConstruction';

import Analytics from '../pages/student/Analytics';
import Inspiration from '../pages/student/Inspiration';
import Profile from '../pages/student/Profile';
import AIChat from '../pages/student/AIChat';
import CounsellorDashboard from '../pages/counsellor/CounsellorDashboard';
import CounsellorProfile from '../pages/counsellor/CounsellorProfile';
import CounsellorAnalytics from '../pages/counsellor/CounsellorAnalytics';
import PersonalSadhanaAnalytics from '../pages/counsellor/PersonalSadhanaAnalytics';
import CounsellorRewardsManagement from '../pages/counsellor/CounsellorRewardsManagement';
import MenteesList from '../pages/counsellor/mentees_module/MenteesList';
import StudentReport from '../pages/counsellor/mentees_module/StudentReport';
import MenteeConversation from '../pages/counsellor/mentees_module/MenteeConversation';
import GroupMenteesList from '../pages/counsellor/group_mentees_module/GroupMenteesList';
import CounsellorAddContent from '../pages/counsellor/CounsellorAddContent';
import CounsellorAiChat from '../pages/counsellor/CounsellorAiChat';
import CounsellorSubCounsellors from '../pages/counsellor/CounsellorSubCounsellors';
import IrregularMentees from '../pages/counsellor/mentees_module/IrregularMentees';
import CounsellorOnboardingStepTwo from '../pages/counsellor/CounsellorOnboardingStepTwo';
import GoogleCallback from '../pages/GoogleCallback';
import AuthGuard from '../components/shared/AuthGuard';
import MarkingScheme from '../pages/counsellor/MarkingScheme';
import DefaultSchemeDetail from '../pages/counsellor/DefaultSchemeDetail';
import SchemeDetail from '../pages/counsellor/SchemeDetail';

import CustomActivities from '../pages/counsellor/mentees_module/CustomActivities';


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/email-login" element={<EmailLogin />} />
        <Route path="/oauth-success" element={<GoogleCallback />} />
        <Route path="/onboarding" element={<RoleSelection />} />
        <Route path="/student/onboarding-step-2" element={<OnboardingStepTwo />} />
        <Route path="/counsellor/onboarding-step-2" element={<CounsellorOnboardingStepTwo />} />

        {/* Protected Routes */}
        <Route element={<AuthGuard />}>

          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/counsellor/dashboard" element={<CounsellorDashboard />} />
          <Route path="/student/profile" element={<Profile />} />

          <Route path="/counsellor/profile" element={<CounsellorProfile />} />
          <Route path="/counsellor/analytics" element={<CounsellorAnalytics />} />
          <Route path="/counsellor/personal-analytics" element={<PersonalSadhanaAnalytics />} />

          <Route path="/counsellor/rewards" element={<UnderConstruction />} />
          <Route path="/counsellor/marking-scheme" element={<MarkingScheme />} />
          <Route path="/counsellor/marking-scheme/default" element={<DefaultSchemeDetail />} />
          <Route path="/counsellor/marking-scheme/:id" element={<SchemeDetail />} />
          <Route path="/counsellor/custom-activities" element={<CustomActivities />} />

          {/* <Route path="/counsellor/rewards" element={<CounsellorRewardsManagement />} /> */}
          <Route path="/counsellor/mentees" element={<MenteesList />} />
          <Route path="/counsellor/mentee/:id" element={<StudentReport />} />
          <Route path="/counsellor/mentee/:id/conversation" element={<MenteeConversation />} />
          <Route path="/counsellor/add-content" element={<CounsellorAddContent />} />
          <Route path="/counsellor/ai-chat" element={<CounsellorAiChat />} />
          <Route path="/counsellor/group-mentees" element={<GroupMenteesList />} />
          <Route path="/counsellor/sub-counsellors" element={<CounsellorSubCounsellors />} />
          <Route path="/counsellor/irregular-mentees" element={<IrregularMentees />} />

          {/* <Route path="/counsellor/sub-counsellors" element={<UnderConstruction />} /> */}
          <Route path="/student/analytics" element={<Analytics />} />
          <Route path="/student/inspiration" element={<Inspiration />} />

          <Route path="/student/ai-chat" element={<AIChat />} />
        </Route>

        {/* Catch-all route to redirect back to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
