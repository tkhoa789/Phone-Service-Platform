const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function executeDb(sql) {
  try {
    const tempFile = path.join(os.tmpdir(), `sqlcmd_exec_${Date.now()}_${Math.random().toString(36).slice(2)}.sql`);
    fs.writeFileSync(tempFile, 'SET NOCOUNT ON;\n' + sql, 'utf8');
    const cmd = `sqlcmd -S ".\\SQLEXPRESS" -d PSP_Database -E -i "${tempFile}"`;
    execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    try { fs.unlinkSync(tempFile); } catch (_) {}
    return true;
  } catch (err) {
    console.error('DB execute error:', err.message);
    return false;
  }
}

function queryDb(sql) {
  try {
    const tempFile = path.join(os.tmpdir(), `sqlcmd_query_${Date.now()}_${Math.random().toString(36).slice(2)}.sql`);
    fs.writeFileSync(tempFile, 'SET NOCOUNT ON;\n' + sql, 'utf8');
    const cmd = `sqlcmd -S ".\\SQLEXPRESS" -d PSP_Database -E -h -1 -s "," -W -i "${tempFile}"`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    try { fs.unlinkSync(tempFile); } catch (_) {}
    const lines = output.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.includes('rows affected'));
    return lines.join('\n');
  } catch (err) {
    console.error('DB query error:', err.message);
    return null;
  }
}

function queryScalar(sql) {
  const res = queryDb(sql);
  if (!res) return null;
  const lines = res.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines[0] : null;
}

module.exports = { queryDb, queryScalar, executeDb };

