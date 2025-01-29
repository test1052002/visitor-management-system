import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Reports from './pages/Reports';

function App() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <p>Loading...</p>; // Prevent blank screen while Clerk is initializing
  }

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={isSignedIn ? <Navigate to="/dashboard" /> : <HomePage />} />

        {/* Authentication */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Protected Route */}
        <Route path="/dashboard" element={isSignedIn ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/reports" element={isSignedIn ? <Reports /> : <Navigate to="/" />} />


        {/* Redirect unauthenticated users */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
