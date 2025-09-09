import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import WalletInput from "./components/WalletInput";
import Timeline from "./components/Timeline";
// Removed OnChainStats to eliminate chain report display
import FileUpload from "./components/FileUpload";
import EvidenceLibrary from "./components/EvidenceLibrary";
import ChainVisualizer from "./components/ChainVisualizer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { flagWallet } from "./contract";
import { Link } from "react-router-dom";
import { useEventPolling } from "./hooks/useEventPolling";
import "./styles/Button.css";
import "./index.css";
import AlertLog from "./components/AlertLog";
import AdminDownloadTable from "./components/AdminDownloadTable";
import "leaflet/dist/leaflet.css";

function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState("");
  const [reason, setReason] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evidenceWallet, setEvidenceWallet] = useState("");
  const [caseId, setCaseId] = useState("");
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [showEvidenceLibrary, setShowEvidenceLibrary] = useState(false);
  const [showChainVisualizer, setShowChainVisualizer] = useState(false);
  const [mongoConnectionStatus, setMongoConnectionStatus] = useState("Checking...");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [submittedWallet, setSubmittedWallet] = useState("");
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [showMlAnalysis, setShowMlAnalysis] = useState(false);
  const [activeSection, setActiveSection] = useState('report'); // New state for sidebar navigation
  
  const { events, loading: eventsLoading } = useEventPolling(5050);

  // Check MongoDB connection
  const checkMongoConnection = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/health`);
      if (response.ok) {
        setMongoConnectionStatus("✅ Connected");
      } else {
        setMongoConnectionStatus("❌ Backend Error");
      }
    } catch (error) {
      setMongoConnectionStatus("❌ Connection Failed");
    }
  }, []);

  // Handle evidence upload success
  const handleEvidenceUploadSuccess = (uploadResult) => {
    toast.success(`✅ Evidence uploaded! Hash: ${uploadResult.evidence.fileHash.substring(0, 16)}...`);
  };

  // Handle evidence upload error
  const handleEvidenceUploadError = (error) => {
    toast.error(`❌ Evidence upload failed: ${error}`);
  };

  // Generate case ID for evidence
  const generateCaseId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `CASE_${timestamp}_${random}`;
  };

  // ML Analysis function
  const performMLAnalysis = async (wallet, reason) => {
    if (!wallet || !reason.trim()) {
      toast.error("Wallet and reason are required for ML analysis");
      return;
    }

    setMlLoading(true);
    setShowMlAnalysis(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ml/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            address: wallet,
            reason: reason
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMlAnalysis(data.analysis);
        toast.success("⚙️ ML Analysis completed!");
      } else {
        const errorData = await response.json();
        toast.error(`ML Analysis failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('ML Analysis error:', error);
      toast.error('❌ ML Analysis failed: Network error');
    } finally {
      setMlLoading(false);
    }
  };

  // Restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      // Check for stored auth token and user info
      const token = localStorage.getItem("authToken");
      const userInfo = localStorage.getItem("userInfo");
      
      if (token && userInfo) {
        try {
          const userData = JSON.parse(userInfo);
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role
          });
          
          // Verify role with backend to ensure accuracy
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to verify user role');
          }
          
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error parsing stored user info:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("userInfo");
        }
      }
      
      // Fallback to Supabase session if available
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem("authToken", session.access_token);
          
          // Verify user role with backend
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            localStorage.setItem("userInfo", JSON.stringify({
              id: userData.id,
              email: userData.email,
              role: userData.role,
              permissions: userData.permissions,
              isActive: userData.isActive
            }));
            
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role
            });
          }
        }
      } catch (error) {
        console.error("Error getting Supabase session:", error);
      }
      
      setLoading(false);
    };
    
    restoreSession();
    checkMongoConnection();
  }, [checkMongoConnection]);

  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !user?.email) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports?user_email=${user.email}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (data?.results) {
        setReports(data.results);
        const latest = data.results[0];
        if (latest?.risk === "high") {
          toast.warn(`🔴 High-risk report: ${latest.wallet}`);
        }
      }
    } catch (err) {
      console.error("❌ Failed to fetch reports:", err.message);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchReports();
  }, [user, fetchReports]);

  const signUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      toast.success("✅ Signup successful! Please check your email.");
    } catch (error) {
      toast.error(`❌ Signup failed: ${error.message}`);
    }
  };

  const signIn = async () => {
    try {
      const backendUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) 
        ? import.meta.env.VITE_BACKEND_URL 
        : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050');

      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        let errMsg = 'Invalid credentials';
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();

      // Persist token and user info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userInfo', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        permissions: data.user.permissions,
        isActive: data.user.isActive
      }));

      setUser({ id: data.user.id, email: data.user.email, role: data.user.role });
      toast.success('✅ Login successful!');

      // Redirect: only your email (or admin role) to /admin, others to /
      const adminEmail = 'aryangupta3103@gmail.com';
      if (data.user.email === adminEmail || data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      toast.error(`❌ Login failed: ${error.message}`);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("authToken");
      localStorage.removeItem("userInfo");
      setUser(null);
      toast.success("✅ Logged out successfully!");
    } catch (error) {
      toast.error(`❌ Logout failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading application...</p>
          <p className="text-gray-400 text-sm mt-2">Verifying authentication</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show main dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <ToastContainer position="top-right" autoClose={5000} />
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">🕵️ Fraud Evidence Management System</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <button
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  🔐 Logout
                </button>
                              </div>
            </div>
          </div>
        </header>

        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Connection Status */}
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">MongoDB:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    mongoConnectionStatus.includes("✅") 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {mongoConnectionStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Remove the separate ML tab since we're combining it with Report Fraud */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setActiveSection('report')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === 'report'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Report and analyze wallets"
              >
                📝 Report & Analyze
              </button>
              <button
                onClick={() => setActiveSection('evidence')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === 'evidence'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="View and manage evidence"
              >
                🗂️ Evidence Library
              </button>
              <button
                onClick={() => setActiveSection('timeline')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === 'timeline'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Analyze timelines and events"
              >
                📊 Timeline Analysis
              </button>
            </nav>
          </div>

          {/* Combined Report Fraud and ML Analysis Section */}
          {activeSection === 'report' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Report Fraud and ML Analysis Inputs */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">🕵️ Report & Analyze Fraud</h2>
                
                {/* Wallet Input for both reporting and analysis */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    placeholder="Enter wallet address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Reason Input for both reporting and analysis */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Reporting/Analysis
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe why you're reporting this wallet or what you want to analyze"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={async () => {
                      if (!wallet || !reason.trim()) {
                        toast.error("Wallet and reason are required");
                        return;
                      }
                      
                      try {
                        const token = localStorage.getItem('authToken');
                        const response = await fetch(
                          `${process.env.REACT_APP_BACKEND_URL}/api/reports`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              wallet,
                              reason,
                              user_email: user.email
                            })
                          }
                        );

                        if (response.ok) {
                          const data = await response.json();
                          setTransactionHash(data.transactionHash);
                          setReportSubmitted(true);
                          setSubmittedWallet(wallet);
                          toast.success("✅ Fraud report submitted successfully!");
                          fetchReports(); // Refresh reports
                        } else {
                          const errorData = await response.json();
                          toast.error(`Report submission failed: ${errorData.error}`);
                        }
                      } catch (error) {
                        console.error('Report submission error:', error);
                        toast.error('❌ Report submission failed: Network error');
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    🚨 Report Fraud
                  </button>
                  
                  <button
                    onClick={() => performMLAnalysis(wallet, reason)}
                    disabled={mlLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {mlLoading ? '🤖 Analyzing...' : '🤖 ML Analysis'}
                  </button>
                </div>
                
                {/* Report Submission Success Message */}
                {reportSubmitted && transactionHash && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-medium text-green-800 mb-2">✅ Report Submitted Successfully!</h3>
                    <p className="text-green-700">Transaction Hash: {transactionHash}</p>
                    <p className="text-green-700">Wallet: {submittedWallet}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Reports List and ML Analysis Results */}
              <div className="space-y-8">
                {/* Your Reports Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">📋 Your Reports</h2>
                  {reports.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {reports.map((report) => (
                        <div key={report._id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{report.wallet}</h3>
                              <p className="text-sm text-gray-500 mt-1">{report.reason}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(report.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.risk === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : report.risk === 'medium' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {report.risk} risk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">📋</div>
                      <p className="text-gray-500">No reports submitted yet</p>
                    </div>
                  )}
                </div>
                
                {/* ML Analysis Results Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">🤖 ML Analysis Results</h2>
                  
                  {mlLoading && (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Performing ML analysis...</p>
                      </div>
                    </div>
                  )}
                  
                  {mlAnalysis && !mlLoading && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Analysis Results</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Risk Score:</span> {mlAnalysis.riskScore}/100</p>
                        <p><span className="font-medium">Primary Violation:</span> {mlAnalysis.primaryViolation}</p>
                        <p><span className="font-medium">Recommended Action:</span> {mlAnalysis.recommendedAction}</p>
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800">{mlAnalysis.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!mlAnalysis && !mlLoading && (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">🤖</div>
                        <p>Enter a wallet address and click "ML Analysis" to perform fraud detection</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Evidence Library Section */}
          {activeSection === 'evidence' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">🗂️ Evidence Library</h2>
                <button
                  onClick={() => setShowEvidenceUpload(!showEvidenceUpload)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  {showEvidenceUpload ? 'Cancel' : '📤 Upload Evidence'}
                </button>
              </div>
              
              {showEvidenceUpload && (
                <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Evidence</h3>
                  <FileUpload 
                    onUploadSuccess={handleEvidenceUploadSuccess}
                    onUploadError={handleEvidenceUploadError}
                    caseId={caseId || generateCaseId()}
                    setCaseId={setCaseId}
                  />
                </div>
              )}
              
              <EvidenceLibrary />
            </div>
          )}

          {/* Timeline Analysis Section */}
          {activeSection === 'timeline' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">📊 Timeline Analysis</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet Address for Timeline Analysis
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={evidenceWallet}
                      onChange={(e) => setEvidenceWallet(e.target.value)}
                      placeholder="Enter wallet address"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => setShowChainVisualizer(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Visualize
                    </button>
                  </div>
                </div>
              </div>
              
              {eventsLoading && (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading blockchain events...</p>
                </div>
              )}
              
              <Timeline events={events} />
            </div>
          )}
        </main>

        {/* Chain Visualizer Modal */}
        {showChainVisualizer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] m-4">
              <ChainVisualizer 
                wallet={evidenceWallet}
                onClose={() => setShowChainVisualizer(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // If user is not logged in, show login/signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🕵️ Fraud Evidence System</h1>
          <p className="text-gray-600">Secure fraud reporting and evidence management</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={signIn}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
            >
              Sign In
            </button>
            <button
              onClick={signUp}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
            >
              Sign Up
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Test Accounts</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Admin: admin@test.com / AdminPass123!</p>
            <p>Investigator: investigator@test.com / InvestPass123!</p>
            <p>Public: public@test.com / PublicPass123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;