import { db } from '../db.js';
import { seedDemo } from '../seed/demoTenants.js';

const result = seedDemo(db, { writeFiles: true });
console.log(JSON.stringify(result, null, 2));
