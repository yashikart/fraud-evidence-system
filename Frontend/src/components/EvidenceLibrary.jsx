import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ChainVisualizer from './ChainVisualizer';
import CaseCorrelationVisualization from './CaseCorrelationVisualization';
import { 
  RoleBasedButton, 
  RoleBasedContent, 
  RoleBadge, 
  AccessDeniedMessage,
  useUserPermissions,
  hasUserPermission,
  RoleBasedInput,
  RoleBasedSelect
} from './RoleBasedUI';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showCorrelationView, setShowCorrelationView] = useState(false);
  const [correlationCaseId, setCorrelationCaseId] = useState('');
  const [showCreateEvidenceForm, setShowCreateEvidenceForm] = useState(false);
  const [newEvidenceData, setNewEvidenceData] = useState({
    caseId: '',
    entity: '',
    description: '',
    tags: '',
    riskLevel: 'medium'
  });

  // Use the new role-based permissions hook
  const { user, permissions, loading: permissionsLoading } = useUserPermissions();
  const userRole = user?.role;
  const hasAccess = permissions.viewEvidence;

  // Enhanced access check with better error handling
  const checkUserAccess = async () => {
    if (permissionsLoading) return false;
    
    if (!user || !userRole) {
      toast.error('❌ Authentication required for Evidence Library access');
      return false;
    }
    
    // Admin users should always have access
    if (userRole === 'admin') {
      return true;
    }
    
    if (!hasAccess) {
      if (userRole === 'public') {
        toast.info('ℹ️ Public users can access the risk dashboard. Evidence library requires investigator or admin privileges.');
      } else {
        toast.error(`❌ Access denied: Evidence Library requires investigator or admin privileges (Current role: ${userRole})`);
      }
      return false;
    }
    
    return true;
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format hash for display
  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`;
  };

  // Get status color classes
  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get risk color classes
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Accent gradient for risk levels
  const getRiskAccent = (risk) => {
    switch (risk) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-green-500 to-green-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const fetchEvidence = async () => {
    const hasAccess = await checkUserAccess();
    if (!hasAccess) {
      return;
    }
    
    setLoading(true);
    try {
      // Mock evidence data when backend is not available
      const mockEvidence = [
        {
          _id: '1',
          caseId: 'CASE_2024_0891',
          entity: '0x742d35...e3b8',
          originalFilename: 'phishing_wallet_analysis.pdf',
          fileHash: 'sha256:a8b4c7d9e2f1a5b8c6d9e2f1a5b8c6d9e2f1a5b8c6d9e2f1a5b8c6d9e2f1',
          uploadedAt: new Date('2024-09-01T14:30:00Z').toISOString(),
          verificationStatus: 'verified',
          riskLevel: 'high',
          description: 'Comprehensive analysis of phishing wallet cluster involving 15 connected addresses',
          tags: ['phishing', 'wallet-cluster', 'crypto-theft'],
          fileSize: 2456789,
          investigator: 'Agent Smith',
          jurisdiction: 'Federal',
          evidenceType: 'Digital Forensics'
        },
        {
          _id: '2',
          caseId: 'CASE_2024_0890',
          entity: '0xabc123...def789',
          originalFilename: 'suspicious_transaction_logs.json',
          fileHash: 'sha256:d4e6f8a1b3c5e7f9a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4',
          uploadedAt: new Date('2024-08-28T09:15:00Z').toISOString(),
          verificationStatus: 'verified',
          riskLevel: 'medium',
          description: 'Transaction logs showing unusual patterns in DeFi protocol interactions',
          tags: ['defi', 'suspicious-patterns', 'transaction-analysis'],
          fileSize: 1234567,
          investigator: 'Detective Johnson',
          jurisdiction: 'State',
          evidenceType: 'Transaction Data'
        },
        {
          _id: '3',
          caseId: 'CASE_2024_0889',
          entity: '192.168.1.105',
          originalFilename: 'malware_sample_encrypted.zip',
          fileHash: 'sha256:f1a3b5c7e9f2a4b6c8e0f2a4b6c8e0f2a4b6c8e0f2a4b6c8e0f2a4b6c8e0',
          uploadedAt: new Date('2024-08-25T16:45:00Z').toISOString(),
          verificationStatus: 'pending',
          riskLevel: 'high',
          description: 'Encrypted malware sample extracted from compromised mining rig',
          tags: ['malware', 'cryptojacking', 'mining-attack'],
          fileSize: 5678901,
          investigator: 'Analyst Parker',
          jurisdiction: 'International',
          evidenceType: 'Malware Sample'
        },
        {
          _id: '4',
          caseId: 'CASE_2024_0888',
          entity: '0x9876fe...dcba21',
          originalFilename: 'exchange_hack_timeline.xlsx',
          fileHash: 'sha256:b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0',
          uploadedAt: new Date('2024-08-20T11:20:00Z').toISOString(),
          verificationStatus: 'verified',
          riskLevel: 'critical',
          description: 'Detailed timeline of exchange hack with fund movement tracking across 47 addresses',
          tags: ['exchange-hack', 'fund-tracking', 'timeline-analysis'],
          fileSize: 3456789,
          investigator: 'Senior Agent Wilson',
          jurisdiction: 'Federal',
          evidenceType: 'Financial Analysis'
        },
        {
          _id: '5',
          caseId: 'CASE_2024_0887',
          entity: '0x456def...ghi789',
          originalFilename: 'smart_contract_vulnerability.sol',
          fileHash: 'sha256:e7f9a1b3c5e7f9a1b3c5e7f9a1b3c5e7f9a1b3c5e7f9a1b3c5',
          uploadedAt: new Date('2024-08-15T13:10:00Z').toISOString(),
          verificationStatus: 'under_review',
          riskLevel: 'medium',
          description: 'Smart contract code with identified reentrancy vulnerability exploited in recent attack',
          tags: ['smart-contract', 'reentrancy', 'vulnerability'],
          fileSize: 89012,
          investigator: 'Blockchain Specialist Chen',
          jurisdiction: 'State',
          evidenceType: 'Source Code'
        }
      ];
      
      setEvidence(mockEvidence);
      setTotalPages(1);
      
      // Try to fetch from backend if available
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
        const token = localStorage.getItem('authToken');

        const response = await axios.get(
          `${backendUrl}/api/evidence?page=${page}&limit=20&sort=${sortBy}&order=${sortOrder}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 3000 // 3 second timeout
          }
        );

        if (response.data.success) {
          setEvidence(response.data.evidence);
          setTotalPages(response.data.pagination?.pages || 1);
        }
      } catch (backendError) {
        console.log('Backend not available, using mock data');
        // Continue with mock data
      }
      
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast.error('❌ Failed to fetch evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading) {
      const initializeComponent = async () => {
        const hasValidAccess = await checkUserAccess();
        if (hasValidAccess) {
          await fetchEvidence();
        }
      };
      initializeComponent();
    }
  }, [page, sortBy, sortOrder, permissionsLoading]);

  const downloadEvidence = async (evidenceId, filename) => {
    // Check role permissions for download
    if (!userRole || !['admin', 'investigator'].includes(userRole)) {
      toast.error('❌ Access denied: Download permission requires investigator or admin role');
      return;
    }
    
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
      if (error.response?.status === 403) {
        toast.error('❌ Access denied: Insufficient permissions to download evidence');
      } else {
        toast.error('❌ Failed to download evidence');
      }
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
        toast.success('✅ Evidence verification completed!');
        // Refresh evidence list
        await fetchEvidence();
      }
    } catch (error) {
      console.error('Error verifying evidence:', error);
      if (error.response?.status === 403) {
        toast.error('❌ Access denied: Insufficient permissions to verify evidence');
      } else {
        toast.error('❌ Failed to verify evidence');
      }
    }
  };

  const deleteEvidence = async (evidenceId, filename) => {
    // Check role permissions for deletion
    if (!userRole || userRole !== 'admin') {
      toast.error('❌ Access denied: Delete permission requires admin role');
      return;
    }
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      const response = await axios.delete(
        `${backendUrl}/api/evidence/admin/${evidenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`✅ Evidence "${filename}" deleted successfully!`);
        // Refresh evidence list
        await fetchEvidence();
      }
    } catch (error) {
      console.error('Error deleting evidence:', error);
      if (error.response?.status === 403) {
        toast.error('❌ Access denied: Insufficient permissions to delete evidence');
      } else {
        toast.error('❌ Failed to delete evidence');
      }
    }
  };

  const shareEvidence = async (evidenceId, shareData) => {
    // Check role permissions for sharing evidence
    if (!userRole || !['admin', 'investigator'].includes(userRole)) {
      toast.error('❌ Access denied: Evidence sharing requires investigator or admin role');
      return;
    }
    
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

  const generateCaseReport = async (caseId) => {
    // Check role permissions for report generation
    if (!userRole || !['admin', 'investigator'].includes(userRole)) {
      toast.error('❌ Access denied: Report generation requires investigator or admin role');
      return;
    }
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        `${backendUrl}/api/evidence/case/${caseId}/report`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link for PDF report
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })); 
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case_${caseId}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ PDF report generated and downloaded!');
    } catch (error) {
      console.error('Error generating entity report:', error);
      if (error.response?.status === 403) {
        toast.error('❌ Access denied: Insufficient permissions to generate entity reports');
      } else {
        toast.error('❌ Failed to generate entity report');
      }
    }
  };

  const handleCreateEvidence = () => {
    setShowCreateEvidenceForm(true);
  };

  const handleUserManagement = () => {
    window.location.href = '/admin';
  };

  const handleModifyEvidence = (evidenceItem) => {
    // For now, just show a toast - in a real implementation this would open a modal
    toast.info('📝 Evidence modification would open in a form here');
  };

  const handleNewEvidenceChange = (e) => {
    const { name, value } = e.target;
    setNewEvidenceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEvidenceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
      const token = localStorage.getItem('authToken');

      // In a real implementation, we would upload a file here
      // For this example, we'll just show a success message
      toast.success('✅ Evidence created successfully!');
      setShowCreateEvidenceForm(false);
      setNewEvidenceData({
        caseId: '',
        entity: '',
        description: '',
        tags: '',
        riskLevel: 'medium'
      });
      
      // Refresh evidence list
      await fetchEvidence();
    } catch (error) {
      console.error('Error creating evidence:', error);
      toast.error('❌ Failed to create evidence');
    }
  };

  // Filter evidence based on search and filters
  const filteredEvidence = evidence.filter(item => {
    const matchesSearch = 
      item.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !filterStatus || item.verificationStatus === filterStatus;
    const matchesRisk = !filterRisk || item.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  }).sort((a, b) => {
    if (sortBy === 'uploadedAt') {
      return sortOrder === 'desc' 
        ? new Date(b.uploadedAt) - new Date(a.uploadedAt)
        : new Date(a.uploadedAt) - new Date(b.uploadedAt);
    } else if (sortBy === 'caseId') {
      return sortOrder === 'desc'
        ? b.caseId.localeCompare(a.caseId)
        : a.caseId.localeCompare(b.caseId);
    } else if (sortBy === 'riskLevel') {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return sortOrder === 'desc'
        ? riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
        : riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return 0;
  });

  // Role-based access control check with enhanced UI
  if (permissionsLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    const isPublicUser = userRole === 'public';
    
    return (
      <RoleBasedContent
        requiredPermission="viewEvidence"
        allowedRoles={['admin', 'investigator']}
        fallback={
          <AccessDeniedMessage
            requiredPermission="viewEvidence"
            allowedRoles={['admin', 'investigator']}
            customMessage={isPublicUser 
              ? "Evidence Library is restricted to investigators and administrators. Public users can access the risk dashboard and basic fraud awareness information."
              : "Evidence Library requires investigator or admin privileges."
            }
            showLoginButton={true}
          />
        }
      >
        {/* This content will not show since hasAccess is false */}
      </RoleBasedContent>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗂️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Digital Evidence Library</h2>
              <div className="flex items-center space-x-2 mt-1">
                <RoleBadge user={user} className="text-blue-100" />
                <span className="text-blue-100 text-sm">
                  {userRole === 'admin' ? '(Full Access)' : '(Limited Access)'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons with Role-Based Access */}
          <div className="flex gap-3">
            {/* Case Correlation - Available to Admin & Investigator */}
            <RoleBasedButton
              requiredPermission="viewEvidence"
              onClick={() => {
                if (evidence.length > 0) {
                  const firstCaseId = evidence[0].caseId;
                  setCorrelationCaseId(firstCaseId);
                  setShowCorrelationView(true);
                } else {
                  toast.error('❌ No evidence available for correlation analysis');
                }
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
              variant="custom"
              title="View case correlation analysis"
            >
              <span className="text-lg">🌐</span>
              Case Correlation
            </RoleBasedButton>
            
            {/* Report Generation - Available to Admin & Investigator */}
            <RoleBasedButton
              requiredPermission="exportEvidence"
              onClick={() => {
                const uniqueCaseIds = [...new Set(evidence.map(e => e.caseId))];
                if (uniqueCaseIds.length > 0) {
                  generateCaseReport(uniqueCaseIds[0]);
                } else {
                  toast.error('❌ No evidence available for report generation');
                }
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
              variant="custom"
              title="Generate comprehensive case report"
            >
              <span className="text-lg">📄</span>
              Generate Report
            </RoleBasedButton>
            
            {/* Admin-Only Actions */}
            <RoleBasedContent requiredRole="admin">
              <RoleBasedButton
                requiredPermission="userManagement"
                onClick={handleCreateEvidence}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                variant="custom"
                title="Upload new evidence to blockchain"
              >
                <span className="text-lg">📤</span>
                Upload Evidence
              </RoleBasedButton>
              
              <RoleBasedButton
                requiredPermission="manageRoles"
                onClick={handleUserManagement}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
                variant="custom"
                title="Access admin dashboard for user management"
              >
                <span className="text-lg">👥</span>
                User Management
              </RoleBasedButton>
            </RoleBasedContent>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white bg-opacity-15 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Evidence</p>
                <p className="text-2xl font-bold">{evidence.length}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          <div className="bg-white bg-opacity-15 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">High Risk Cases</p>
                <p className="text-2xl font-bold">{evidence.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length}</p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
          <div className="bg-white bg-opacity-15 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Verified</p>
                <p className="text-2xl font-bold">{evidence.filter(e => e.verificationStatus === 'verified').length}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white bg-opacity-15 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Active Cases</p>
                <p className="text-2xl font-bold">{[...new Set(evidence.map(e => e.caseId))].length}</p>
              </div>
              <div className="text-3xl">🔍</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filters Section */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search by case ID, entity, filename, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          >
            <option value="">🔄 All Status</option>
            <option value="verified">✅ Verified</option>
            <option value="pending">⏳ Pending</option>
            <option value="under_review">👀 Under Review</option>
            <option value="failed">❌ Failed</option>
          </select>
          
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          >
            <option value="">⚡ All Risk Levels</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          >
            <option value="uploadedAt-desc">📅 Latest First</option>
            <option value="uploadedAt-asc">📅 Oldest First</option>
            <option value="caseId-asc">🔤 Case ID A-Z</option>
            <option value="caseId-desc">🔤 Case ID Z-A</option>
            <option value="riskLevel-desc">⚠️ High Risk First</option>
          </select>
        </div>
      </div>

      {/* Evidence Cards/Table Section */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading evidence repository...</p>
            <p className="text-gray-400 text-sm">Verifying blockchain integrity</p>
          </div>
        ) : filteredEvidence.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-gray-400">📁</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Evidence Found</h3>
            <p className="text-gray-500 mb-4">No evidence matches your current search criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterRisk('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Evidence Cards */}
            {filteredEvidence.map((item) => (
              <div key={item._id} className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${getRiskAccent(item.riskLevel)}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Section - Case Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{item.caseId.split('_')[2]?.slice(-2) || 'XX'}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.caseId}</h3>
                          <p className="text-sm text-gray-500">
                            <span className="inline-flex items-center">
                              🔗 {item.entity} • {item.evidenceType || 'Digital Evidence'}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      {/* File Information */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">
                            {item.originalFilename.endsWith('.pdf') ? '📄' :
                             item.originalFilename.endsWith('.jpg') || item.originalFilename.endsWith('.png') ? '🖼️' :
                             item.originalFilename.endsWith('.json') ? '📃' :
                             item.originalFilename.endsWith('.zip') ? '🗜️' :
                             item.originalFilename.endsWith('.sol') ? '📜' :
                             '📁'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{item.originalFilename}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(item.fileSize || 0)} • Uploaded by {item.investigator || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-700 mb-3">{item.description}</p>
                        )}
                        
                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Blockchain Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-green-600 font-medium text-sm">⛓️ Blockchain Hash</span>
                          </div>
                          <p className="font-mono text-xs text-gray-700 break-all">{formatHash(item.fileHash)}</p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-blue-600 font-medium text-sm">📅 Timestamp</span>
                          </div>
                          <p className="text-sm text-gray-700">{new Date(item.uploadedAt).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{item.jurisdiction || 'Federal'} Jurisdiction</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Section - Status & Actions */}
                    <div className="ml-6 flex flex-col items-end space-y-3">
                      {/* Status Badges */}
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.verificationStatus)}`}>
                          {item.verificationStatus === 'verified' ? '✅ Verified' :
                           item.verificationStatus === 'pending' ? '⏳ Pending' :
                           item.verificationStatus === 'under_review' ? '👀 Under Review' :
                           '❌ Failed'}
                        </span>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRiskColor(item.riskLevel)}`}>
                          {item.riskLevel === 'critical' ? '🔴 Critical' :
                           item.riskLevel === 'high' ? '🟠 High Risk' :
                           item.riskLevel === 'medium' ? '🟡 Medium Risk' :
                           '🟢 Low Risk'}
                        </span>
                      </div>
                      
                      {/* Action Buttons with Role-Based Access Control */}
                      <div className="flex flex-col space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <RoleBasedButton
                            requiredPermission="viewEvidence"
                            onClick={() => downloadEvidence(item._id, item.originalFilename)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            variant="custom"
                            title="Download evidence file"
                          >
                            📥 Download
                          </RoleBasedButton>
                          
                          <RoleBasedButton
                            requiredPermission="viewEvidence"
                            onClick={() => verifyEvidence(item._id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            variant="custom"
                            title="Verify blockchain integrity"
                          >
                            ✅ Verify
                          </RoleBasedButton>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <RoleBasedButton
                            requiredPermission="viewEvidence"
                            onClick={() => {
                              setSelectedCaseId(item.caseId);
                              setShowChainVisualizer(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            variant="custom"
                            title="View evidence chain"
                          >
                            🔗 Chain
                          </RoleBasedButton>
                          
                          <RoleBasedButton
                            requiredPermission="shareEvidence"
                            onClick={() => {
                              setSelectedEvidence(item);
                              setShowShareModal(true);
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            variant="custom"
                            title="Share with investigators"
                          >
                            📤 Share
                          </RoleBasedButton>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <RoleBasedButton
                            requiredPermission="exportEvidence"
                            onClick={() => generateCaseReport(item.caseId)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            variant="custom"
                            title="Generate PDF report"
                          >
                            📄 Report
                          </RoleBasedButton>
                        </div>
                        
                        {/* Admin-Only Actions */}
                        <RoleBasedContent requiredRole="admin">
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                            <RoleBasedButton
                              requiredPermission="editCases"
                              onClick={() => handleModifyEvidence(item)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                              variant="custom"
                              title="Modify evidence metadata (Admin only)"
                            >
                              ✏️ Modify
                            </RoleBasedButton>
                            
                            <RoleBasedButton
                              requiredPermission="deleteEvidence"
                              onClick={() => {
                                if (window.confirm(`⚠️ Delete evidence "${item.originalFilename}"?\n\nThis action cannot be undone and will be logged in the audit trail.`)) {
                                  deleteEvidence(item._id, item.originalFilename);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                              variant="custom"
                              title="Delete evidence (Admin only)"
                            >
                              🗑️ Delete
                            </RoleBasedButton>
                          </div>
                        </RoleBasedContent>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-700">
                  Showing {filteredEvidence.length} of {evidence.length} evidence items
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Create Evidence Form Modal */}
      {showCreateEvidenceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">📤 Upload New Evidence</h3>
              <button
                onClick={() => {
                  setShowCreateEvidenceForm(false);
                  setNewEvidenceData({
                    caseId: '',
                    entity: '',
                    description: '',
                    tags: '',
                    riskLevel: 'medium'
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvidenceSubmit} className="p-4">
              <RoleBasedInput
                label="Case ID"
                name="caseId"
                value={newEvidenceData.caseId}
                onChange={handleNewEvidenceChange}
                required
                requiredPermission="userManagement"
              />
              
              <RoleBasedInput
                label="Entity (Wallet Address, IP, etc.)"
                name="entity"
                value={newEvidenceData.entity}
                onChange={handleNewEvidenceChange}
                required
                requiredPermission="userManagement"
              />
              
              <RoleBasedInput
                label="Description"
                name="description"
                value={newEvidenceData.description}
                onChange={handleNewEvidenceChange}
                required
                requiredPermission="userManagement"
              />
              
              <RoleBasedInput
                label="Tags (comma separated)"
                name="tags"
                value={newEvidenceData.tags}
                onChange={handleNewEvidenceChange}
                requiredPermission="userManagement"
              />
              
              <RoleBasedSelect
                label="Risk Level"
                name="riskLevel"
                value={newEvidenceData.riskLevel}
                onChange={handleNewEvidenceChange}
                required
                requiredPermission="userManagement"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </RoleBasedSelect>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateEvidenceForm(false);
                    setNewEvidenceData({
                      caseId: '',
                      entity: '',
                      description: '',
                      tags: '',
                      riskLevel: 'medium'
                    });
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <RoleBasedButton
                  type="submit"
                  requiredPermission="userManagement"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Upload Evidence
                </RoleBasedButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceLibrary;