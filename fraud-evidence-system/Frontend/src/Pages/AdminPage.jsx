//src/Pages/AdminPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
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
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [searchWallet, setSearchWallet] = useState("");
  
  // ML Analysis state
  const [mlResults, setMlResults] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlRiskFilter, setMlRiskFilter] = useState("");
  const [mlViolationFilter, setMlViolationFilter] = useState("");
  const [showMlSection, setShowMlSection] = useState(true);

  // Fetch ML Analysis Results
  const fetchMLResults = async () => {
    setMlLoading(true);
    try {
      const url = import.meta.env.VITE_BACKEND_URL;
      if (!url) throw new Error("VITE_BACKEND_URL is not defined");

      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        limit: '50',
        offset: '0'
      });
      
      if (mlRiskFilter) params.append('risk_level', mlRiskFilter);
      if (mlViolationFilter) params.append('violation_type', mlViolationFilter);

      const res = await axios.get(`${url}/api/ml/results?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setMlResults(res.data.results || []);
    } catch (error) {
      console.error("Error fetching ML results:", error.message || error);
    } finally {
      setMlLoading(false);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const url = import.meta.env.VITE_BACKEND_URL;
        if (!url) throw new Error("VITE_BACKEND_URL is not defined");

        const res = await axios.get(`${url}/api/reports`);
        setReports(res.data);
      } catch (error) {
        console.error("Error fetching reports:", error.message || error);
      }
    };

    fetchReports();
    fetchMLResults(); // Fetch ML results on component mount
  }, []);

  // Refetch ML results when filters change
  useEffect(() => {
    if (showMlSection) {
      fetchMLResults();
    }
  }, [mlRiskFilter, mlViolationFilter, showMlSection]);

  const filteredReports = reports.filter((report) => {
    const matchesStatus = statusFilter ? report.status === statusFilter : true;
    const matchesRisk = riskFilter ? report.risk === riskFilter : true;
    const matchesWallet = searchWallet ? report.wallet.includes(searchWallet) : true;
    return matchesStatus && matchesRisk && matchesWallet;
  });

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">🛡️ Admin Dashboard</h1>

      {/* Threat Map with Geo-IP */}
      <div className="my-6">
        <h2 className="text-lg font-semibold mb-2">📍 Suspicious Wallets Threat Map</h2>
        <ThreatMap />
      </div>

      {/* ML Analysis Results Section */}
      <div className="my-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-800">AI/ML Analysis Results</h2>
              <p className="text-sm text-purple-600">Advanced behavioral pattern detection results</p>
            </div>
          </div>
          <button
            onClick={() => setShowMlSection(!showMlSection)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showMlSection ? 'Hide' : 'Show'} ML Results
          </button>
        </div>

        {showMlSection && (
          <>
            {/* ML Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-purple-700 mb-2">Risk Severity Filter</label>
                <select
                  onChange={(e) => setMlRiskFilter(e.target.value)}
                  className="w-full border border-purple-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={mlRiskFilter}
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">🟢 Low Risk (0.0 - 0.39)</option>
                  <option value="medium">🟡 Medium Risk (0.4 - 0.59)</option>
                  <option value="high">🟠 High Risk (0.6 - 0.79)</option>
                  <option value="critical">🔴 Critical Risk (0.8 - 1.0)</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-purple-700 mb-2">Violation Type Filter</label>
                <select
                  onChange={(e) => setMlViolationFilter(e.target.value)}
                  className="w-full border border-purple-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={mlViolationFilter}
                >
                  <option value="">All Violation Types</option>
                  <option value="rapid">Rapid Token Dump</option>
                  <option value="large">Large Transfers</option>
                  <option value="flash">Flash Loan Manipulation</option>
                  <option value="phishing">Phishing Activity</option>
                  <option value="low risk">Low Risk Activity</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setMlRiskFilter('');
                    setMlViolationFilter('');
                  }}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* ML Results Table */}
            {mlLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-purple-700">Loading ML analysis results...</span>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-purple-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Wallet Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Risk Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Violation Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Recommended Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Analysis Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">Analyzed</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mlResults.map((result, index) => (
                        <tr key={result.id || index} className="hover:bg-purple-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">
                              {result.address?.substring(0, 10)}...{result.address?.substring(result.address.length - 8)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.transaction_count} transactions
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${
                                result.score >= 0.8 ? 'text-red-600' :
                                result.score >= 0.6 ? 'text-orange-600' :
                                result.score >= 0.4 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {result.score}
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    result.score >= 0.8 ? 'bg-red-500' :
                                    result.score >= 0.6 ? 'bg-orange-500' :
                                    result.score >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${result.score * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {result.violation}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              result.recommended_action === 'freeze' ? 'bg-red-100 text-red-800' :
                              result.recommended_action === 'investigate' ? 'bg-orange-100 text-orange-800' :
                              result.recommended_action === 'monitor' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {result.recommended_action?.replace('_', ' ')?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Rapid Dump:</span>
                                <span className={result.analysis_details?.rapid_dumping?.detected ? 'text-red-600' : 'text-green-600'}>
                                  {result.analysis_details?.rapid_dumping?.detected ? '⚠️' : '✅'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Large Transfers:</span>
                                <span className={result.analysis_details?.large_transfers?.detected ? 'text-red-600' : 'text-green-600'}>
                                  {result.analysis_details?.large_transfers?.detected ? '⚠️' : '✅'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Flash Loans:</span>
                                <span className={result.analysis_details?.flash_loans?.detected ? 'text-red-600' : 'text-green-600'}>
                                  {result.analysis_details?.flash_loans?.detected ? '⚠️' : '✅'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Phishing:</span>
                                <span className={result.analysis_details?.phishing_indicators?.detected ? 'text-red-600' : 'text-green-600'}>
                                  {result.analysis_details?.phishing_indicators?.detected ? '⚠️' : '✅'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            <div>{new Date(result.analyzed_at).toLocaleDateString()}</div>
                            <div>{new Date(result.analyzed_at).toLocaleTimeString()}</div>
                            <div className="text-xs text-gray-400">by {result.analyzed_by}</div>
                          </td>
                        </tr>
                      ))}
                      {mlResults.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            <div className="text-4xl mb-2">🤖</div>
                            <div>No ML analysis results found matching the filters</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4">
        <select
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
          value={statusFilter}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="escalated">Escalated</option>
        </select>

        <select
          onChange={(e) => setRiskFilter(e.target.value)}
          className="border p-2 rounded"
          value={riskFilter}
        >
          <option value="">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          type="text"
          placeholder="Search by Wallet"
          className="border p-2 rounded flex-1"
          value={searchWallet}
          onChange={(e) => setSearchWallet(e.target.value)}
        />
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Wallet</th>
              <th className="py-2 px-4 border-b">Risk</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Timestamp</th>
              <th className="py-2 px-4 border-b">Details</th>
              <th className="py-2 px-4 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{report.wallet}</td>
                <td className="py-2 px-4 border-b capitalize">{report.risk}</td>
                <td className="py-2 px-4 border-b capitalize">{report.status}</td>
                <td className="py-2 px-4 border-b">
                  {new Date(report.timestamp).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b">
                  <RiskDial score={report.riskScore || 0} tags={report.tags || []} />
                </td>
                <td className="py-2 px-4 border-b text-center space-y-1">
                  {report.status !== "escalated" && (
                    <EscalateButton entityId={report.wallet} />
                  )}

                  {/* Show source labels */}
                  {report.source === "contract" && (
                    <span className="inline-block text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Flagged via Contract
                    </span>
                  )}
                  {report.source === "admin" && (
                    <span className="inline-block text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      Escalated by Admin
                    </span>
                  )}

                  {/* Case Export Button */}
                  {report.caseId && (
                    <div className="mt-2">
                      <CaseExportButton caseId={report.caseId} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No reports found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Global Report Export */}
      <div className="mt-4 text-right">
        <DownloadButton
          filters={{
            wallet: searchWallet,
            status: statusFilter,
            riskLevel: riskFilter,
          }}
        />
      </div>

      <div className="mt-10">
        <RLFeedbackPanel />
      </div>

      {/* Enforcement Smart Contract Panel */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">🔐 Smart Contract Enforcement</h2>
        <EnforcementPanel />
      </div>

      {/* Evidence Library */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">📁 Evidence Library</h2>
          <div className="text-sm text-gray-600">
            Secure evidence management with blockchain verification
          </div>
        </div>
        <EvidenceLibrary />
      </div>

      {/* Investigations */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">🔍 Investigations</h2>
          <div className="text-sm text-gray-600">
            Link multiple wallets/IPs under one investigation ID
          </div>
        </div>
        <Investigations />
      </div>
    </div>
  );
};

export default AdminPage;
