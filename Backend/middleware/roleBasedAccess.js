// middleware/roleBasedAccess.js
const User = require('../models/User');
const APILogger = require('../services/apiLogger');

// Check if user has specific permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      if (!user.hasPermission(permission)) {
        return res.status(403).json({ 
          error: `Insufficient permissions. Required: ${permission}`,
          userRole: user.role,
          requiredPermission: permission
        });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission verification failed' });
    }
  };
};

// Check if user has specific role
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      const userRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!userRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient role privileges',
          requiredRoles: userRoles,
          userRole: user.role
        });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Role verification failed' });
    }
  };
};

// Admin only access
const adminOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        userRole: user.role
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Evidence Library Access (Admin & Investigator only)
const requireEvidenceLibraryAccess = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.canAccessEvidenceLibrary()) {
      return res.status(403).json({ 
        error: 'Evidence library access denied',
        reason: 'Requires admin or investigator role',
        userRole: user.role
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Evidence library access check error:', error);
    res.status(500).json({ error: 'Access verification failed' });
  }
};

// Public access (no authentication required)
const publicAccess = (req, res, next) => {
  // Allow access without authentication for public endpoints
  next();
};

// Log access attempts for audit purposes with enhanced details
const logAccess = (action) => {
  return (req, res, next) => {
    const logData = {
      action,
      user: req.user?.email || 'anonymous',
      role: req.currentUser?.role || req.user?.role || 'public',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      path: req.originalUrl,
      method: req.method,
      query: req.query,
      body: req.method === 'POST' ? Object.keys(req.body) : undefined,
      sessionId: req.sessionID || 'none'
    };

    console.log(`[ACCESS_LOG] ${JSON.stringify(logData)}`);
    
    // Also log to API logger if available
    try {
      const apiLogger = new APILogger();
      apiLogger.writeLog(`[RBAC_ACCESS] ${new Date().toISOString()} - ${action}\nUser: ${logData.user} (${logData.role})\nPath: ${logData.method} ${logData.path}\nIP: ${logData.ip}\n${'='.repeat(50)}\n`);
    } catch (error) {
      // Silent fail for logging
    }
    
    next();
  };
};

// Add user context to response
const addUserContext = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        req.currentUser = user;
        res.locals.userContext = {
          role: user.role,
          permissions: user.permissions,
          canAccessEvidenceLibrary: user.canAccessEvidenceLibrary(),
          isActive: user.isActive
        };
      }
    }
    next();
  } catch (error) {
    console.error('Error adding user context:', error);
    next(); // Continue without user context
  }
};

// Enhanced investigator access (for evidence library)
const investigatorOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    if (!['admin', 'investigator'].includes(user.role)) {
      return res.status(403).json({ 
        error: 'Investigator or admin access required',
        userRole: user.role,
        requiredRoles: ['admin', 'investigator'],
        code: 'INSUFFICIENT_ROLE'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Investigator access check error:', error);
    res.status(500).json({ 
      error: 'Access verification failed',
      code: 'ACCESS_CHECK_ERROR'
    });
  }
};

// Enhanced evidence action permissions
const evidenceActionPermission = (action) => {
  return async (req, res, next) => {
    try {
      if (!req.currentUser) {
        // Try to get user if not already set
        if (req.user && req.user.id) {
          req.currentUser = await User.findById(req.user.id);
        }
        
        if (!req.currentUser) {
          return res.status(401).json({ 
            error: 'Authentication required for evidence action',
            action,
            code: 'AUTH_REQUIRED'
          });
        }
      }

      // Check specific action permissions
      const permissionMap = {
        'view': 'viewEvidence',
        'export': 'exportEvidence', 
        'share': 'shareEvidence',
        'delete': 'deleteEvidence'
      };

      const requiredPermission = permissionMap[action];
      if (!requiredPermission) {
        return res.status(400).json({ 
          error: 'Invalid action specified',
          action,
          code: 'INVALID_ACTION'
        });
      }

      if (!req.currentUser.hasPermission(requiredPermission)) {
        return res.status(403).json({ 
          error: `Insufficient permissions for ${action} action`,
          userRole: req.currentUser.role,
          requiredPermission,
          action,
          code: 'INSUFFICIENT_PERMISSION'
        });
      }

      next();
    } catch (error) {
      console.error(`Evidence ${action} permission check error:`, error);
      res.status(500).json({ 
        error: `Permission verification failed for ${action}`,
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireRole,
  adminOnly,
  investigatorOnly,
  requireEvidenceLibraryAccess,
  evidenceActionPermission,
  publicAccess,
  logAccess,
  addUserContext
};