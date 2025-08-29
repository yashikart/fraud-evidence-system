
# 🛡️ Fraud Evidence System

A comprehensive blockchain-integrated fraud detection and evidence management system with ML-powered behavioral analysis.

## 🌟 Features

### 📊 **ML-Powered Fraud Detection**
- Real-time behavioral pattern analysis
- Risk scoring with color-coded indicators (0.0-1.0 scale)
- Multi-component detection: rapid dumping, large transfers, flash loans, phishing
- Advanced filtering by risk severity and violation types

### 🔗 **Blockchain Evidence Management**
- SHA-256 hash generation for file integrity
- Smart contract simulation for evidence storage
- IPFS-style distributed storage simulation
- Chain of custody visualization

### 📁 **Admin Dashboard**
- Comprehensive evidence library with search and filtering
- Threat map with geo-IP visualization
- Real-time ML analysis results display
- Export functionality (PDF, JSON, CSV)

### 🔐 **Security & Compliance**
- JWT-based authentication
- File validation and size limits
- Audit logging for all operations
- Blockchain-based integrity verification

## 🏗️ Architecture

### Backend (Node.js + Express)
- **API Routes**: Evidence, ML analysis, reports, authentication
- **Database**: MongoDB for data persistence
- **Services**: ML detection, blockchain simulation, IPFS simulation
- **Security**: JWT auth, rate limiting, audit logging

### Frontend (React + Vite)
- **Components**: Evidence upload, chain visualizer, admin dashboard
- **State Management**: React hooks with real-time updates
- **UI/UX**: Modern responsive design with Tailwind CSS
- **Integration**: Real-time ML analysis display

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or remote)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashikart/Fraud_System.git
   cd Fraud_System
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

4. **Environment Configuration**
   
   Backend `.env` file:
   ```env
   MONGO_URI=mongodb://localhost:27017/fraudDB
   PORT=5050
   ADMIN_EMAIL=your-admin@email.com
   ADMIN_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret
   ```

   Frontend `.env` file:
   ```env
   VITE_BACKEND_URL=http://localhost:5050
   ```

### Default Access
- **Admin Login**: Use the email/password from your `.env` file
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5050

## 📖 Usage Guide

### 1. **Submit Fraud Report**
- Navigate to the main dashboard
- Enter wallet address and reason for reporting
- Submit to trigger immediate ML analysis
- View real-time risk assessment and recommendations

### 2. **Upload Evidence**
- After report submission, use the evidence upload section
- Drag-and-drop PDF/image files
- Automatic blockchain hashing and storage
- Receive confirmation with transaction details

### 3. **Admin Management**
- Access `/admin` for comprehensive dashboard
- View ML analysis results with advanced filtering
- Manage evidence library with search capabilities
- Export reports in multiple formats

### 4. **Chain Visualization**
- View complete evidence trail from flagging to action
- Interactive timeline with expandable transaction details
- Real-time status updates (confirmed, pending, failed)

## 🤖 ML Detection System

### Behavioral Patterns Analyzed
- **Rapid Token Dumping**: Multiple transactions within short timeframes
- **Large Transfers**: Unusually high-value transactions
- **Flash Loan Manipulation**: Complex transaction patterns
- **Phishing Indicators**: Address patterns and keyword analysis

### Risk Scoring Algorithm
```
Risk Score = (Rapid Dumping × 30%) + (Large Amount × 25%) + 
             (Flash Loan × 20%) + (Phishing × 15%) + (Report History × 10%)
```

### Action Recommendations
- **0.0-0.39**: 🟢 No Action Required
- **0.4-0.59**: 🟡 Monitor Activity  
- **0.6-0.79**: 🟠 Investigate Further
- **0.8-1.0**: 🔴 Freeze/Block Immediately

## 🛠️ API Documentation

### Evidence Endpoints
```
POST   /api/evidence/upload        - Upload evidence file
GET    /api/evidence/case/:caseId  - Get evidence by case
POST   /api/evidence/verify/:id    - Verify evidence integrity
GET    /api/evidence/trail/:caseId - Get evidence chain
```

### ML Analysis Endpoints
```
POST   /api/ml/analyze             - Perform ML analysis
GET    /api/ml/results             - Get analysis results
GET    /api/ml/config              - Get ML configuration
```

### Authentication Endpoints
```
POST   /api/auth/login             - User login
POST   /api/auth/register          - User registration
GET    /api/auth/profile           - Get user profile
```

## 📁 Project Structure

```
fraud-evidence-system/
├── Backend/
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation, logging
│   ├── utils/           # Helper functions
│   └── server.js        # Main server file
├── Frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── styles/      # CSS files
│   └── public/          # Static assets
├── Documentation/
│   ├── ml-detection.md  # ML system documentation
│   ├── EVIDENCE_FEATURES.md
│   └── INTEGRATION.md
└── README.md
```

## 🔧 Configuration

### MongoDB Setup
```javascript
// Ensure MongoDB is running on default port
// Database: fraudDB
// Collections: users, reports, evidence, auditlogs
```

### Environment Variables
See `.env.example` files in both Backend and Frontend directories for complete configuration options.

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd Backend
npm test

# Frontend tests  
cd Frontend
npm test
```

### Test Coverage
- Unit tests for ML detection algorithms
- Integration tests for API endpoints
- Frontend component testing
- End-to-end workflow testing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Blockchain integration using simulated smart contracts
- ML algorithms for behavioral pattern detection
- Modern React architecture with performance optimization
- Comprehensive security implementation

## 📧 Contact

**Developer**: Yashika Tirkey  
**Email**: [your-email@domain.com]  
**GitHub**: [@yashikart](https://github.com/yashikart)  
**Project Link**: [https://github.com/yashikart/Fraud_System](https://github.com/yashikart/Fraud_System)

---

⭐ Star this repository if it helped you build a robust fraud detection system!
=======
# Fraud_Sytem
>>>>>>> ef85fba629d6180853ec54b8f2af6719339fb270
