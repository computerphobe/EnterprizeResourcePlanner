# Invoice PatientName Field Fix

## Issue
When trying to save an invoice, got a 400 error:
```
"patientName" is not allowed
```

## Root Cause
The Joi schema validation in `backend/src/controllers/appControllers/invoiceController/schemaValidate.js` was missing the `patientName` field, causing validation to fail when the frontend sent this field.

## Solution
Updated the schema validation to include:
1. `patientName` - Optional string field for patient name
2. `discount` - Optional number field for discount (was also missing)

## Files Modified
- `backend/src/controllers/appControllers/invoiceController/schemaValidate.js`

## Changes Made
```javascript
// Added these fields to the Joi schema:
patientName: Joi.string().allow('').optional(), // Allow patient name for hospital/doctor invoices
discount: Joi.number().optional().default(0), // Allow discount field
```

## Status
✅ **Fixed**: Invoice creation now accepts `patientName` field without validation errors
✅ **Tested**: Schema validation passes with sample data including patientName
✅ **Compatible**: The fix maintains backward compatibility (fields are optional)

## What This Enables
- Hospitals and doctors can now include patient names in invoices
- Invoice creation will work properly from the frontend forms
- Full multi-tenancy support for patient-specific invoicing
