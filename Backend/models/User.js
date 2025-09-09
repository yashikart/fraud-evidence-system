const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String,
  role: { 
    type: String, 
    enum: ['admin', 'investigator', 'public'], 
    default: 'public' 
  },
  permissions: {
    // Evidence permissions
    viewEvidence: { type: Boolean, default: false },
    shareEvidence: { type: Boolean, default: false },
    deleteEvidence: { type: Boolean, default: false },
    exportEvidence: { type: Boolean, default: false },
    
    // Administrative permissions
    manageRoles: { type: Boolean, default: false },
    escalateCase: { type: Boolean, default: false },
    userManagement: { type: Boolean, default: false },
    
    // Case permissions
    viewCases: { type: Boolean, default: false },
    createCases: { type: Boolean, default: false },
    editCases: { type: Boolean, default: false }
  },
  firstName: { type: String },
  lastName: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
});

// Set role-based permissions
userSchema.methods.setRolePermissions = function() {
  switch (this.role) {
    case 'admin':
      this.permissions = {
        viewEvidence: true,
        shareEvidence: true,
        deleteEvidence: true,
        exportEvidence: true,
        manageRoles: true,
        escalateCase: true,
        userManagement: true,
        viewCases: true,
        createCases: true,
        editCases: true
      };
      break;
    
    case 'investigator':
      this.permissions = {
        viewEvidence: true,
        shareEvidence: true,
        deleteEvidence: false,
        exportEvidence: true,
        manageRoles: false,
        escalateCase: false,
        userManagement: false,
        viewCases: true,
        createCases: true,
        editCases: true
      };
      break;
    
    case 'public':
    default:
      this.permissions = {
        viewEvidence: false,
        shareEvidence: false,
        deleteEvidence: false,
        exportEvidence: false,
        manageRoles: false,
        escalateCase: false,
        userManagement: false,
        viewCases: false,
        createCases: false,
        editCases: false
      };
      break;
  }
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

// Check if user can access evidence library
userSchema.methods.canAccessEvidenceLibrary = function() {
  return this.hasPermission('viewEvidence') && this.isActive;
};

// Auto-set permissions when role changes
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.setRolePermissions();
  }
  next();
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
