// Test script to quickly verify the invoice client matching logic
const mongoose = require('mongoose');

// Mock data representing invoices and clients in our database
const mockInvoices = [
  {
    _id: '1',
    client: {
      _id: '101',
      userId: '201',
      name: 'Hospital A'
    },
    number: '001',
    year: 2023,
    total: 500,
    paymentStatus: 'paid'
  },
  {
    _id: '2',
    client: {
      _id: '102',
      userId: '202',
      name: 'Doctor B'
    },
    number: '002',
    year: 2023,
    total: 750,
    paymentStatus: 'pending'
  },
  {
    _id: '3',
    client: {
      _id: '201', // Notice this matches userId in first invoice
      userId: '301',
      name: 'Hospital C'
    },
    number: '003',
    year: 2023,
    total: 1000,
    paymentStatus: 'paid'
  }
];

// Test function to simulate the invoice filtering logic
function filterInvoicesByClient(invoices, userId) {
  return invoices.filter(invoice => {
    if (!invoice.client) return false;
    
    const clientId = invoice.client._id ? invoice.client._id.toString() : null;
    const clientUserId = invoice.client.userId ? invoice.client.userId.toString() : null;
    
    return clientId === userId || clientUserId === userId;
  });
}

// Run tests
function runTests() {
  console.log('=== TESTING INVOICE CLIENT MATCHING LOGIC ===');
  
  const testCases = [
    { userId: '101', expected: 1, desc: 'Match by client._id' },
    { userId: '201', expected: 2, desc: 'Match by both client._id and client.userId' },
    { userId: '202', expected: 1, desc: 'Match by client.userId' },
    { userId: '999', expected: 0, desc: 'No matches' }
  ];
  
  testCases.forEach(test => {
    const result = filterInvoicesByClient(mockInvoices, test.userId);
    const passed = result.length === test.expected;
    
    console.log(
      `${passed ? '✅ PASS' : '❌ FAIL'} - ${test.desc}: ` +
      `Expected ${test.expected}, got ${result.length} for userId ${test.userId}`
    );
    
    if (!passed) {
      console.log('  Matching invoices:', result);
    }
  });
}

// Run the tests
runTests();

// Usage instructions:
console.log('\n=== INSTRUCTIONS ===');
console.log('Run this script with: node test-client-match.js');
console.log('This verifies the client invoice matching logic used in clientInvoices.js');
