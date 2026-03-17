import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import { AuthProvider } from './context/AuthContext';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <h1 className="text-5xl font-extrabold text-blue-600 tracking-tight drop-shadow-md">
        MINI PROJECT FOR INTERN 
      </h1>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;