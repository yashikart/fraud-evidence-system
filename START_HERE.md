# 🚀 Quick Start Guide - Windows Terminal

Follow these steps exactly to get your fraud evidence system running:

## Step 1: Check Prerequisites

### Open Command Prompt (cmd) or PowerShell as Administrator
```cmd
# Check Node.js version (should be v21.7.1)
node --version

# Check if MongoDB is installed
mongod --version
```

## Step 2: Start MongoDB

### Option A: Start MongoDB Service (if installed as service)
```cmd
net start MongoDB
```

### Option B: Start MongoDB manually
```cmd
# Navigate to MongoDB bin directory (adjust path as needed)
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod --dbpath "C:\data\db"
```

### Option C: If MongoDB not installed, use MongoDB Atlas
- Go to https://cloud.mongodb.com
- Create free cluster
- Get connection string
- Update .env file with your Atlas connection string

## Step 3: Start Backend Server

```cmd
# Open new terminal window
# Navigate to project
cd "c:\Users\Yashika\fraud-evidence-system"

# Go to Backend folder
cd Backend

# Install dependencies (if not done)
npm install

# Start the server
npm start
```

**Expected Output:**
```
✅ MongoDB connected
ℹ️ Creating default admin: aryangupta3103@gmail.com
✅ Admin created: aryangupta3103@gmail.com
🚀 Server running on port 5050
```

## Step 4: Test if Server is Working

### Open new terminal and test:
```cmd
# Test server health
curl http://localhost:5050/health
```

**OR** open browser and go to: `http://localhost:5050/health`

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-28T...",
  "uptime": 123.456
}
```

## Step 5: Start Frontend (Optional)

```cmd
# Open another terminal
cd "c:\Users\Yashika\fraud-evidence-system"
cd Frontend

# Install dependencies (if not done)
npm install

# Start frontend
npm run dev
```

## 🐛 Troubleshooting Common Issues

### Issue 1: "node server.js" fails
**Solution:** Use `npm start` instead
```cmd
cd Backend
npm start
```

### Issue 2: MongoDB connection error
**Check if MongoDB is running:**
```cmd
# Windows - check if service is running
sc query MongoDB

# Or check process
tasklist | findstr mongod
```

**Start MongoDB:**
```cmd
net start MongoDB
```

### Issue 3: Port already in use
**Kill process on port 5050:**
```cmd
# Find process using port 5050
netstat -ano | findstr :5050

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue 4: Permission denied
**Run as Administrator:**
- Right-click Command Prompt
- Select "Run as administrator"
- Try commands again

### Issue 5: IPFS errors (expected)
**This is normal** - the system falls back to simulation mode
```
IPFS client initialization skipped - using simulation mode
```

## 🎯 Quick Test Commands

Once server is running, test each feature:

### Test 1: Basic API
```cmd
curl http://localhost:5050/api/evidence
```

### Test 2: Upload test (needs auth token)
```cmd
curl -X POST http://localhost:5050/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"aryangupta3103@gmail.com\",\"password\":\"Aryan&Keval\"}"
```

### Test 3: Check investigations
```cmd
curl http://localhost:5050/api/investigations
```

## 📱 Using the Frontend

If you start the frontend:
1. Open browser: `http://localhost:3000` (or whatever port Vite shows)
2. Login with: `aryangupta3103@gmail.com` / `Aryan&Keval`
3. Test the 5 features through the UI

## 🔍 Verify Features are Working

### 1. **Hybrid Storage** - Upload a file through frontend or API
### 2. **Chain of Custody** - Check evidence timeline has IP/risk data
### 3. **PDF Reports** - Generate and download case reports
### 4. **Role Access** - Test with different user roles
### 5. **Case Linking** - Link multiple wallets/IPs under investigation

## 📞 Still Having Issues?

1. **Check logs:** Look at the terminal where you started the server
2. **Check MongoDB:** Make sure it's running and accessible
3. **Check ports:** Ensure 5050 (backend) and 27017 (MongoDB) are free
4. **Check firewall:** Windows Firewall might block connections

## ✅ Success Indicators

- [ ] MongoDB service running
- [ ] Backend server starts without errors
- [ ] Health check returns OK
- [ ] Frontend loads (if using)
- [ ] Can login with admin credentials
- [ ] API endpoints respond (even with auth errors is OK)

**Next:** Once this is working, use the detailed testing guide in `FEATURE_TESTING_GUIDE.md`