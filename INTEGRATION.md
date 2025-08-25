# 🔗 Frontend-Backend Integration Guide

## 📋 Overview
This guide explains how the React frontend integrates with the Node.js/Express backend for the Fraud Dashboard application.

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   React Frontend│ ◄─────────────────► │ Express Backend │
│   (Port 3000)   │                     │   (Port 5050)   │
└─────────────────┘                     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   MongoDB       │
                                        │   (Port 27017)  │
                                        └─────────────────┘
```

## 🚀 Quick Start

### Development Mode
```bash
# Start all services
./start-dev.sh

# Or manually:
# 1. Start MongoDB
mongod

# 2. Start Backend
cd Backend && npm start

# 3. Start Frontend
cd Frontend && npm start
```

### Docker Mode
```bash
# Start full stack with Docker
docker-compose -f docker-compose.fullstack.yml up
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5050
REACT_APP_BACKEND_URL=http://localhost:5050
REACT_APP_AUTH_TOKEN=demo-token
```

**Backend (.env)**
```env
PORT=5050
MONGO_URI=mongodb://localhost:27017/fraudDB
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## 📡 API Integration

### Authentication
All API requests include Bearer token authentication:
```javascript
headers: {
  'Authorization': 'Bearer demo-token'
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/test` | GET | Connection test |
| `/api/reports` | GET/POST | Fraud reports |
| `/api/risk/:wallet` | GET | Wallet risk assessment |
| `/api/flag` | POST | Flag wallet on blockchain |
| `/api/events` | GET | Event queue |

### Frontend API Usage
```javascript
import { reportsApi, riskApi } from '../api/fraudApi';

// Get reports
const reports = await reportsApi.getReports({ limit: 10 });

// Submit report
const result = await reportsApi.submitReport({
  wallet: '0x123...',
  reason: 'Suspicious activity',
  severity: 4
});

// Get wallet risk
const risk = await riskApi.getWalletRisk('0x123...');
```

## 🧪 Testing Integration

### Integration Test Component
Use the `IntegrationTest` component to verify frontend-backend connectivity:

```jsx
import IntegrationTest from './components/IntegrationTest';

function App() {
  return (
    <div>
      <IntegrationTest />
    </div>
  );
}
```

### Manual Testing
1. **Health Check**: `curl http://localhost:5050/health`
2. **Test Route**: `curl http://localhost:5050/test`
3. **API with Auth**: 
   ```bash
   curl -H "Authorization: Bearer demo-token" \
        http://localhost:5050/api/reports
   ```

## 🔒 Security

### CORS Configuration
Backend allows requests from:
- `http://localhost:3000` (React dev server)
- `http://localhost:3001` (Alternative port)
- `http://127.0.0.1:3000` (Alternative localhost)

### Authentication Flow
1. Frontend stores auth token in localStorage or env
2. API client automatically adds token to requests
3. Backend validates token on protected routes
4. 403 errors handled gracefully in frontend

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- Ensure backend CORS allows frontend origin
- Check if backend is running on correct port

**Authentication Failures**
- Verify auth token is correct
- Check if token is being sent in headers

**Connection Refused**
- Ensure backend is running on port 5050
- Check MongoDB is running on port 27017

**API Endpoint Not Found**
- Verify route exists in backend
- Check URL formatting in frontend

### Debug Commands
```bash
# Check if services are running
lsof -i :3000  # Frontend
lsof -i :5050  # Backend
lsof -i :27017 # MongoDB

# Test backend directly
curl http://localhost:5050/health
curl http://localhost:5050/test

# Check logs
# Backend logs in terminal
# Frontend logs in browser console
```

## 📦 Deployment

### Production Build
```bash
# Build frontend
cd Frontend && npm run build

# Start backend in production
cd Backend && NODE_ENV=production npm start
```

### Docker Deployment
```bash
# Build and start all services
docker-compose -f docker-compose.fullstack.yml up --build
```

## 🔄 Data Flow

1. **User Action** → Frontend component
2. **API Call** → Frontend API service
3. **HTTP Request** → Backend route handler
4. **Database Query** → MongoDB
5. **Response** → Backend → Frontend → UI Update

## 📈 Monitoring

- **Health Endpoint**: `/health` for service status
- **Logs**: Morgan logging in backend
- **Error Handling**: Axios interceptors in frontend
- **Performance**: Monitor API response times
