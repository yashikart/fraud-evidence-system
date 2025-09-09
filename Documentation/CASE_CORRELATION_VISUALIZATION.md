# Case Correlation Visualization

## Overview

The Case Correlation Visualization feature provides investigators with an interactive graph-based view of how cases are connected through linked wallets, IP addresses, domains, and evidence items. This visualization helps investigators quickly identify patterns and relationships that might not be immediately apparent in tabular data.

## Features

### 1. Interactive Graph Visualization
- **Node-based representation** of cases, entities, and evidence
- **Color-coded nodes** based on entity type and risk level
- **Connection edges** showing relationships between entities
- **Interactive controls** for zooming, panning, and exploring

### 2. Entity Types
- 📁 **Cases** - Investigation cases with risk scores
- 💼 **Wallet Addresses** - Blockchain wallet addresses
- 🌐 **IP Addresses** - Network IP addresses with geolocation
- 🔗 **Domains** - Web domains and URLs
- 📧 **Email Addresses** - Email accounts
- 📱 **Phone Numbers** - Mobile phone numbers
- 📱 **Device IDs** - Unique device identifiers
- 🔗 **Transaction Hashes** - Blockchain transaction identifiers
- 📎 **Evidence Files** - Uploaded evidence with risk levels

### 3. Connection Types
- 🔗 **Direct Links** - Explicit connections between entities
- 🕐 **Temporal Correlations** - Entities active within time windows
- 📍 **Geographic Proximity** - IP addresses within geographic distance
- 🧠 **Behavioral Similarity** - Similar usage patterns
- 📎 **Evidence Links** - Shared evidence files

### 4. Risk Visualization
- **Color-coded evidence** based on risk levels (High: Red, Medium: Amber, Low: Green)
- **Connection strength** indicated by edge thickness
- **Animated edges** for strong connections

## Implementation Details

### Frontend Components

#### CaseCorrelationVisualization.jsx
The main visualization component using ReactFlow for graph rendering:

```jsx
// Key features:
- ReactFlow integration for interactive graph visualization
- Dynamic node positioning based on entity relationships
- Color-coded nodes and edges for quick pattern recognition
- Real-time data fetching from backend API
- Responsive design for different screen sizes
```

#### EvidenceLibrary.jsx Integration
The Evidence Library component now includes:
- Case Correlation button in the header
- Individual correlation buttons for each evidence item
- Modal overlay for full-screen visualization

### Backend Endpoints

#### New Endpoint
```
GET /api/investigations/:id/correlation-data
```

**Response Structure:**
```json
{
  "_id": "investigation_id",
  "investigationId": "INV-20240101-ABC123",
  "title": "Suspicious Activity Investigation",
  "entities": [
    {
      "type": "wallet_address",
      "value": "0x1234...",
      "verified": true
    }
  ],
  "connections": [
    {
      "type": "temporal_correlation",
      "entity1": { "type": "wallet_address", "value": "0x1234..." },
      "entity2": { "type": "ip_address", "value": "192.168.1.1" },
      "strength": 0.85,
      "description": "Entities active within 30 minutes of each other"
    }
  ],
  "relatedEvidenceDetails": [
    {
      "filename": "suspicious_transaction.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "riskLevel": "high",
      "uploadedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "riskAssessment": {
    "overallRisk": 0.75,
    "riskFactors": ["5 entities involved", "Strong connections detected"]
  }
}
```

## Usage

### 1. Accessing the Visualization

#### From Evidence Library Header
1. Navigate to the Evidence Library
2. Click the "🌐 Case Correlation" button in the header
3. The visualization will load for the first case in the library

#### From Individual Evidence Items
1. Find an evidence item in the table
2. Click the "🌐 Correlation" button in the Actions column
3. The visualization will load for that specific case

### 2. Interacting with the Graph

#### Navigation Controls
- **Zoom**: Use mouse wheel or zoom controls
- **Pan**: Click and drag the background
- **Node Selection**: Click on nodes to see details
- **Fit View**: Automatically adjust view to show all nodes

#### Node Information
- Hover over nodes to see basic information
- Click nodes to see detailed information in tooltips
- Different node types have different visual representations

#### Edge Information
- Connection strength indicated by line thickness
- Strong connections (strength > 0.7) are animated
- Hover over edges to see connection type and description

### 3. Legend and Key

The visualization includes a comprehensive legend:
- **Purple**: Cases
- **Green**: Wallet addresses
- **Blue**: IP addresses
- **Purple**: Domains
- **Pink**: Email addresses
- **Red**: High-risk evidence
- **Amber**: Medium-risk evidence
- **Green**: Low-risk evidence

## Technical Architecture

### Dependencies
- **ReactFlow** - Graph visualization library
- **Axios** - HTTP client for API requests
- **React Toastify** - User notifications

### Data Flow
1. User requests correlation visualization
2. Frontend fetches data from `/api/investigations/:id/correlation-data`
3. Backend aggregates investigation data with related evidence
4. Frontend transforms data into graph nodes and edges
5. ReactFlow renders the interactive visualization

### Performance Considerations
- **Pagination** for large datasets
- **Selective data loading** to avoid overwhelming the UI
- **Efficient node positioning** algorithms
- **Memory management** for large graphs

## Security

### Access Control
- Only investigators, admins, and superadmins can access
- JWT authentication required
- Role-based permissions enforced
- Audit logging for all access attempts

### Data Protection
- Sensitive data is filtered based on user permissions
- Evidence files are not directly accessible through visualization
- Connection data is anonymized where appropriate

## Testing

### Unit Tests
```javascript
// Test node generation
test('generates correct node types', () => {
  const nodes = generateGraphNodes(investigationData);
  expect(nodes[0].type).toBe('case');
  expect(nodes[1].type).toBe('entity');
});

// Test edge generation
test('creates connection edges', () => {
  const edges = generateGraphEdges(connections);
  expect(edges.length).toBe(connections.length);
});
```

### Integration Tests
```javascript
// Test API endpoint
test('correlation data endpoint returns enriched data', async () => {
  const response = await axios.get('/api/investigations/123/correlation-data');
  expect(response.data.relatedEvidenceDetails).toBeDefined();
});
```

## Future Enhancements

### 1. Advanced Analytics
- Machine learning-based connection prediction
- Anomaly detection in connection patterns
- Trend analysis over time

### 2. Enhanced Visualization
- 3D graph rendering options
- Timeline-based filtering
- Custom layout algorithms

### 3. Export Capabilities
- Image export of visualizations
- PDF reports with graphs
- Data export for external analysis

### 4. Collaboration Features
- Shared annotations on graphs
- Real-time collaboration
- Commenting on specific nodes/connections

## Troubleshooting

### Common Issues

#### Empty Graph
- **Cause**: No correlation data available
- **Solution**: Ensure investigation has entities and connections

#### Performance Issues
- **Cause**: Too many nodes/edges
- **Solution**: Implement pagination or filtering

#### Missing Data
- **Cause**: Insufficient permissions
- **Solution**: Verify user role and permissions

### Error Messages
- "Failed to fetch case correlations" - Backend API error
- "Investigation not found" - Invalid investigation ID
- "Access denied" - Insufficient permissions

## Best Practices

### For Investigators
1. **Start with high-risk cases** to identify the most critical connections
2. **Use filtering** to focus on specific entity types
3. **Look for clusters** of highly connected entities
4. **Pay attention to strong connections** (thick, animated edges)
5. **Cross-reference** with evidence files for verification

### For Administrators
1. **Monitor usage** of correlation features
2. **Ensure proper permissions** are set for users
3. **Review performance** of visualization endpoints
4. **Provide training** on interpreting correlation graphs

## API Documentation

### GET /api/investigations/:id/correlation-data

**Description**: Fetch detailed correlation data for visualization

**Parameters**:
- `id` (path) - Investigation ID

**Headers**:
- `Authorization: Bearer <token>`

**Response**:
- `200 OK` - Success with correlation data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Investigation not found
- `500 Internal Server Error` - Server error

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5050/api/investigations/123/correlation-data
```

**Example Response**:
```json
{
  "_id": "123",
  "investigationId": "INV-20240101-ABC123",
  "title": "Suspicious Activity Investigation",
  "entities": [...],
  "connections": [...],
  "relatedEvidenceDetails": [...],
  "riskAssessment": {...}
}
```