//src/Pages/AdminPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThreatMap from "../components/ThreatMap";
import RiskDial from "../components/RiskDial";
import EscalateButton from "../components/EscalateButton";
import DownloadButton from "../components/DownloadButton";
import EnforcementPanel from "../components/EnforcementPanel";
import RLFeedbackPanel from "../components/RLFeedbackPanel";
import CaseExportButton from "../components/CaseExportButton";
import EvidenceLibrary from "../components/EvidenceLibrary";
import Investigations from "../components/Investigations";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [searchWallet, setSearchWallet] = useState("");
  
  // ML Analysis state
  const [mlResults, setMlResults] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlRiskFilter, setMlRiskFilter] = useState("");
  const [mlViolationFilter, setMlViolationFilter] = useState("");
  const [showMlSection, setShowMlSection] = useState(false);

  // Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState({
    totalReports: 0,
    highRiskCases: 0,
    pendingInvestigations: 0,
    resolvedCases: 0,
    mlAnalysisCount: 0,
    activeThreats: 0
  });

  // Calculate dashboard statistics
  useEffect(() => {
    const stats = {
      totalReports: reports.length,
      highRiskCases: reports.filter(r => r.risk === 'high').length,
      pendingInvestigations: reports.filter(r => r.status === 'pending').length,
      resolvedCases: reports.filter(r => r.status === 'reviewed').length,
      mlAnalysisCount: mlResults.length,
      activeThreats: mlResults.filter(r => r.score >= 0.6).length
    };
    setDashboardStats(stats);
  }, [reports, mlResults]);

  // Remove admin access check - all authenticated users can access
  useEffect(() => {
    // Any authentication check can be done here if needed, but no role verification
  }, []);

  // Fetch ML Analysis Results
  const fetchMLResults = async () => {
    setMlLoading(true);
    try {
      // Mock ML results for demonstration
      const mockMLResults = [
        {
          id: '1',
          address: '0x742d35cc8e3b8f9b9b4c1a2e5f7d8a9b0c1d2e3f',
          score: 0.85,
          violation: 'Rapid Token Dump',
          recommended_action: 'freeze',
          transaction_count: 47,
          analyzed_at: new Date().toISOString(),
          analyzed_by: 'ML System v2.1',
          analysis_details: {
            rapid_dumping: { detected: true },
            large_transfers: { detected: true },
            flash_loans: { detected: false },
            phishing_indicators: { detected: true }
          }
        },
        {
          id: '2',
          address: '0xa1b2c3d4e5f6789012345678901234567890abcd',
          score: 0.65,
          violation: 'Phishing Activity',
          recommended_action: 'investigate',
          transaction_count: 23,
          analyzed_at: new Date().toISOString(),
          analyzed_by: 'ML System v2.1',
          analysis_details: {
            rapid_dumping: { detected: false },
            large_transfers: { detected: true },
            flash_loans: { detected: false },
            phishing_indicators: { detected: true }
          }
        },
        {
          id: '3',
          address: '0x9876543210fedcba0987654321fedcba09876543',
          score: 0.45,
          violation: 'Large Transfers',
          recommended_action: 'monitor',
          transaction_count: 12,
          analyzed_at: new Date().toISOString(),
          analyzed_by: 'ML System v2.1',
          analysis_details: {
            rapid_dumping: { detected: false },
            large_transfers: { detected: true },
            flash_loans: { detected: false },
            phishing_indicators: { detected: false }
          }
        }
      ];
      
      setMlResults(mockMLResults);
    } catch (error) {
      console.error("Error fetching ML results:", error.message || error);
      toast.error("Error fetching ML results");
    } finally {
      setMlLoading(false);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Mock reports data for demonstration
        const mockReports = [
          {
            wallet: '0x742d35cc8e3b8f9b9b4c1a2e5f7d8a9b0c1d2e3f',
            risk: 'high',
            status: 'pending',
            timestamp: new Date().toISOString(),
            riskScore: 0.85,
            tags: ['phishing', 'rapid-dump'],
            source: 'contract',
            caseId: 'CASE_2024_0891'
          },
          {
            wallet: '0xa1b2c3d4e5f6789012345678901234567890abcd',
            risk: 'medium',
            status: 'reviewed',
            timestamp: new Date().toISOString(),
            riskScore: 0.65,
            tags: ['suspicious-pattern'],
            source: 'admin',
            caseId: 'CASE_2024_0890'
          },
          {
            wallet: '0x9876543210fedcba0987654321fedcba09876543',
            risk: 'low',
            status: 'pending',
            timestamp: new Date().toISOString(),
            riskScore: 0.35,
            tags: ['monitoring'],
            source: 'contract',
            caseId: 'CASE_2024_0889'
          }
        ];
        setReports(mockReports);
      } catch (error) {
        console.error("Error fetching reports:", error.message || error);
        toast.error("Error fetching reports");
      }
    };

    fetchReports();
    fetchMLResults();
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesStatus = statusFilter ? report.status === statusFilter : true;
    const matchesRisk = riskFilter ? report.risk === riskFilter : true;
    const matchesWallet = searchWallet ? report.wallet.includes(searchWallet) : true;
    return matchesStatus && matchesRisk && matchesWallet;
  });

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 border border-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-xl border-r border-gray-200">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">📊</span>
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'reports'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">📋</span>
              Reports
            </button>
            
            <button
              onClick={() => setActiveTab('ml-analysis')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'ml-analysis'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">🤖</span>
              AI Analysis
            </button>
            
            <button
              onClick={() => setActiveTab('evidence')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'evidence'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">🗂️</span>
              Evidence
            </button>
            
            <button
              onClick={() => setActiveTab('investigations')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'investigations'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">🔍</span>
              Investigations
            </button>
            
            <button
              onClick={() => setActiveTab('threat-map')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'threat-map'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">🗺️</span>
              Threat Map
            </button>
            
            <button
              onClick={() => setActiveTab('enforcement')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'enforcement'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">⚖️</span>
              Enforcement
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'settings'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="w-5 h-5 mr-3">⚙️</span>
              Settings
            </button>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Administrator</p>
              <p className="text-xs text-gray-500 truncate">System Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16">
          <div className="flex items-center justify-between h-full px-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'reports' && 'Fraud Reports'}
                {activeTab === 'ml-analysis' && 'AI/ML Analysis'}
                {activeTab === 'evidence' && 'Evidence Management'}
                {activeTab === 'investigations' && 'Investigations'}
                {activeTab === 'threat-map' && 'Threat Map'}
                {activeTab === 'enforcement' && 'Enforcement'}
                {activeTab === 'settings' && 'System Settings'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userInfo');
                  window.location.href = '/';
                }}
                className="text-sm text-gray-600 hover:text-red-600 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalReports}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+12%</span>
                  <span className="text-gray-500 ml-2">from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Risk Cases</p>
                    <p className="text-3xl font-bold text-red-600">{dashboardStats.highRiskCases}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-red-600 font-medium">Requires attention</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Threats</p>
                    <p className="text-3xl font-bold text-orange-600">{dashboardStats.activeThreats}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-orange-600 font-medium">ML Detected</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Investigations</p>
                    <p className="text-3xl font-bold text-yellow-600">{dashboardStats.pendingInvestigations}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-yellow-600 font-medium">In progress</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolved Cases</p>
                    <p className="text-3xl font-bold text-green-600">{dashboardStats.resolvedCases}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">Completed</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ML Analysis</p>
                    <p className="text-3xl font-bold text-purple-600">{dashboardStats.mlAnalysisCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-purple-600 font-medium">AI Processed</span>
                </div>
              </div>
            </div>

            {/* Global Threat Map */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Global Threat Map</h2>
                  <p className="text-gray-600 mt-1">Real-time geographic threat visualization</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                    Live monitoring
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <ThreatMap />
              </div>
            </div>

            {/* System Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                  <p className="text-gray-600 mt-1">Real-time monitoring and analytics</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Detection Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Detection Rate</span>
                      <span className="font-semibold text-green-600">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">False Positive Rate</span>
                      <span className="font-semibold text-orange-600">2.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Response Time</span>
                      <span className="font-semibold text-blue-600">&lt; 2 min</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">System Health</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">System Status</span>
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-600">Online</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Database Status</span>
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-600">Connected</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ML Engine</span>
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-600">Active</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {reports.slice(0, 5).map((report, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      report.risk === 'high' ? 'bg-red-500' :
                      report.risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {report.wallet.substring(0, 10)}...{report.wallet.substring(report.wallet.length - 8)}
                      </p>
                      <p className="text-sm text-gray-500">{new Date(report.timestamp).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      report.risk === 'high' ? 'bg-red-100 text-red-800' :
                      report.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.risk} risk
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Fraud Reports Management</h2>
                  <p className="text-sm text-gray-600">Monitor and analyze fraud reports across the network</p>
                </div>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                <select 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  value={statusFilter}
                >
                  <option value="">🔄 All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="reviewed">✅ Reviewed</option>
                  <option value="escalated">🚑 Escalated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <select 
                  onChange={(e) => setRiskFilter(e.target.value)} 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  value={riskFilter}
                >
                  <option value="">⚡ All Risk</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Wallet</label>
                <input 
                  type="text" 
                  placeholder="Enter wallet address..." 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  value={searchWallet} 
                  onChange={(e) => setSearchWallet(e.target.value)} 
                />
              </div>
              <div className="flex items-end space-x-2">
                <DownloadButton filters={{ wallet: searchWallet, status: statusFilter, riskLevel: riskFilter }} />
              </div>
            </div>
            
            {/* Reports Table */}
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Wallet Address</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Risk Level</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Analysis</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReports.map((report, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm">
                            {report.wallet.substring(0, 10)}...{report.wallet.substring(report.wallet.length - 8)}
                          </div>
                          <div className="text-xs text-gray-500">Case: {report.caseId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            report.risk === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                            report.risk === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {report.risk === 'high' ? '🔴' : report.risk === 'medium' ? '🟡' : '🟢'} {report.risk.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            report.status === 'escalated' ? 'bg-red-100 text-red-800 border border-red-200' :
                            report.status === 'reviewed' ? 'bg-green-100 text-green-800 border border-green-200' :
                            'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {report.status === 'escalated' ? '🚑' : report.status === 'reviewed' ? '✅' : '⏳'} {report.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(report.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <RiskDial score={report.riskScore || 0} tags={report.tags || []} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {report.status !== "escalated" && <EscalateButton entityId={report.wallet} />}
                            {report.caseId && <CaseExportButton caseId={report.caseId} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredReports.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                  <p className="text-gray-500">No fraud reports match your current filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ML Analysis Tab */}
        {activeTab === 'ml-analysis' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI/ML Analysis Results</h2>
                  <p className="text-gray-600 mt-1">Advanced behavioral pattern detection and fraud analysis</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchMLResults}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 font-medium"
                >
                  Refresh Analysis
                </button>
              </div>
            </div>

            {/* ML Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Analyzed</p>
                    <p className="text-3xl font-bold text-purple-800 mt-2">{mlResults.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">📊</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Last 24 hours</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Risk</p>
                    <p className="text-3xl font-bold text-red-800 mt-2">{mlResults.filter(r => r.score >= 0.7).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Requires attention</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Medium Risk</p>
                    <p className="text-3xl font-bold text-orange-800 mt-2">{mlResults.filter(r => r.score >= 0.4 && r.score < 0.7).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-xl">⚡</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Under review</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Risk</p>
                    <p className="text-3xl font-bold text-green-800 mt-2">{mlResults.filter(r => r.score < 0.4).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Normal activity</span>
                </div>
              </div>
            </div>

            {/* ML Analysis Details */}
            <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Analysis Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">94.2%</div>
                  <div className="text-sm text-gray-600 mt-1">Detection Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">&lt; 2s</div>
                  <div className="text-sm text-gray-600 mt-1">Average Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">99.1%</div>
                  <div className="text-sm text-gray-600 mt-1">System Uptime</div>
                </div>
              </div>
            </div>

            {/* Analysis Filters */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                  <select
                    onChange={(e) => setMlRiskFilter(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={mlRiskFilter}
                  >
                    <option value="">All Risk Levels</option>
                    <option value="low">Low Risk (0.0 - 0.39)</option>
                    <option value="medium">Medium Risk (0.4 - 0.59)</option>
                    <option value="high">High Risk (0.6 - 0.79)</option>
                    <option value="critical">Critical Risk (0.8 - 1.0)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Violation Type</label>
                  <select
                    onChange={(e) => setMlViolationFilter(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={mlViolationFilter}
                  >
                    <option value="">All Violation Types</option>
                    <option value="Rapid Token Dump">Rapid Token Dump</option>
                    <option value="Large Transfers">Large Transfers</option>
                    <option value="Phishing Activity">Phishing Activity</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setMlRiskFilter('');
                      setMlViolationFilter('');
                    }}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Results Table */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              {mlLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="ml-4 text-gray-600 font-medium">Analyzing behavioral patterns...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Wallet Address</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Risk Score</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Violation Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Recommended Action</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Transaction Count</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Analysis Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mlResults
                        .filter(result => {
                          const matchesRisk = !mlRiskFilter || (
                            (mlRiskFilter === 'low' && result.score < 0.4) ||
                            (mlRiskFilter === 'medium' && result.score >= 0.4 && result.score < 0.6) ||
                            (mlRiskFilter === 'high' && result.score >= 0.6 && result.score < 0.8) ||
                            (mlRiskFilter === 'critical' && result.score >= 0.8)
                          );
                          const matchesViolation = !mlViolationFilter || result.violation === mlViolationFilter;
                          return matchesRisk && matchesViolation;
                        })
                        .map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm text-gray-900">
                              {result.address?.substring(0, 10)}...{result.address?.substring(result.address?.length - 8)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Analyzed by {result.analyzed_by}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <span className={`font-bold text-lg ${
                                result.score >= 0.8 ? 'text-red-600' :
                                result.score >= 0.6 ? 'text-orange-600' :
                                result.score >= 0.4 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {(result.score * 100).toFixed(0)}%
                              </span>
                              <div className={`w-2 h-2 rounded-full ${
                                result.score >= 0.8 ? 'bg-red-500' :
                                result.score >= 0.6 ? 'bg-orange-500' :
                                result.score >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              {result.violation}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              result.recommended_action === 'freeze' ? 'bg-red-100 text-red-800 border border-red-200' :
                              result.recommended_action === 'investigate' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {result.recommended_action === 'freeze' ? 'FREEZE' :
                               result.recommended_action === 'investigate' ? 'INVESTIGATE' :
                               'MONITOR'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-700">
                            {result.transaction_count} txns
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {new Date(result.analyzed_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mlResults.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-gray-400">🤖</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results Available</h3>
                      <p className="text-gray-500 mb-6">Run ML analysis to detect suspicious behavioral patterns.</p>
                      <button
                        onClick={fetchMLResults}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                      >
                        Run Analysis
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <EvidenceLibrary />
          </div>
        )}

        {/* Investigations Tab */}
        {activeTab === 'investigations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🔍</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Active Investigations</h2>
                  <p className="text-sm text-gray-600">Monitor and coordinate fraud investigations</p>
                </div>
              </div>
            </div>
            <Investigations />
          </div>
        )}

        {/* Threat Map Tab */}
        {activeTab === 'threat-map' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🗺️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Global Threat Map</h2>
                  <p className="text-sm text-gray-600">Real-time geographic threat visualization</p>
                </div>
              </div>
            </div>
            <ThreatMap />
          </div>
        )}

        {/* Enforcement Tab */}
        {activeTab === 'enforcement' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">⚖️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Smart Contract Enforcement</h2>
                    <p className="text-sm text-gray-600">Automated fraud prevention and enforcement actions</p>
                  </div>
                </div>
              </div>
              <EnforcementPanel />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Reinforcement Learning Feedback</h2>
                    <p className="text-sm text-gray-600">AI model performance and feedback optimization</p>
                  </div>
                </div>
              </div>
              <RLFeedbackPanel />
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">⚙️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">System Configuration</h2>
                    <p className="text-sm text-gray-600">Manage system settings and security configurations</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium">
                    Save Changes
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium">
                    Reset Defaults
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Security Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white mr-3 text-sm">🔒</span>
                    Security Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">Two-Factor Authentication</span>
                        <p className="text-sm text-gray-600">Enhanced login security</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 font-medium text-sm">✓ Enabled</span>
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors font-medium">
                          Configure
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">Session Timeout</span>
                        <p className="text-sm text-gray-600">Auto-logout inactive sessions</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-700 font-medium text-sm">30 minutes</span>
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors font-medium">
                          Change
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">IP Whitelist</span>
                        <p className="text-sm text-gray-600">Restrict admin access by IP</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-600 font-medium text-sm">⚠ Disabled</span>
                        <button className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded transition-colors font-medium">
                          Enable
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* System Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 text-sm">📊</span>
                    System Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">Database Connection</span>
                        <p className="text-sm text-gray-600">MongoDB cluster status</p>
                      </div>
                      <span className="text-green-600 font-medium text-sm">✓ Online</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">ML Engine</span>
                        <p className="text-sm text-gray-600">AI analysis service</p>
                      </div>
                      <span className="text-green-600 font-medium text-sm">✓ Running</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">Blockchain Sync</span>
                        <p className="text-sm text-gray-600">Evidence chain sync status</p>
                      </div>
                      <span className="text-green-600 font-medium text-sm">✓ Synced</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Settings Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Notification Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white mr-3 text-sm">🔔</span>
                    Notification Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">High Risk Alerts</span>
                        <p className="text-sm text-gray-600">Instant notifications for high-risk activities</p>
                      </div>
                      <label className="inline-flex items-center">
                        <input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-purple-600 border-2 border-gray-300 rounded" />
                      </label>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">Daily Summary</span>
                        <p className="text-sm text-gray-600">Email summary of daily activities</p>
                      </div>
                      <label className="inline-flex items-center">
                        <input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-purple-600 border-2 border-gray-300 rounded" />
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Performance Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white mr-3 text-sm">⚡</span>
                    Performance Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">Auto-refresh Interval</span>
                        <p className="text-sm text-gray-600">Dashboard data refresh rate</p>
                      </div>
                      <select className="text-gray-700 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>30 seconds</option>
                        <option>1 minute</option>
                        <option>5 minutes</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-900">Cache Duration</span>
                        <p className="text-sm text-gray-600">ML analysis cache time</p>
                      </div>
                      <select className="text-gray-700 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>5 minutes</option>
                        <option>15 minutes</option>
                        <option>1 hour</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
