const schema = require('./src/controllers/appControllers/invoiceController/schemaValidate');

// Test the schema with a sample invoice data
const testInvoiceData = {
  client: "507f1f77bcf86cd799439011",
  number: 1001,
  year: 2025,
  status: "draft",
  notes: "Test invoice",
  patientName: "John Doe",
  discount: 0,
  expiredDate: new Date("2025-07-19"),
  date: new Date("2025-06-19"),
  items: [
    {
      itemName: "Test Item",
      description: "Test description",
      quantity: 1,
      price: 100,
      total: 100
    }
  ],
  taxRate: 5
};

console.log('🧪 Testing invoice schema validation...');

const { error, value } = schema.validate(testInvoiceData);

if (error) {
  console.log('❌ Validation failed:', error.details[0]?.message);
} else {
  console.log('✅ Validation passed!');
  console.log('Validated data:', JSON.stringify(value, null, 2));
}

// Test with patientName only
const testWithPatientName = {
  ...testInvoiceData,
  patientName: "Jane Smith"
};

console.log('\n🧪 Testing with patientName...');
const result2 = schema.validate(testWithPatientName);

if (result2.error) {
  console.log('❌ Validation failed:', result2.error.details[0]?.message);
} else {
  console.log('✅ Validation passed with patientName!');
}
