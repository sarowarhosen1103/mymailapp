const { z } = require('zod');

const schema1 = z.string().email().trim();
const schema2 = z.string().trim().email();

console.log('schema1 (email then trim) " test@example.com ":', schema1.safeParse(' test@example.com ').success);
console.log('schema2 (trim then email) " test@example.com ":', schema2.safeParse(' test@example.com ').success);
