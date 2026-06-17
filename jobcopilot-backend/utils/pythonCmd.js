
const { execSync } = require('child_process');

function getPythonCmd() {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return 'python3';
  } catch {
    try {
      execSync('python --version', { stdio: 'ignore' });
      return 'python';
    } catch {
      throw new Error('Python not found on system');
    }
  }
}

module.exports = { getPythonCmd };
