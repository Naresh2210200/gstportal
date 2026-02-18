import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { User } from '../../types';
import { generateFinancialYears } from '../../services/utils';

interface CADashboardProps {
  user: User;
  onLogout: () => void;
}

interface Customer {
  id: string;
  full_name: string;
  username: string;
  gstin?: string;
}

interface UploadRecord {
  id: string;
  customer_name: string;
  file_name: string;
  month: string;
  financial_year: string;
  status: string;
  uploaded_at: string;
}

const FY_OPTIONS = generateFinancialYears(5);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls =
    status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
      status === 'Pending' ? 'bg-amber-100 text-amber-700' :
        status === 'Processing' ? 'bg-blue-100 text-blue-700' :
          status === 'Received' ? 'bg-indigo-100 text-indigo-700' :
            'bg-rose-100 text-rose-700';
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${cls}`}>{status}</span>;
};

const CADashboard: React.FC<CADashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [financialYear, setFinancialYear] = useState(FY_OPTIONS[0]);
  const [showAll, setShowAll] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [customersData, uploadsData] = await Promise.all([
        api.getCustomers(),
        selectedPartyId
          ? api.getCustomerUploads(selectedPartyId, financialYear)
          : api.getCustomerUploads('all', financialYear).catch(() => ({ results: [] }))
      ]);
      setCustomers(customersData?.results || customersData || []);
      setUploads(uploadsData?.results || uploadsData || []);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPartyId, financialYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = {
    pending: uploads.filter(u => u.status === 'Pending').length,
    received: uploads.filter(u => u.status === 'Received').length,
    completed: uploads.filter(u => u.status === 'Completed').length,
    error: uploads.filter(u => u.status === 'Error').length,
  };

  const displayedUploads = showAll ? uploads : uploads.slice(0, 5);

  const handleOpenWorkspace = () => {
    if (selectedPartyId) navigate(`/ca/workspace/${selectedPartyId}?fy=${financialYear}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user.firmName || user.fullName}</h1>
          <p className="text-slate-500 mt-1">
            CA Control Panel &nbsp;·&nbsp; Code:&nbsp;
            <span className="font-mono font-bold text-indigo-600">{user.caCode}</span>
          </p>
        </div>
        <button onClick={onLogout}
          className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all font-medium">
          Logout
        </button>
      </header>

      {loadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {loadError}
          <button onClick={fetchData} className="ml-auto text-indigo-600 font-semibold hover:underline">Retry</button>
        </div>
      )}

      {/* Party Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Select Party (Customer)</label>
          <select
            className="w-full p-2.5 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedPartyId}
            onChange={e => setSelectedPartyId(e.target.value)}>
            <option value="">All Parties</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.full_name} {c.gstin ? `(${c.gstin})` : ''}
              </option>
            ))}
          </select>
          {customers.length === 0 && !isLoading && (
            <p className="text-xs text-slate-400">No customers registered under your CA code yet.</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Financial Year</label>
          <select
            className="w-full p-2.5 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={financialYear}
            onChange={e => setFinancialYear(e.target.value)}>
            {FY_OPTIONS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
        </div>

        <div className="flex items-end">
          <button
            disabled={!selectedPartyId}
            onClick={handleOpenWorkspace}
            className={`w-full py-2.5 px-4 rounded-lg font-bold transition-all shadow-md ${selectedPartyId
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}>
            Open Party Workspace →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Pending', count: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Received', count: stats.received, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Completed', count: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Errors', count: stats.error, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        ].map((item, idx) => (
          <div key={idx} className={`p-5 rounded-xl border ${item.border} shadow-sm ${item.bg}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${item.color} opacity-80`}>{item.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {isLoading ? <span className="text-slate-300">—</span> : item.count}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          {isLoading && (
            <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Party</th>
                <th className="px-6 py-4 font-semibold">File Name</th>
                <th className="px-6 py-4 font-semibold">Period</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedUploads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {isLoading ? 'Loading...' : 'No uploads found for this selection.'}
                  </td>
                </tr>
              ) : (
                displayedUploads.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{u.customer_name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.file_name}</td>
                    <td className="px-6 py-4 text-slate-500">{u.month} · {u.financial_year}</td>
                    <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(u.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {uploads.length > 5 && (
            <div className="px-6 py-3 border-t border-slate-100 text-center">
              <button onClick={() => setShowAll(!showAll)}
                className="text-sm text-indigo-600 font-semibold hover:underline">
                {showAll ? 'Show Less' : `View All ${uploads.length} Uploads`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CADashboard;