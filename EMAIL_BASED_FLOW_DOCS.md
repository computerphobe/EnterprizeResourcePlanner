# Email-Based Client-Invoice Flow Documentation

## Overview

This document describes the new email-based flow for linking users to client records and their invoices. This approach provides a more reliable connection that works across user ID changes and supports multi-tenancy.

## Flow Structure

### 1. User Registration (Admin Action)
```
Admin registers hospital/doctor → Creates user in Admin collection + auto-creates client in Client collection
```

**What happens:**
- Admin fills registration form with user details
- System creates user account in `Admin` collection
- **For hospital/doctor roles**: System automatically creates linked client record in `Client` collection
- Both records share the same email address
- Client record includes `linkedUserId`, `userRole`, and `organizationId`

### 2. Invoice Creation (Accountant Action)
```
Accountant creates invoice → Links invoice to client by client ID
```

**What happens:**
- Accountant selects client from list (filtered by their organization)
- Invoice is created and linked to client via `client` field
- Invoice includes `organizationId` for proper separation

### 3. Invoice Viewing (Hospital/Doctor Action)
```
Hospital/Doctor logs in → System finds client by email → Shows client's invoices
```

**What happens:**
- User logs in with their credentials
- System uses user's email to find corresponding client record
- Fetches all invoices linked to that client
- Displays invoices in Sales Bills section

## Multi-Tenancy Support

### Organization Separation
- Each `owner` admin represents an organization
- All users created by that admin have `organizationId` pointing to the owner
- All clients, invoices, etc. are filtered by `organizationId`
- Prevents data mixing between different organizations

### Data Isolation
```javascript
// Example: Fetching invoices with organization isolation
const invoices = await Invoice.find({
  client: clientId,
  organizationId: userOrganizationId,
  removed: false
});
```

## Database Schema Changes

### Admin Model
```javascript
{
  organizationId: ObjectId, // Points to owner admin
  email: String,           // Unique identifier
  role: String,           // 'owner', 'hospital', 'doctor', etc.
  // ... other fields
}
```

### Client Model
```javascript
{
  organizationId: ObjectId,  // Points to owner admin
  email: String,            // Links to user email
  linkedUserId: ObjectId,   // Points to Admin record
  userRole: String,         // 'hospital', 'doctor', etc.
  // ... other fields
}
```

### Invoice Model
```javascript
{
  organizationId: ObjectId, // Points to owner admin
  client: ObjectId,        // Points to Client record
  // ... other fields
}
```

## API Endpoints

### Registration (Admin Only)
```
POST /api/register
{
  "name": "Hospital Name",
  "email": "hospital@email.com", 
  "password": "password",
  "role": "hospital",
  "phone": "+1234567890",
  "address": "Hospital Address"
}
```

### Invoice Viewing (Hospital/Doctor)
```
GET /api/hospital/sales-bills
GET /api/doctor/sales-bills
```

## Benefits of Email-Based Approach

1. **Reliability**: Email addresses are stable and don't change
2. **Uniqueness**: Email provides natural unique identifier
3. **Multi-tenancy**: Organization isolation prevents data mixing
4. **Auto-linking**: Automatic client creation during registration
5. **Maintenance**: Easy to troubleshoot and manage relationships

## Testing

Use the provided test script:
```bash
node test-email-flow.js
```

This tests:
1. User registration with auto-client creation
2. Login with new user
3. Invoice viewing with email-based lookup

## Migration Notes

For existing systems:
1. Add `organizationId` to existing records
2. Add `email` field to Client records if missing
3. Link existing clients to users by email matching
4. Update all queries to include organization filtering

## Troubleshooting

### No Client Found
- Check if client record was created during registration
- Verify email matches between user and client records
- Ensure `organizationId` is consistent

### No Invoices Displayed
- Verify invoices are linked to correct client ID
- Check `organizationId` filtering
- Confirm invoice `client` field points to valid client

### Multi-tenancy Issues
- Ensure all records have proper `organizationId`
- Verify organization filtering in all queries
- Check that admin creating records is from correct organization
