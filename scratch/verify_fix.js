const { z } = require('zod');
const Papa = require('papaparse');

// Replicate Zod schema from route.ts
const zStringOpt = z.string().trim().optional().or(z.literal(''));
const zEmailOpt = z.string().trim().email().toLowerCase().optional().or(z.literal(''));

const contactSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  firstName: zStringOpt,
  lastName: zStringOpt,
  companyName: zStringOpt,
  ceoName: zStringOpt,
  companyEmail: zEmailOpt,
  companyNumber: zStringOpt,
});

// Mock CSV data with BOM, trailing spaces, and empty lines
const csvContent = '\ufeffEmail,First Name,Last Name\n' + 
                   ' john.doe@example.com , John , Doe \n' +
                   '  \n' +
                   'jane.smith@example.com,Jane,Smith\n';

const mapping = {
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name'
};

// 1. Strip BOM
let fileContent = csvContent;
if (fileContent.charCodeAt(0) === 0xFEFF) {
    console.log('BOM detected and stripped');
    fileContent = fileContent.slice(1);
}

// 2. Parse
const parseResult = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    trimHeaders: true,
});

console.log('Parsed Rows:', parseResult.data.length);
console.log('Headers:', parseResult.meta.fields);

const rows = parseResult.data;
const validContacts = [];
const errors = [];

rows.forEach((row, index) => {
    const emailVal = row[mapping.email];
    if (!emailVal) return;

    const contactObj = {
        email: emailVal,
        firstName: mapping.firstName ? row[mapping.firstName] : undefined,
        lastName: mapping.lastName ? row[mapping.lastName] : undefined,
    };

    const validation = contactSchema.safeParse(contactObj);
    if (validation.success) {
        validContacts.push(validation.data);
        console.log(`Row ${index + 1} valid:`, validation.data.email);
    } else {
        const errorMsg = validation.error?.errors?.[0]?.message || 'Invalid format';
        errors.push({ row: index + 1, error: errorMsg });
        console.log(`Row ${index + 1} error:`, errorMsg);
    }
});

console.log('Final valid contacts count:', validContacts.length);
if (validContacts.length === 2) {
    console.log('SUCCESS: All contacts processed correctly despite dirty data.');
} else {
    console.log('FAILURE: Expected 2 contacts, got', validContacts.length);
}
