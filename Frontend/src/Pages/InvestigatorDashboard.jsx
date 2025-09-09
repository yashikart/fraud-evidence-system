// src/Pages/InvestigatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import EvidenceLibrary from '../components/EvidenceLibrary';

const InvestigatorDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('evidence');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';

  useEffect(() => {
    checkInvestigatorAccess();
  }, []);

  const checkInvestigatorAccess = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('❌ Please login to access investigator dashboard');
        window.location.href = '/';
        return;
      }

      const response = await axios.get(`${backendUrl}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && (response.data.role === 'investigator' || response.data.role === 'admin')) {
        setUser(response.data);
        toast.success(`✅ Welcome Investigator: ${response.data.email}`);
      } else {
        toast.error('❌ Investigator access required');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Investigator access check failed:', error);
      toast.error('❌ Investigator access verification failed');
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">🔄 Verifying investigator access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔍 Investigator Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.email} | Role: {user?.role}</p>
            </div>
            <div className="flex space-x-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">← Home</a>
              <button 
                onClick={() => {
                  localStorage.removeItem('authToken');
                  window.location.href = '/';
                }}
                className="text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'evidence' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📁 Evidence Library
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cases' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Cases
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔐 My Permissions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'evidence' && (
          <div>
            <EvidenceLibrary userRole={user?.role} />
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Case Management</h2>
            <div className="text-gray-600">
              <p>📋 Case management functionality coming soon...</p>
              <p className="mt-2">As an investigator, you can:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>View and manage investigation cases</li>
                <li>Upload and organize evidence</li>
                <li>Generate case reports</li>
                <li>Collaborate with other investigators</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Investigator Permissions</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-green-800">✅ Allowed Actions</h3>
                <p className="text-sm text-gray-600">✅ View Evidence Library</p>
                <p className="text-sm text-gray-600">✅ Share Evidence</p>
                <p className="text-sm text-gray-600">✅ Export Evidence</p>
                <p className="text-sm text-gray-600">✅ Create and Edit Cases</p>
                <p className="text-sm text-gray-600">✅ Upload Evidence</p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-medium text-red-800">❌ Restricted Actions</h3>
                <p className="text-sm text-gray-600">❌ Delete Evidence (Admin only)</p>
                <p className="text-sm text-gray-600">❌ Manage User Roles (Admin only)</p>
                <p className="text-sm text-gray-600">❌ System Administration (Admin only)</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800">📋 Your Role: {user?.role}</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You have investigator-level access to the fraud evidence system. 
                  Contact an administrator if you need additional permissions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigatorDashboard;