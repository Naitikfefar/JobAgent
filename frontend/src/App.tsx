import { NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from '@/context/ThemeContext';
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import JobRecommendations from "./pages/JobRecommendations";
import ResumeCenter from "./pages/ResumeCenter";
import CoverLetterCenter from "./pages/CoverLetterCenter";
import ApplicationTracker from "./pages/ApplicationTracker";
import Profile from "./pages/Profile";
import SkillGap from "./pages/SkillGap";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<JobRecommendations />} />
        <Route path="/resume" element={<ResumeCenter />} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/skill-gap" element={<PrivateRoute><SkillGap /></PrivateRoute>} />
        <Route path="/cover-letters" element={<CoverLetterCenter />} />
        <Route path="/applications" element={<ApplicationTracker />} />
      </Routes>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
