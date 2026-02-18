import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const RegisterCustomer: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    caCode: '',
    gstin: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side GSTIN validation (good UX, avoids round-trip for obvious errors)
    if (formData.gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstin.toUpperCase())) {
        setError('Invalid GSTIN format. Must be 15 characters like: 22AAAAA0000A1Z5');
        return;
      }
    }

    setIsLoading(true);
    try {
      await api.registerCustomer({
        full_name: formData.fullName,
        username: formData.username,
        password: formData.password,
        ca_code: formData.caCode.toUpperCase(),
        gstin: formData.gstin.toUpperCase(),
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900">Customer Registration</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
              value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">GSTIN <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono mt-1"
              placeholder="22AAAAA0000A1Z5"
              value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
              placeholder="Pick a unique username"
              value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input type="password" required minLength={8} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
              value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">CA Code <span className="text-red-500">*</span></label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase mt-1"
              placeholder="Enter code provided by your CA"
              value={formData.caCode} onChange={e => setFormData({ ...formData, caCode: e.target.value.toUpperCase() })} />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg shadow-md font-semibold transition-all"
          >
            {isLoading ? 'Registering...' : 'Register as Customer'}
          </button>
        </form>
        <Link to="/" className="block text-center text-sm text-indigo-600 font-medium">Back to Login</Link>
      </div>
    </div>
  );
};

export default RegisterCustomer;