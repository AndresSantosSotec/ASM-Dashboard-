// Simple test script for the duplicate prevention functionality
const { 
  normalizeBankName, 
  normalizeReceiptNumber, 
  createReceiptId,
  generateFileHash,
  validateReceiptData,
  getDuplicateErrorMessage 
} = require('./lib/payment-utils.ts');

const { PaymentDataStore } = require('./lib/data-store.ts');

console.log('Testing duplicate prevention functionality...\n');

// Test normalization
console.log('1. Testing normalization:');
console.log('Bank: "banco INDUSTRIAL " -> "' + normalizeBankName("banco INDUSTRIAL ") + '"');
console.log('Receipt: "BI-123 456" -> "' + normalizeReceiptNumber("BI-123 456") + '"');
console.log('Receipt ID: "' + createReceiptId("banco INDUSTRIAL ", "BI-123 456") + '"');

// Test validation
console.log('\n2. Testing validation:');
const validData = {
  banco: 'Banco Industrial',
  numeroboleta: 'BI123456',
  monto: 1500,
  estudianteId: 'EST001'
};

const invalidData = {
  banco: '',
  numeroboleta: 'BI123456',  
  monto: 0,
  estudianteId: 'EST001'
};

console.log('Valid data errors:', validateReceiptData(validData));
console.log('Invalid data errors:', validateReceiptData(invalidData));

// Test error messages
console.log('\n3. Testing error messages:');
console.log('Same student:', getDuplicateErrorMessage('same_student', {fecha: '2025-01-15', estado: 'aprobado'}));
console.log('Other student:', getDuplicateErrorMessage('other_student'));
console.log('Same file:', getDuplicateErrorMessage('same_file'));

// Test data store
console.log('\n4. Testing data store:');
console.log('Initial stats:', PaymentDataStore.getStats());

// Test duplicate check
const testReceiptId = 'BANCO INDUSTRIAL:BI123456';
const testFileSha = 'abc123def456789';
const testStudentId = 'est-001';

console.log('\nTesting duplicate check for existing data:');
const duplicateCheck = PaymentDataStore.checkForDuplicates(testReceiptId, testFileSha, testStudentId);
console.log('Duplicate check result:', duplicateCheck);

console.log('\nTesting duplicate check for new data:');
const newDuplicateCheck = PaymentDataStore.checkForDuplicates('NEW:RECEIPT123', 'newhash123', 'newstudent');
console.log('New duplicate check result:', newDuplicateCheck);

console.log('\nTest completed successfully!');