const fs = require('fs');
const path = require('path');

const root = path.resolve('apps/simulator-studio/src');
const exts = ['.vue', '.ts', '.js', '.tsx', '.jsx', '.json'];

function collect(dir) {
  const res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) res.push(...collect(full));
    else if (entry.isFile()) res.push(full);
  }
  return res;
}

function resolveImport(spec, from) {
  if (spec.startsWith('@/')) {
    return path.join(root, spec.slice(2));
  }
  if (spec.startsWith('.')) {
    return path.resolve(path.dirname(from), spec);
  }
  return null;
}

function exists(resolved) {
  if (!resolved) return true;
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return true;
  for (const ext of exts) {
    if (fs.existsSync(resolved + ext)) return true;
  }
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    for (const ext of exts) {
      if (fs.existsSync(path.join(resolved, 'index' + ext))) return true;
    }
  }
  return false;
}

const files = collect(root).filter(f => /\.(ts|tsx|js|jsx|vue)$/.test(f));
const missing = [];
const importRe = /(import\s+[^'"()]*['"]([^'"()]+)['"]|import\(['"]([^'"]+)['"]\))/g;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = importRe.exec(text))) {
    const spec = m[2] || m[3];
    const resolved = resolveImport(spec, file);
    if (spec && (spec.startsWith('.') || spec.startsWith('@/'))) {
      if (!exists(resolved)) missing.push(`${file}: ${spec}`);
    }
  }
}

if (missing.length) {
  console.error('Unresolved imports:');
  for (const m of missing) console.error('  ' + m);
  process.exit(1);
}
