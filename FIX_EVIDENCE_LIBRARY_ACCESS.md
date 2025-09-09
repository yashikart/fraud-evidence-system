# Fix Evidence Library Access Issue

## Problem
The Evidence Library is showing "Access Denied" even when logging in with the correct admin credentials (aryangupta3103@gmail.com / Aryan&Keval).

## Root Cause
There are two authentication systems in the application:
1. **Supabase authentication** (used in the frontend UI)
2. **Custom JWT authentication** (used in the backend API)

The Evidence Library component expects a custom JWT token with role information, but the frontend is using Supabase tokens which have a different format.

## Solution

### Step 1: Use the Backend Login API Directly

Instead of using the frontend login form, use the backend API to get the proper JWT token:

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this JavaScript code:

```javascript
// Login with backend API to get proper JWT token
async function fixEvidenceAccess() {
  const email = 'aryangupta3103@gmail.com';
  const password = 'Aryan&Keval';
  const backendUrl = 'http://localhost:5050';
  
  try {
    // Login with backend
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.token) {
      // Store the token
      localStorage.setItem('authToken', data.token);
      console.log('✅ Login successful! Token stored.');
      
      // Verify the token
      const verifyResponse = await fetch(`${backendUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      if (verifyResponse.ok) {
        const userData = await verifyResponse.json();
        console.log('✅ Token verified successfully!');
        console.log('👤 User:', userData.email);
        console.log('🏷️ Role:', userData.role);
      }
      
      console.log('🔄 Please refresh the Evidence Library page');
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the function
fixEvidenceAccess();
```

### Step 2: Refresh the Evidence Library Page

After running the above code, refresh the Evidence Library page (http://localhost:3000/admin) to see if the access issue is resolved.

### Step 3: Alternative Method - Fix User Role in Database

If the above method doesn't work, you can manually fix the admin user's role and permissions in the database:

1. Open a terminal/command prompt
2. Navigate to the Backend directory:
   ```
   cd c:\Users\Yashika\fraud-evidence-system\Backend
   ```

3. Run this command to fix the admin user role:
   ```
   curl -X POST http://localhost:5050/api/fix-admin-role
   ```

   Or use this JavaScript code in the browser console:
   ```javascript
   fetch('http://localhost:5050/api/fix-admin-role', {
     method: 'POST'
   })
   .then(response => response.json())
   .then(data => console.log('✅ Admin role fixed:', data))
   .catch(error => console.log('❌ Error:', error));
   ```

### Step 4: Verify Access

After applying the fixes, you should be able to access the Evidence Library. The component will:

1. Check your authentication token
2. Verify your role (should be 'admin', 'investigator', or 'superadmin')
3. Grant access to the Evidence Library

## Additional Troubleshooting

### Check Current Token
To see what token is currently stored:

```javascript
const token = localStorage.getItem('authToken');
if (token) {
  console.log('Token:', token.substring(0, 50) + '...');
  
  // Try to decode (only works with JWT tokens)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Decoded payload:', payload);
  } catch (e) {
    console.log('Not a JWT token or invalid format');
  }
} else {
  console.log('No token found');
}
```

### Test Evidence Library API Directly
To test if the API is working:

```javascript
const token = localStorage.getItem('authToken');
if (token) {
  fetch('http://localhost:5050/api/evidence?page=1&limit=5', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => console.log('Evidence data:', data))
  .catch(error => console.log('Error:', error));
} else {
  console.log('No token found');
}
```

## Why This Happens

The application uses two different authentication systems:

1. **Frontend (Supabase)**: Used for the UI login form
2. **Backend (Custom JWT)**: Used for API authentication and role-based access control

The Evidence Library component was designed to work with the backend authentication system, which includes role information in the JWT token. The Supabase tokens don't contain this information, causing the access denied error.

## Future Improvements

To prevent this issue in the future, the application should:

1. Use only one authentication system (preferably the custom JWT system for full control)
2. Update the frontend login to use the backend authentication
3. Remove the Supabase dependency for authentication

The code changes made in `Frontend/src/App.jsx` and `Frontend/src/components/EvidenceLibrary.jsx` are steps toward this goal.