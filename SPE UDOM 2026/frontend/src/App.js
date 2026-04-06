import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LiveChat from './components/LiveChat';
import ProfileWidget from './components/ProfileWidget';
import Navbar from './components/Navbar';
import SiteFooter from './components/SiteFooter';
import Home from './pages/Home';
import About from './pages/About';
import Leadership from './pages/Leadership';
import Events from './pages/Events';
import Publication from './pages/Publication';
import Contact from './pages/Contact';
import Membership from './pages/Membership';
import Election from './pages/Election';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './dashboards/AdminDashboard';
import PresidentDashboard from './dashboards/PresidentDashboard';
import SecretaryDashboard from './dashboards/SecretaryDashboard';
import MemberDashboard from './dashboards/MemberDashboard';
import PageHeader from './components/PageHeader';
import './App.css';

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'president') return <PresidentDashboard />;
  if (user.role === 'general_secretary') return <SecretaryDashboard />;
  return <MemberDashboard />;
};

const PublicLayout = () => (
  <>
    <Navbar />
    <PageHeader />
    <div className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/leadership" element={<Leadership />} />
        <Route path="/events" element={<Events />} />
        <Route path="/publication" element={<Publication />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/join" element={<Membership />} />
        <Route path="/election" element={<Election />} />
      </Routes>
      <SiteFooter />
    </div>
  </>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProfileWidget />
        <LiveChat />
        <Routes>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
          <Route path="/dashboard/*" element={<DashboardRouter />} />
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
