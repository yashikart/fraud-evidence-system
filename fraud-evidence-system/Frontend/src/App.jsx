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
      // Try to restore session from our custom auth token first
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
          const response = await fetch(`${backendUrl}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role
            });
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error verifying custom auth token:", error);
        }
      }
      
      // Fallback to Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem("authToken", session.access_token);
        localStorage.setItem("userInfo", JSON.stringify(session.user));
        setUser(session.user);
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
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    alert("Sign up successful! Please check your email to confirm.");
  };

  const signIn = async () => {
    // Try backend authentication first
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();
      
      if (response.ok && data.token) {
        // Store the backend JWT token
        localStorage.setItem("authToken", data.token);
        
        // Get user info
        const userResponse = await fetch(`${backendUrl}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem("userInfo", JSON.stringify(userData));
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role
          });
          alert("Login successful!");
        } else {
          alert("Login successful, but failed to get user info");
        }
      } else {
        // Fallback to Supabase authentication
        const { data: loginData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert(error.message);
          return;
        }

        const { session, user } = loginData;
        localStorage.setItem("authToken", session.access_token);
        localStorage.setItem("userInfo", JSON.stringify(user));
        setUser(user);
        alert("Login successful!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  };

  const signOut = async () => {
    // Clear both Supabase and backend auth
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase sign out error:", error);
    }
    
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    setUser(null);
    setReports([]);
    setWallet("");
    setReason("");
    setTransactionHash("");
    alert("Logged out successfully!");
  };

  const submitReport = async () => {
    if (!wallet) return alert("Please enter a valid wallet.");
    if (!reason.trim()) return alert("Please enter a reason for reporting.");

    // Trigger ML analysis immediately when submit is clicked
    await performMLAnalysis(wallet, reason);

    const today = new Date().toISOString().split("T")[0];
    const count = JSON.parse(localStorage.getItem("reportCount") || "{}");
    if (!count[today]) count[today] = 0;
    if (count[today] >= 3) {
      toast.error("⚠️ Daily report limit (3) reached.");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Session expired. Please log in again.");
      signOut();
      return;
    }

    try {
      toast.info("⏳ Sending to smart contract...");
      const tx = await flagWallet(wallet);
      await tx.wait();
      toast.success("✅ Flag confirmed on-chain!");
      setTransactionHash(tx.hash);
    } catch (err) {
      console.error("❌ Contract error:", err);
      toast.error(`❌ Contract error: ${err.message || "Unknown error"}`);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_email: user.email,
            wallet,
            reason,
            status: "pending",
            date: today,
          }),
        }
      );

      if (response.ok) {
        toast.success("✅ Report submitted successfully!");
        setWallet("");
        setReason("");
        setReportSubmitted(true);
        setSubmittedWallet(wallet);
        fetchReports(); // Refresh reports
      } else {
        const errorData = await response.json();
        toast.error(`❌ Report submission failed: ${errorData.error}`);
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      toast.error("❌ Report submission failed");
    }
  };

  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header with Email Display */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ChainSafeGuard</h1>
                <p className="text-xs text-gray-500">Fraud Detection & Evidence Management</p>
              </div>
            </div>

            {/* User Info & Navigation */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Current Email Display */}
                  <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{user.email}</p>
                      {isAdmin && (
                        <p className="text-xs text-green-600 font-medium">🛡 Admin Access</p>
                      )}
                    </div>
                  </div>

                  {/* Mobile Email Display */}
                  <div className="sm:hidden bg-gray-100 rounded-full px-3 py-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button 
                    onClick={signOut} 
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors duration-200"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">🚪</span>
                  </button>
                </>
              )}

              <Link 
                to="/public" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
              >
                🔎 Public Risk Checker
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading session...</span>
          </div>
        ) : !user ? (
          <div className="max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl">🛡️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ChainSafeGuard</h2>
              <p className="text-gray-600">Secure fraud detection and evidence management</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col space-y-3 pt-4">
                <button 
                  onClick={signIn} 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Sign In
                </button>
                <button 
                  onClick={signUp} 
                  className="w-full border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Create New Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Admin Panel Section */}
            {isAdmin && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">🛡</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Admin Dashboard</h2>
                    <p className="text-sm text-green-600">Administrative tools and data management</p>
                  </div>
                </div>
                <AdminDownloadTable />
              </div>
            )}

            {/* Incident Report Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🚨</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Report Suspicious Activity</h2>
                  <p className="text-sm text-gray-600">Submit wallet addresses for fraud investigation</p>
                </div>
              </div>

              <div className="space-y-6">

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                    <WalletInput onValid={(wallet) => setWallet(wallet)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Reporting
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200 resize-none"
                      placeholder="Describe the suspicious activity in detail..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={submitReport} 
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                      disabled={!wallet || !reason.trim()}
                    >
                      🚨 Submit Report & Analyze with AI
                    </button>
                    {(!wallet || !reason.trim()) && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        📋 Both wallet address and reason are required for ML analysis
                      </p>
                    )}
                  </div>

                  {transactionHash && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2 font-medium">Transaction Submitted</p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View on Etherscan ↗
                      </a>
                    </div>
                  )}

                  {/* ML Analysis Preview - When fields are filled but not submitted */}
                  {wallet && reason.trim() && !showMlAnalysis && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">🤖</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            ✨ AI Analysis Ready
                          </p>
                          <p className="text-xs text-blue-600">
                            Click submit to analyze wallet behavior patterns
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ML Analysis Section - Shows immediately when submit is clicked */}
                  {showMlAnalysis && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">🤖</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-purple-800">AI/ML Analysis Results</h3>
                          <p className="text-sm text-purple-600">Real-time behavioral pattern detection</p>
                        </div>
                      </div>

                      {mlLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          <span className="ml-3 text-purple-700">Analyzing wallet behavior patterns...</span>
                        </div>
                      ) : mlAnalysis ? (
                        <div className="space-y-4">
                          {/* Risk Score Display */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">Risk Score</span>
                              <span className={`text-2xl font-bold ${
                                mlAnalysis.score >= 0.8 ? 'text-red-600' :
                                mlAnalysis.score >= 0.6 ? 'text-orange-600' :
                                mlAnalysis.score >= 0.4 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {mlAnalysis.score}/1.0
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  mlAnalysis.score >= 0.8 ? 'bg-red-500' :
                                  mlAnalysis.score >= 0.6 ? 'bg-orange-500' :
                                  mlAnalysis.score >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${mlAnalysis.score * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Violation Type */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Violations</h4>
                            <p className={`text-sm font-semibold ${
                              mlAnalysis.violation === 'Low risk activity' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {mlAnalysis.violation}
                            </p>
                          </div>

                          {/* Recommended Action */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Action</h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              mlAnalysis.recommended_action === 'freeze' ? 'bg-red-100 text-red-800' :
                              mlAnalysis.recommended_action === 'investigate' ? 'bg-orange-100 text-orange-800' :
                              mlAnalysis.recommended_action === 'monitor' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {mlAnalysis.recommended_action.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>

                          {/* Analysis Details */}
                          {mlAnalysis.analysis_details && (
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Analysis Breakdown</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="flex justify-between">
                                  <span>Rapid Dumping:</span>
                                  <span className={mlAnalysis.analysis_details.rapid_dumping?.detected ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                    {mlAnalysis.analysis_details.rapid_dumping?.detected ? '⚠️ Detected' : '✅ Clean'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Large Transfers:</span>
                                  <span className={mlAnalysis.analysis_details.large_transfers?.detected ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                    {mlAnalysis.analysis_details.large_transfers?.detected ? '⚠️ Detected' : '✅ Clean'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Flash Loans:</span>
                                  <span className={mlAnalysis.analysis_details.flash_loans?.detected ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                    {mlAnalysis.analysis_details.flash_loans?.detected ? '⚠️ Detected' : '✅ Clean'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Phishing Indicators:</span>
                                  <span className={mlAnalysis.analysis_details.phishing_indicators?.detected ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                    {mlAnalysis.analysis_details.phishing_indicators?.detected ? '⚠️ Detected' : '✅ Clean'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                            <div className="flex justify-between items-center">
                              <span>Analyzed: {new Date(mlAnalysis.analyzed_at).toLocaleString()}</span>
                              <span>Transactions: {mlAnalysis.transaction_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <span className="text-2xl mb-2 block">🤖</span>
                          <p className="font-medium">AI Analysis in Progress</p>
                          <p className="text-xs mt-1">Analyzing wallet behavior and transaction patterns...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence Management Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📎</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-800">Evidence Management</h2>
                  <p className="text-sm text-blue-600">Upload and manage digital evidence with blockchain verification</p>
                </div>
              </div>
                
              {/* Connection Status Card */}
              <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">💾</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Database Connection</p>
                    <p className="text-sm font-semibold {mongoConnectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}">
                      {mongoConnectionStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence Wallet Input */}
              <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  💳 Wallet ID for Evidence Upload
                </label>
                <input
                  type="text"
                  value={evidenceWallet}
                  onChange={(e) => setEvidenceWallet(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter wallet address to associate evidence..."
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => {
                    if (!evidenceWallet.trim()) {
                      toast.error("Please enter a wallet ID first");
                      return;
                    }
                    setCaseId(generateCaseId());
                    setShowEvidenceUpload(true);
                    setShowEvidenceLibrary(false);
                    setShowChainVisualizer(false);
                  }}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>📎</span>
                  <span>Upload Evidence</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowEvidenceLibrary(true);
                    setShowEvidenceUpload(false);
                    setShowChainVisualizer(false);
                  }}
                  className="flex items-center justify-center space-x-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  <span>📁</span>
                  <span>Evidence Library</span>
                </button>
                
                {evidenceWallet && (
                  <button
                    onClick={() => {
                      if (!evidenceWallet.trim()) {
                        toast.error("Please enter a wallet ID first");
                        return;
                      }
                      setCaseId(generateCaseId());
                      setShowChainVisualizer(true);
                      setShowEvidenceUpload(false);
                      setShowEvidenceLibrary(false);
                    }}
                    className="flex items-center justify-center space-x-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    <span>🔗</span>
                    <span>View Chain</span>
                  </button>
                )}
              </div>

              {/* Evidence Upload Section */}
              {showEvidenceUpload && evidenceWallet && (
                <div className="bg-white border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">📎</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Upload Evidence
                      </h3>
                      <p className="text-sm text-gray-600">Wallet: <span className="font-mono text-blue-600">{evidenceWallet}</span></p>
                    </div>
                  </div>
                  <FileUpload
                    caseId={caseId}
                    entity={evidenceWallet}
                    onUploadSuccess={handleEvidenceUploadSuccess}
                    onUploadError={handleEvidenceUploadError}
                  />
                </div>
              )}

              {/* Evidence Library Section */}
              {showEvidenceLibrary && (
                <div className="bg-white border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">📁</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Evidence Library</h3>
                      <p className="text-sm text-gray-600">Browse and manage all uploaded evidence</p>
                    </div>
                  </div>
                  <EvidenceLibrary />
                </div>
              )}

              {/* Chain Visualizer Section */}
              {showChainVisualizer && evidenceWallet && (
                <div className="bg-white border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🔗</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Evidence Chain</h3>
                      <p className="text-sm text-gray-600">Case: <span className="font-mono text-indigo-600">{caseId}</span></p>
                    </div>
                  </div>
                  <ChainVisualizer
                    caseId={caseId}
                    onError={(error) => toast.error(error)}
                  />
                </div>
              )}
            </div>

            {/* Reports Timeline Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📈</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Reports Timeline</h2>
                  <p className="text-sm text-gray-600">Track your submitted incident reports</p>
                </div>
              </div>
              <Timeline reports={reports} />
            </div>

            {/* Recent Events Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🚨</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Flagged Events</h2>
                  <p className="text-sm text-gray-600">Real-time wallet flagging activities</p>
                </div>
              </div>
              
              {eventsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600">Loading events...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">💭</span>
                  </div>
                  <p className="text-gray-500">No recent events to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 text-lg">⚠️</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">Wallet:</span>
                            <span className="text-sm font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              {event.payload.entityId}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Report ID: {event.payload.reportId}</span>
                            <span>{new Date(event.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alert Log Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🚨</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">System Alerts</h2>
                  <p className="text-sm text-gray-600">Monitor system notifications and alerts</p>
                </div>
              </div>
              <AlertLog />
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🛡️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">ChainSafeGuard</p>
                <p className="text-xs text-gray-500">Fraud Detection & Evidence Management</p>
              </div>
            </div>
            <div className="text-center text-gray-500 text-sm">
              <p>&copy; 2025 ChainSafeGuard | Built with ❤️ by Aryan & Keval</p>
            </div>
          </div>
        </div>
      </footer>
      
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default HomePage;
