const { spawn, execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// Colors for terminal output
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

console.log(`${bold}${cyan}====================================================${reset}`);
console.log(`${bold}${cyan}   Anekal Student Directory - Starting Dev Servers  ${reset}`);
console.log(`${bold}${cyan}====================================================${reset}`);
console.log(`${green}Frontend URL:${reset} http://localhost:3000`);
console.log(`${cyan}Backend API:${reset}  http://127.0.0.1:8000`);
console.log(`${cyan}Swagger Docs:${reset} http://127.0.0.1:8000/docs`);
console.log(`${yellow}Press Ctrl + C at any time to stop all servers.${reset}\n`);

const children = [];

function killChild(child) {
  if (!child || child.killed) return;
  const pid = child.pid;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch (e) {}
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch (e) {
      try {
        child.kill('SIGTERM');
      } catch (e2) {}
    }
  }
}

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${yellow}Shutting down development servers...${reset}`);
  for (const child of children) {
    killChild(child);
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  for (const child of children) {
    killChild(child);
  }
});

// Start Backend (FastAPI via Uvicorn)
const backendCmd = 'python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload';
const backendProcess = spawn(backendCmd, {
  cwd: backendDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
});

children.push(backendProcess);

backendProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`${cyan}[BACKEND]${reset} ${line}`);
    }
  }
});

backendProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`${cyan}[BACKEND]${reset} ${line}`);
    }
  }
});

backendProcess.on('error', (err) => {
  console.error(`${red}[BACKEND ERROR]${reset} Failed to start Python/Uvicorn: ${err.message}`);
  console.error(`${yellow}Please ensure Python 3 is installed and run 'pip install -r backend/requirements.txt'.${reset}`);
});

backendProcess.on('close', (code) => {
  if (code !== 0 && code !== null && !isCleaningUp) {
    console.log(`${yellow}[BACKEND] Process stopped (code ${code})${reset}`);
  }
});

// Start Frontend (Next.js)
const frontendCmd = 'npm run dev';
const frontendProcess = spawn(frontendCmd, {
  cwd: frontendDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env },
});

children.push(frontendProcess);

frontendProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`${green}[FRONTEND]${reset} ${line}`);
    }
  }
});

frontendProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`${green}[FRONTEND]${reset} ${line}`);
    }
  }
});

frontendProcess.on('error', (err) => {
  console.error(`${red}[FRONTEND ERROR]${reset} Failed to start Next.js: ${err.message}`);
  console.error(`${yellow}Please ensure Node.js is installed and run 'npm install' inside the frontend folder.${reset}`);
});

frontendProcess.on('close', (code) => {
  if (code !== 0 && code !== null && !isCleaningUp) {
    console.log(`${yellow}[FRONTEND] Process stopped (code ${code})${reset}`);
  }
});
