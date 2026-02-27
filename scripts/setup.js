/**
 * Cross-platform setup orchestrator.
 * Called by `npm run setup` — detects OS and delegates to the right script.
 *
 * Windows  → PowerShell scripts/setup.ps1
 * Mac/Linux → bash scripts/setup.sh
 */
const { execSync, spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const isWindows = os.platform() === 'win32';

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: root, ...opts });
}

if (isWindows) {
  const ps1 = path.join(__dirname, 'setup.ps1');

  // Check if PowerShell is available
  const psCheck = spawnSync('powershell', ['-Command', 'echo ok'], { shell: true, stdio: 'pipe' });
  if (psCheck.status !== 0) {
    console.error(
      '\n❌ PowerShell is required on Windows. It should be pre-installed.\n' +
      '   If you\'re using Git Bash or WSL, run:\n' +
      '   bash scripts/setup.sh\n'
    );
    process.exit(1);
  }

  console.log('\n🪟  Windows detected — running PowerShell setup script...\n');
  const result = run(
    `powershell -ExecutionPolicy Bypass -NoProfile -File "${ps1}"`
  );
  process.exit(result.status ?? 0);

} else {
  console.log('\n🐧  Unix detected — running Bash setup script...\n');

  // Ensure script is executable
  try { execSync('chmod +x scripts/setup.sh', { cwd: root }); } catch {}

  const result = run('bash scripts/setup.sh');
  process.exit(result.status ?? 0);
}
