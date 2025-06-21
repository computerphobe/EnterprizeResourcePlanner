# Invoice Module Testing Instructions

This document provides instructions for testing the invoice module, especially the hospital/doctor invoice viewing functionality with automatic client registration.

## New Auto-Registration Feature

The system now automatically creates client records for users who don't have them when they access their sales bills. This ensures seamless access to invoice viewing without manual setup.

## Testing Endpoints

1. Use the `test-invoice-endpoints.js` script to test the API endpoints:

```bash
# First edit the script to add your auth token and test client ID
nano test-invoice-endpoints.js

# Then run the script
node test-invoice-endpoints.js
```

2. Use the `test-client-autoregister.js` script to test auto-registration:

```bash
# Edit the script to add your admin token
nano test-client-autoregister.js

# Run the auto-registration tests
node test-client-autoregister.js
```

## Verifying Hospital/Doctor Invoice Viewing with Auto-Registration

1. **First-time Login Test:**
   - Create a new hospital or doctor user account
   - Login and navigate to the Sales Bills section
   - System should automatically create a client record
   - User should see a welcome message about the new client record
   - Invoice section should display correctly (even if empty initially)

2. **Existing User Test:**
   - Login as an existing hospital or doctor user
   - Navigate to the Sales Bills section
   - System should find the existing client record
   - No welcome message should appear
   - Invoices should display correctly

3. **Admin Testing:**
   - Login as an admin/owner
   - Use the new endpoint `/api/admin/client/find-or-create` to manually create clients
   - Use the invoice debugger to check invoices for specific clients
   - Verify that duplicate client creation is prevented

## Manual Client Creation (Admin Only)

Admins can manually create client records using the API:

```javascript
POST /api/admin/client/find-or-create
{
  "userId": "user-id-here",
  "userInfo": {
    "name": "Client Name",
    "email": "client@example.com",
    "phone": "+1234567890",
    "address": "Client Address"
  }
}
```

## Troubleshooting Common Issues

### "No invoices found" Message

If users don't see their invoices:

1. Check if a client record was automatically created (watch for welcome message)
2. Verify the client record in the database has the correct userId linked
3. Check that invoices have been created and properly linked to the client
4. Use the admin endpoint to manually check for invoices by client ID

### Client Auto-Registration Not Working

If client records aren't being created automatically:

1. Check server logs for error messages during client creation
2. Verify the Client model is accessible and writable
3. Ensure the user has proper authentication and role permissions
4. Test the manual client creation endpoint to isolate issues

### ObjectId Constructor Error

If you see this error in server logs:

```
TypeError: Class constructor ObjectId cannot be invoked without 'new'
```

The updated code should handle this automatically by:
1. Using the client utilities to properly handle ObjectId creation
2. Finding or creating client records before querying invoices
3. Falling back to filtering all invoices when needed

## Implementation Details

The auto-registration works by:

1. **Client Lookup**: When a user accesses their sales bills, the system first tries to find an existing client record using their user ID
2. **Automatic Creation**: If no client record exists, the system creates one using the user's information from their login session
3. **Invoice Querying**: Once a client record exists, invoices are queried directly using the client's ObjectId
4. **Notification**: Users are notified when a new client record is created for them

This approach ensures that:
- All users can access their invoice section immediately
- Client records are properly linked to user accounts
- Invoice associations work correctly from the first login
- No manual intervention is required for basic functionality
