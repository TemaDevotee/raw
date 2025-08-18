import fs from 'fs';
import path from 'path';
import { db } from '../db.js';

fs.rmSync(path.resolve('.mockdb/files'), { recursive: true, force: true });
db.tenants = [];
db.users = [];
console.log('cleaned');
