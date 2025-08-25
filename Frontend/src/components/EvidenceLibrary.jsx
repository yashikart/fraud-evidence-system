import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChainVisualizer from './ChainVisualizer';

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

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      // Fetch all evidence for admin
      const response = await axios.get(
        `${backendUrl}/api/evidence/admin/all?page=${page}&limit=20&sort=${sortBy}&order=${sortOrder}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setEvidence(response.data.evidence);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [page, sortBy, sortOrder]);

  const downloadEvidence = async (evidenceId, filename) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
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
    } catch (error) {
      console.error('Error downloading evidence:', error);
      alert('Failed to download evidence');
    }
  };

  const verifyEvidence = async (evidenceId) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
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
        alert(`Verification: ${response.data.verification.overallStatus.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error verifying evidence:', error);
      alert('Failed to verify evidence');
    }
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📁 Evidence Library</h2>
        
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

      {/* Chain Visualizer Modal */}
      {showChainVisualizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto m-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Evidence Chain Visualization</h3>
              <button
                onClick={() => setShowChainVisualizer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <ChainVisualizer 
                caseId={selectedCaseId}
                onError={(error) => alert(error)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceLibrary;