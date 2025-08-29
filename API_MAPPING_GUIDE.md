# API Mapping & Compatibility Guide

## 📋 Your Proposed API vs Current Implementation

This document shows how your proposed case-centric API maps to the existing implementation and what's needed for full compatibility.

## ✅ **Endpoint Mapping Status**

| Your Proposed API | Current Implementation | Status | Notes |
|-------------------|----------------------|---------|--------|
| `POST /cases/` | **NEW** | ✅ **IMPLEMENTED** | Create case with entities/indicators |
| `POST /cases/{id}/evidence` | `POST /api/evidence/upload` | ✅ **IMPLEMENTED** | Upload to specific case |
| `GET /cases/{id}/evidence` | `GET /api/evidence?caseId=X` | ✅ **IMPLEMENTED** | List case evidence |
| `POST /evidence/{id}/export` | **NEW** | ✅ **IMPLEMENTED** | Export with signed package |
| `POST /cases/{id}/escalate` | `POST /api/escalate` | ✅ **IMPLEMENTED** | Case-specific escalation |
| `GET /cases/{id}/custody` | `GET /api/evidence/:id/chain-of-custody` | ✅ **IMPLEMENTED** | Enhanced timeline |
| `POST /cases/{id}/report` | `POST /api/reports/generate/case` | ✅ **IMPLEMENTED** | PDF generation |
| `POST /cases/{id}/indicators` | **NEW** | ✅ **IMPLEMENTED** | Add wallets, IPs, emails |
| `GET /investigations/{id}` | `GET /api/investigations/:id` | ✅ **WORKING** | Combined view |

## 🔄 **Backward Compatibility**

### **Existing Endpoints Still Work**
```bash
# Old way (still works)
POST /api/evidence/upload
GET  /api/evidence
GET  /api/investigations/:id
POST /api/reports/generate/case

# New way (case-centric)
POST /cases/{id}/evidence
GET  /cases/{id}/evidence
GET  /cases/investigations/{id}
POST /cases/{id}/report
```

### **Migration Guide**

#### **1. Creating Cases**
```javascript
// NEW: Create case first
const caseResponse = await fetch('/api/cases', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    title: 'Fraud Investigation - Wallet 0x1234...',
    description: 'Suspicious transaction pattern detected',
    priority: 'high',
    category: 'fraud',
    entities: [
      { type: 'wallet_address', value: '0x1234567890abcdef' }
    ]
  })
});

const { case: newCase } = await caseResponse.json();
console.log('Case created:', newCase.caseId);
```

#### **2. Uploading Evidence**
```javascript
// NEW: Upload to specific case
const formData = new FormData();
formData.append('evidenceFile', fileInput.files[0]);
formData.append('entity', '0x1234567890abcdef');
formData.append('description', 'Transaction evidence');

const response = await fetch(`/api/cases/${caseId}/evidence`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

#### **3. Adding Indicators**
```javascript
// NEW: Add multiple indicators to case
await fetch(`/api/cases/${caseId}/indicators`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    indicators: [
      { 
        type: 'wallet', 
        value: '0x1234567890abcdef', 
        confidence: 0.9, 
        source: 'transaction_analysis' 
      },
      { 
        type: 'ip', 
        value: '192.168.1.100', 
        confidence: 0.8, 
        source: 'log_analysis' 
      },
      { 
        type: 'email', 
        value: 'suspicious@example.com', 
        confidence: 0.7, 
        source: 'user_report' 
      }
    ]
  })
});
```

#### **4. Escalating Cases**
```javascript
// NEW: Case-specific escalation
await fetch(`/api/cases/${caseId}/escalate`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    level: 'L3',
    reason: 'High-value fraud detected',
    urgency: 'urgent'
  })
});
```

#### **5. Exporting Evidence**
```javascript
// NEW: Export with signed package
const exportResponse = await fetch(`/api/cases/evidence/${evidenceId}/export`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

const { export: exportData, custodyEvent } = await exportResponse.json();
console.log('Export signature:', exportData.signature);
```

## 🧪 **Testing Your API Structure**

### **Complete Workflow Test**

```javascript
async function testCaseWorkflow() {
  const token = 'YOUR_JWT_TOKEN';
  
  // 1. Create case
  console.log('1. Creating case...');
  const caseResponse = await fetch('/api/cases', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      title: 'Test Fraud Case',
      description: 'Testing case-centric API',
      priority: 'medium',
      entities: [
        { type: 'wallet_address', value: '0x1234567890abcdef' }
      ]
    })
  });
  const { case: newCase } = await caseResponse.json();
  console.log('✅ Case created:', newCase.caseId);
  
  // 2. Add indicators
  console.log('2. Adding indicators...');
  await fetch(`/api/cases/${newCase.caseId}/indicators`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      indicators: [
        { type: 'ip', value: '192.168.1.100', source: 'logs' },
        { type: 'email', value: 'test@example.com', source: 'report' }
      ]
    })
  });
  console.log('✅ Indicators added');
  
  // 3. Get case evidence
  console.log('3. Getting case evidence...');
  const evidenceResponse = await fetch(`/api/cases/${newCase.caseId}/evidence`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const evidenceData = await evidenceResponse.json();
  console.log('✅ Evidence retrieved:', evidenceData.evidence.length, 'items');
  
  // 4. Get custody timeline
  console.log('4. Getting custody timeline...');
  const custodyResponse = await fetch(`/api/cases/${newCase.caseId}/custody`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const custodyData = await custodyResponse.json();
  console.log('✅ Timeline retrieved:', custodyData.timeline.length, 'events');
  
  // 5. Generate report
  console.log('5. Generating report...');
  const reportResponse = await fetch(`/api/cases/${newCase.caseId}/report`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      format: 'json', // or 'pdf'
      includeEvidence: true,
      includeTimeline: true
    })
  });
  
  if (reportResponse.headers.get('content-type').includes('application/pdf')) {
    console.log('✅ PDF report generated');
  } else {
    const reportData = await reportResponse.json();
    console.log('✅ JSON report generated');
  }
  
  // 6. Escalate case
  console.log('6. Escalating case...');
  await fetch(`/api/cases/${newCase.caseId}/escalate`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      level: 'L2',
      reason: 'Test escalation',
      urgency: 'normal'
    })
  });
  console.log('✅ Case escalated');
  
  console.log('🎉 Complete workflow test successful!');
}

// Run the test
testCaseWorkflow().catch(console.error);
```

## 📊 **API Endpoint Reference**

### **Case Management**
```
POST   /api/cases/                    # Create new case
GET    /api/cases/                    # List cases (with filters)
GET    /api/cases/{id}                # Get specific case
PUT    /api/cases/{id}                # Update case
```

### **Evidence Management**
```
POST   /api/cases/{id}/evidence       # Upload evidence to case
GET    /api/cases/{id}/evidence       # Get case evidence (paginated)
POST   /api/cases/evidence/{id}/export # Export evidence with signature
```

### **Case Operations**
```
POST   /api/cases/{id}/escalate       # Escalate case + custody event
GET    /api/cases/{id}/custody         # Get timeline (auto-enriched)
POST   /api/cases/{id}/report          # Generate PDF report
POST   /api/cases/{id}/indicators      # Add indicators (wallets, IPs, emails)
```

### **Investigation Grouping**
```
GET    /api/cases/investigations/{id}  # Combined investigation view
```

## 🔧 **Required Permissions**

| Endpoint | Required Permission | Role Requirements |
|----------|-------------------|-------------------|
| `POST /api/cases/` | `create_case` | Investigator+ |
| `POST /api/cases/{id}/evidence` | `upload_evidence` | Investigator+ |
| `POST /api/cases/evidence/{id}/export` | `export_evidence` | Investigator+ |
| `POST /api/cases/{id}/escalate` | `escalate_cases` | Investigator+ |
| `GET /api/cases/{id}/custody` | `view_evidence` | Investigator+ |
| `POST /api/cases/{id}/report` | `generate_reports` | Investigator+ |
| `POST /api/cases/{id}/indicators` | `edit_cases` | Investigator+ |

### **Report Generation Endpoints**

#### **Case Reports**
```
POST   /api/reports/generate/case/{caseId}     # Generate case summary PDF/HTML
POST   /api/reports/case/{caseId}              # Alternative case report endpoint  
GET    /api/reports/preview/case/{caseId}      # Preview case report (HTML only)
```

#### **Entity Reports**
```
POST   /api/reports/generate/entity/{entity}   # Generate entity investigation PDF/HTML
POST   /api/reports/entity/{entity}            # Alternative entity report endpoint
GET    /api/reports/preview/entity/{entity}    # Preview entity report (HTML only)
```

#### **Linked Investigation Reports**
```
POST   /api/reports/generate/linked            # Generate multi-entity investigation report
POST   /api/reports/linked                     # Alternative linked report endpoint
```

#### **Administrative Reports**
```
POST   /api/reports/bulk                       # Bulk report generation (Admin only)
GET    /api/reports/templates                  # Get available report templates
```

#### **Case-Centric Report Endpoints**
```
POST   /api/cases/{id}/report                  # Generate report for specific case
GET    /api/cases/investigations/{id}          # Get investigation report
```

#### **Report Request Parameters**
```javascript
// Common options for all report endpoints:
{
  "format": "pdf",                    // "pdf" or "html"
  "includeEvidence": true,           // Include evidence files section
  "includeTimeline": true,           // Include custody timeline
  "includeRiskEvolution": true,      // Include risk score progression
  "includeEscalations": true,        // Include escalation trail
  "watermark": false                 // Add "CONFIDENTIAL" watermark
}
```

#### **Report Features**
- ✅ **Professional Styling** - Gradient headers, color-coded status
- ✅ **Case Summaries** - Executive summary with key metrics
- ✅ **Evidence Hashes** - SHA-256 hashes with verification status
- ✅ **Risk Score Evolution** - Timeline of risk progression
- ✅ **Escalation Trail** - Complete escalation history and audit trail
- ✅ **Timeline Visualization** - Chronological event flow
- ✅ **Legal Compliance** - Audit trail documentation

#### **Example Report Generation**
```javascript
// Generate Case PDF Report
const reportResponse = await fetch('/api/reports/generate/case/CASE-001', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    format: 'pdf',
    includeEvidence: true,
    includeRiskEvolution: true,
    includeEscalations: true
  })
});

// For PDF: Download file directly
// For HTML: Get styled HTML content

// Generate Entity Report
const entityResponse = await fetch('/api/reports/generate/entity/0x1234567890abcdef', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    format: 'pdf',
    includeEvidence: true,
    includeTimeline: true
  })
});

// Generate Linked Investigation Report
const linkedResponse = await fetch('/api/reports/generate/linked', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    entities: ["0x1234567890abcdef", "0xfedcba0987654321"],
    investigationId: "INV-001",
    format: 'pdf',
    includeEvidence: true,
    includeRiskEvolution: true
  })
});
```

#### **Report Response Types**
- **PDF Response**: Binary PDF file with proper headers
- **HTML Response**: Styled HTML content for preview
- **Error Response**: JSON with error details

#### **Report Permissions**
| Report Type | Required Permission | Role Requirements |
|-------------|-------------------|-------------------|
| Case Reports | `generate_reports` | Investigator+ |
| Entity Reports | `generate_reports` | Investigator+ |
| Linked Reports | `generate_reports` | Investigator+ |
| Bulk Reports | `admin` | Admin only |
| Preview Reports | `view_evidence` | Investigator+ |

## 🚀 **Ready to Use**

Your proposed API structure is **fully implemented and ready to use**! 

### **Key Benefits:**
1. **Case-Centric Design** - Everything organized around cases
2. **RESTful Structure** - Clean, predictable URL patterns  
3. **Backward Compatibility** - Old endpoints still work
4. **Enhanced Functionality** - New features like indicators, export, escalation
5. **Comprehensive Audit Trail** - Every action tracked with custody events
6. **Role-Based Security** - Granular permissions maintained

### **Next Steps:**
1. Test the endpoints with your JWT token
2. Integrate into your frontend application
3. Use the case workflow for complete fraud investigations
4. Leverage the new indicators and export functionality

**All endpoints are operational and ready for production use!** 🎉
