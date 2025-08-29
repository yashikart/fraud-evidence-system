import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ChainVisualizer from './ChainVisualizer';
import CaseCorrelationVisualization from './CaseCorrelationVisualization';

const EvidenceLibrary = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [showChainVisualizer, setShowChainVisualizer] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showCorrelationView, setShowCorrelationView] = useState(false);
  const [correlationCaseId, setCorrelationCaseId] = useState('');

  // Check user role and permissions by verifying with backend
  const checkUserAccess = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setHasAccess(false);
        return false;
      }
      
      // Verify token with backend and get user info
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const response = await axios.get(`${backendUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.role) {
        const role = response.data.role;
        setUserRole(role);
        
        // Only allow investigators, admins, and superadmins
        const allowedRoles = ['investigator', 'admin', 'superadmin'];
        const hasValidRole = allowedRoles.includes(role);
        setHasAccess(hasValidRole);
        
        if (!hasValidRole) {
          toast.error('❌ Access denied: Evidence Library requires investigator or admin privileges');
        }
        
        return hasValidRole;
      } else {
        setHasAccess(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      // If verification fails, try to decode the token locally as fallback
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Try to decode JWT to get user role (in production, verify with backend)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const role = payload.role || payload.user_role;
          setUserRole(role);
          
          // Only allow investigators, admins, and superadmins
          const allowedRoles = ['investigator', 'admin', 'superadmin'];
          const hasValidRole = allowedRoles.includes(role);
          setHasAccess(hasValidRole);
          
          if (!hasValidRole) {
            toast.error('❌ Access denied: Evidence Library requires investigator or admin privileges');
          }
          
          return hasValidRole;
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
      }
      setHasAccess(false);
      return false;
    }
  };

  const fetchEvidence = async () => {
    const hasAccess = await checkUserAccess();
    if (!hasAccess) {
      return;
    }
    
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      // Use the role-based evidence endpoint instead of admin-only
      const response = await axios.get(
        `${backendUrl}/api/evidence?page=${page}&limit=20&sort=${sortBy}&order=${sortOrder}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setEvidence(response.data.evidence);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching evidence:', error);
      if (error.response?.status === 403) {
        toast.error('❌ Access denied: Insufficient permissions to view evidence library');
        setHasAccess(false);
      } else {
        toast.error('❌ Failed to fetch evidence');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserAccess().then(hasAccess => {
      if (hasAccess) {
        fetchEvidence();
      }
    });
  }, [page, sortBy, sortOrder]);

  const downloadEvidence = async (evidenceId, filename) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        `${backendUrl}/api/evidence/download/${evidenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ Evidence downloaded successfully!');
    } catch (error) {
      console.error('Error downloading evidence:', error);
      toast.error('❌ Failed to download evidence');
    }
  };

  const verifyEvidence = async (evidenceId) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${backendUrl}/api/evidence/verify/${evidenceId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`✅ Verification: ${response.data.verification.overallStatus.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error verifying evidence:', error);
      toast.error('❌ Failed to verify evidence');
    }
  };

  const generateCaseReport = async (caseId) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${backendUrl}/api/reports/case/${caseId}`,
        {
          format: 'pdf',
          includeEvidence: true,
          includeRiskEvolution: true,
          includeEscalations: true,
          includeTimeline: true,
          watermark: true
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case-report-${caseId}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('✅ PDF report generated and downloaded!');
    } catch (error) {
      console.error('Error generating case report:', error);
      toast.error('❌ Failed to generate case report');
    }
  };

  const generateEntityReport = async (entity) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${backendUrl}/api/reports/entity/${entity}`,
        {
          format: 'pdf',
          includeEvidence: true,
          includeTimeline: true,
          watermark: true
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `entity-report-${entity}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('✅ PDF report generated and downloaded!');
    } catch (error) {
      console.error('Error generating entity report:', error);
      toast.error('❌ Failed to generate entity report');
    }
  };

  const shareEvidence = async (evidenceId, shareData) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        `${backendUrl}/api/evidence/share/${evidenceId}`,
        shareData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('✅ Evidence shared successfully!');
        setShowShareModal(false);
        setSelectedEvidence(null);
      }
    } catch (error) {
      console.error('Error sharing evidence:', error);
      if (error.response?.status === 403) {
        toast.error('❌ Access denied: Insufficient permissions to share evidence');
      } else {
        toast.error('❌ Failed to share evidence');
      }
    }
  };

  const handleShareEvidence = (evidence) => {
    setSelectedEvidence(evidence);
    setShowShareModal(true);
  };

  const filteredEvidence = evidence.filter(item => {
    const matchesSearch = !searchTerm || 
      item.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalFilename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || item.verificationStatus === filterStatus;
    const matchesRisk = !filterRisk || item.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatHash = (hash) => {
    return hash ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : 'N/A';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Access control check
  if (!hasAccess) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-8 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">🚫 Access Denied</h2>
        <p className="text-red-600 mb-4">
          Evidence Library access is restricted to investigators and administrators only.
        </p>
        <div className="bg-red-100 rounded-lg p-4 text-sm text-red-700">
          <p><strong>Required Role:</strong> Investigator, Admin, or Superadmin</p>
          <p><strong>Your Role:</strong> {userRole || 'Unknown'}</p>
          <p className="mt-2">Please contact your administrator to request access permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">📁 Evidence Library</h2>
            <p className="text-sm text-gray-600 mt-1">
              🚫 Restricted Access: {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)} Level
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (evidence.length > 0) {
                  const firstCaseId = evidence[0].caseId;
                  setCorrelationCaseId(firstCaseId);
                  setShowCorrelationView(true);
                } else {
                  toast.error('❌ No evidence available for correlation analysis');
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              🌐 Case Correlation
            </button>
            <button
              onClick={() => {
                const uniqueCaseIds = [...new Set(evidence.map(e => e.caseId))];
                if (uniqueCaseIds.length > 0) {
                  generateCaseReport(uniqueCaseIds[0]);
                } else {
                  toast.error('❌ No evidence available for report generation');
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              📄 Generate Case Report
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by case ID, entity, or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Risk Levels</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="uploadedAt-desc">Latest First</option>
            <option value="uploadedAt-asc">Oldest First</option>
            <option value="caseId-asc">Case ID A-Z</option>
            <option value="caseId-desc">Case ID Z-A</option>
            <option value="riskLevel-desc">High Risk First</option>
          </select>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading evidence...</span>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case / Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blockchain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvidence.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.caseId}</div>
                      <div className="text-sm text-gray-500">{item.entity}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.originalFilename}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(item.fileSize)} • {item.fileType}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.slice(0, 2).map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Hash: {formatHash(item.fileHash)}</div>
                      <div>Block: #{item.blockNumber}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.verificationStatus)}`}>
                        {item.verificationStatus}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(item.riskLevel)}`}>
                        {item.riskLevel} risk
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(item.uploadedAt).toLocaleDateString()}</div>
                    <div>{item.uploadedBy}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-1">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => downloadEvidence(item._id, item.originalFilename)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => verifyEvidence(item._id)}
                        className="text-green-600 hover:text-green-900 text-xs"
                      >
                        ✅ Verify
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCaseId(item.caseId);
                          setShowChainVisualizer(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 text-xs"
                      >
                        🔗 View Chain
                      </button>
                      <button
                        onClick={() => generateCaseReport(item.caseId)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                        title="Generate styled PDF report with case summary, evidence hashes, risk evolution, and escalation trail"
                      >
                        📄 Generate Report
                      </button>
                      <button
                        onClick={() => generateEntityReport(item.entity)}
                        className="text-orange-600 hover:text-orange-900 text-xs"
                        title="Generate entity-specific PDF report"
                      >
                        👤 Entity Report
                      </button>
                      <button
                        onClick={() => handleShareEvidence(item)}
                        className="text-teal-600 hover:text-teal-900 text-xs font-medium"
                        title="Share evidence with other investigators"
                      >
                        📤 Share
                      </button>
                      <button
                        onClick={() => {
                          setCorrelationCaseId(item.caseId);
                          setShowCorrelationView(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 text-xs font-medium"
                        title="View case correlation visualization"
                      >
                        🌐 Correlation
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Share Evidence Modal */}
      {showShareModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">📤 Share Evidence</h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedEvidence(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Sharing:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">{selectedEvidence.originalFilename}</div>
                  <div className="text-sm text-gray-500">Case: {selectedEvidence.caseId}</div>
                  <div className="text-sm text-gray-500">Entity: {selectedEvidence.entity}</div>
                </div>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const shareData = {
                  shareWithEmails: formData.get('emails').split(',').map(email => email.trim()),
                  message: formData.get('message'),
                  expiryHours: parseInt(formData.get('expiry'))
                };
                shareEvidence(selectedEvidence._id, shareData);
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Share with (email addresses, comma separated)</label>
                  <input
                    type="text"
                    name="emails"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="user1@example.com, user2@example.com"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                  <textarea
                    name="message"
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Add a message to accompany the shared evidence..."
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (hours)</label>
                  <select
                    name="expiry"
                    defaultValue="24"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="1">1 hour</option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                    <option value="168">1 week</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      setSelectedEvidence(null);
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Share Evidence
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Case Correlation Visualization Modal */}
      {showCorrelationView && correlationCaseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] m-4">
            <CaseCorrelationVisualization 
              caseId={correlationCaseId}
              onClose={() => {
                setShowCorrelationView(false);
                setCorrelationCaseId('');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceLibrary;