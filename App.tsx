
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from './types';
import { api } from './services/api';
import Login from './pages/Login';
import RegisterCA from './pages/RegisterCA';
import RegisterCustomer from './pages/RegisterCustomer';
import CADashboard from './pages/ca/Dashboard';
import CAPartyWorkspace from './pages/ca/PartyWorkspace';
import CustomerDashboard from './pages/customer/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('logged_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Strip passwordHash — never persist it to sessionStorage
    const { passwordHash: _omit, ...safeUser } = user as any;
    sessionStorage.setItem('logged_user', JSON.stringify(safeUser));
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await api.logout();
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={
            currentUser ? (
              currentUser.role === 'ca' ? <Navigate to="/ca/dashboard" /> : <Navigate to="/customer/dashboard" />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } />

          <Route path="/register/ca" element={<RegisterCA />} />
          <Route path="/register/customer" element={<RegisterCustomer />} />

          {/* Protected Routes */}
          <Route
            path="/ca/dashboard"
            element={
              currentUser?.role === 'ca'
                ? <CADashboard user={currentUser} onLogout={handleLogout} />
                : <Navigate to="/" />
            }
          />
          <Route
            path="/ca/workspace/:partyId"
            element={
              currentUser?.role === 'ca'
                ? <CAPartyWorkspace user={currentUser} onLogout={handleLogout} />
                : <Navigate to="/" />
            }
          />
          <Route
            path="/customer/dashboard"
            element={
              currentUser?.role === 'customer'
                ? <CustomerDashboard user={currentUser} onLogout={handleLogout} />
                : <Navigate to="/" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
