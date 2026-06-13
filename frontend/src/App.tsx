import { NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import JobRecommendations from "./pages/JobRecommendations";
import ResumeCenter from "./pages/ResumeCenter";
import CoverLetterCenter from "./pages/CoverLetterCenter";
import ApplicationTracker from "./pages/ApplicationTracker";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<JobRecommendations />} />
        <Route path="/resume" element={<ResumeCenter />} />
        <Route path="/cover-letters" element={<CoverLetterCenter />} />
        <Route path="/applications" element={<ApplicationTracker />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
