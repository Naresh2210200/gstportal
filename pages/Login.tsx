import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'ca' | 'customer'>('ca');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [caCode, setCaCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await api.loginUser(identifier, password, role, role === 'customer' ? caCode : undefined);
      // Map backend snake_case to frontend camelCase User type
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        passwordHash: '',   // never store hash on client
        fullName: data.user.full_name,
        role: data.user.role,
        caCode: data.user.ca_code,
        firmName: data.user.firm_name,
        gstin: data.user.gstin,
      };
      onLogin(user);
      if (user.role === 'ca') navigate('/ca/dashboard');
      else navigate('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CAMate Pro</h1>
          <p className="mt-2 text-slate-500">Professional CA Workspace Management</p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setRole('ca')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${role === 'ca' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            CA Login
          </button>
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${role === 'customer' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Customer Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username or Email</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {role === 'customer' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CA Code</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono uppercase"
                placeholder="Code provided by your CA"
                value={caCode}
                onChange={(e) => setCaCode(e.target.value.toUpperCase())}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-sm text-slate-600">Don't have an account?</p>
          <div className="flex justify-center gap-4">
            <Link to="/register/ca" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">Register as CA</Link>
            <span className="text-slate-300">|</span>
            <Link to="/register/customer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">Register as Customer</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;