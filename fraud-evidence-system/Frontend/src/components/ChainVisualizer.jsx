import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChainVisualizer = ({ caseId, onError }) => {
  const [trail, setTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  const fetchEvidenceTrail = async () => {
    if (!caseId) return;

    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        `${backendUrl}/api/evidence/trail/${caseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setTrail(response.data.trail);
      } else {
        onError?.('Failed to fetch evidence trail');
      }
    } catch (error) {
      console.error('Error fetching evidence trail:', error);
      onError?.('Error fetching evidence trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceTrail();
  }, [caseId]);

  const getStepIcon = (type) => {
    switch (type) {
      case 'Evidence Upload':
        return '📎';
      case 'Flagged':
        return '🚩';
      case 'Risk Analysis':
        return '⚠️';
      case 'Action Triggered':
        return '⚡';
      default:
        return '📝';
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'failed':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatHash = (hash) => {
    return hash ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading evidence trail...</span>
      </div>
    );
  }

  if (!trail.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        <div className="text-4xl mb-2">🔗</div>
        <p>No evidence trail found for this case.</p>
        {caseId && (
          <button
            onClick={fetchEvidenceTrail}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          🔗 Evidence Chain - {caseId}
        </h3>
        <button
          onClick={fetchEvidenceTrail}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Refresh
        </button>
      </div>

      {/* Chain Visualization */}
      <div className="relative">
        {/* Connecting Line */}
        {trail.length > 1 && (
          <div 
            className="absolute left-6 top-8 w-0.5 bg-gradient-to-b from-blue-300 to-green-300" 
            style={{ height: `${(trail.length - 1) * 120}px` }}
          />
        )}

        {/* Chain Steps */}
        <div className="space-y-8">
          {trail.map((step, index) => (
            <div
              key={index}
              className="relative flex items-start"
            >
              {/* Step Number and Icon */}
              <div className={`
                relative z-10 flex items-center justify-center w-12 h-12 rounded-full 
                border-2 font-semibold text-sm
                ${getStepColor(step.status)}
                ${selectedStep === index ? 'ring-2 ring-blue-400' : ''}
              `}>
                <span className="text-lg">{getStepIcon(step.type)}</span>
              </div>

              {/* Step Content */}
              <div 
                className={`
                  ml-4 flex-1 p-4 rounded-lg border cursor-pointer transition-all
                  ${selectedStep === index 
                    ? 'border-blue-400 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedStep(selectedStep === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">
                    Step {step.step}: {step.type}
                  </h4>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${step.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  `}>
                    {step.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>

                <div className="mt-2 text-xs text-gray-500">
                  {formatTimestamp(step.timestamp)}
                </div>

                {/* Detailed Information (Expandable) */}
                {selectedStep === index && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {step.hash && (
                      <div className="flex justify-between">
                        <span className="font-medium">Evidence Hash:</span>
                        <span className="font-mono text-sm">{formatHash(step.hash)}</span>
                      </div>
                    )}
                    {step.txHash && (
                      <div className="flex justify-between">
                        <span className="font-medium">Transaction:</span>
                        <span className="font-mono text-sm">{formatHash(step.txHash)}</span>
                      </div>
                    )}
                    {step.blockNumber && (
                      <div className="flex justify-between">
                        <span className="font-medium">Block Number:</span>
                        <span className="font-mono text-sm">#{step.blockNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chain Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Chain Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Steps:</span>
            <div className="font-semibold">{trail.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <div className="font-semibold">
              {trail.every(step => step.status === 'confirmed') ? 
                <span className="text-green-600">✅ Verified</span> :
                <span className="text-yellow-600">⏳ Processing</span>
              }
            </div>
          </div>
          <div>
            <span className="text-gray-600">First Evidence:</span>
            <div className="font-semibold">
              {trail.length > 0 ? formatTimestamp(trail[0].timestamp) : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Latest Update:</span>
            <div className="font-semibold">
              {trail.length > 0 ? formatTimestamp(trail[trail.length - 1].timestamp) : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChainVisualizer;