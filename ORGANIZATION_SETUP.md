# Organization ID Setup Guide

## The Problem
The system requires `organizationId` for multi-tenant support, but existing admins might not have this field set up properly.

## Quick Fix Options

### Option 1: Fix Existing Admin Organization (Recommended)
1. Update the MongoDB URI in `fix-admin-organization.js`
2. Run the script:
   ```bash
   node fix-admin-organization.js
   ```

### Option 2: Manual Database Update
Connect to your MongoDB and run:
```javascript
// Find the owner admin
const owner = db.admins.findOne({role: 'owner'});

// Update all non-owner admins to have organizationId = owner._id
db.admins.updateMany(
  {
    role: {$ne: 'owner'}, 
    organizationId: {$exists: false}
  },
  {
    $set: {organizationId: owner._id}
  }
);
```

### Option 3: Temporary Workaround
Make organizationId optional in Client model (already done in the latest update).

## How the Organization Structure Works

```
Owner Admin (role: 'owner')
├── organizationId: null (they are the organization)
└── _id: [OWNER_ID]

Sub-Admin (role: 'hospital', 'doctor', etc.)
├── organizationId: [OWNER_ID] (references the owner)
└── _id: [SUB_ADMIN_ID]

Client Records
├── organizationId: [OWNER_ID] (same as their linked admin)
├── linkedUserId: [SUB_ADMIN_ID] (the admin user account)
└── userRole: 'hospital' or 'doctor'
```

## After Fixing
Once admin organization IDs are set up correctly, new user registration will work properly and create both user and client records.
