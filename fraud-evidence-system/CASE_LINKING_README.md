# Case Linking System

This system allows grouping multiple wallets, IP addresses, and other entities under a single investigation ID when they are related to the same fraudulent activity or entity.

## How It Works

### 1. Entity Linking
When you link multiple entities (wallets, IPs, domains, etc.) through the admin interface, the system:
- Creates a new investigation with a unique ID
- Groups all provided entities under this investigation
- Automatically analyzes connections between entities

### 2. Automatic Investigation Grouping
The system intelligently groups related entities under existing investigations when:
- Any of the entities are already part of an active investigation
- IP addresses are geographically close to each other (within 200km)
- Wallet addresses have interacted in transaction evidence
- Entities show similar behavioral patterns

### 3. Connection Analysis
The system automatically detects several types of connections between entities:

#### Evidence Links
Direct connections found through shared evidence records.

#### Temporal Correlations
Entities that were active within a short time window of each other.

#### Geographic Proximity
IP addresses that are physically close to each other (within 100km).

#### Behavioral Similarity
Wallet addresses that show similar transaction patterns:
- Similar transaction values
- Similar transaction frequencies
- Similar timing patterns

## Using the Investigations Feature

### Linking New Entities
1. Navigate to the Admin Dashboard
2. Click "Link Entities" in the Investigations section
3. Add multiple entities (wallets, IPs, domains, etc.)
4. Provide a title and description for the investigation
5. Click "Group Under Investigation"

### Viewing Investigations
All active investigations are displayed with:
- Investigation ID
- Linked entities
- Detected connections between entities
- Risk assessment score
- Status and priority

### Analyzing Connections
You can manually trigger connection analysis for any investigation by clicking the "Analyze" button.

## API Endpoints

### Get All Investigations
```
GET /api/investigations
```

### Link Entities
```
POST /api/investigations/link
```
Body:
```json
{
  "entities": [
    {
      "type": "wallet_address",
      "value": "0x123..."
    },
    {
      "type": "ip_address", 
      "value": "192.168.1.1"
    }
  ],
  "metadata": {
    "title": "Suspicious Activity Investigation",
    "description": "Multiple wallets linked to same IP",
    "priority": "high"
  }
}
```

### Analyze Connections
```
POST /api/investigations/:id/analyze
```

### Get Investigation Details
```
GET /api/investigations/:id
```

## Benefits

1. **Centralized Tracking**: All related entities are grouped under one investigation ID
2. **Automated Detection**: System automatically finds connections between entities
3. **Risk Assessment**: Each investigation gets a risk score based on connections
4. **Evidence Correlation**: Related evidence is automatically linked
5. **Timeline View**: Events are organized chronologically for easier analysis