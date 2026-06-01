#!/usr/bin/env node
/**
 * Start Metro on LAN for a physical device (dev build or Expo Go).
 */
const { execSync, spawn } = require('child_process');
const os = require('os');

function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of ['en0', 'en1', 'wlan0', 'eth0']) {
    const entries = ifaces[name];
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  for (const entries of Object.values(ifaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return null;
}

const useExpoGo = process.argv.includes('--go');

const ip =
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME ||
  (() => {
    try {
      return execSync("ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1", {
        encoding: 'utf8',
      }).trim();
    } catch {
      return getLanIp();
    }
  })();

if (!ip) {
  console.error('Could not detect LAN IP. Set REACT_NATIVE_PACKAGER_HOSTNAME and retry.');
  process.exit(1);
}

const target = useExpoGo ? 'Expo Go' : 'development build';
console.log(`\nMetro (${target}): http://${ip}:8081\n`);
console.log('Phone must be on the same Wi‑Fi as this Mac.\n');
if (!useExpoGo) {
  console.log('If the app shows "No development servers found", tap "Enter URL manually" and paste the URL above.\n');
}

const expoArgs = ['expo', 'start', '--lan', '--clear'];
if (useExpoGo) {
  expoArgs.push('--go');
} else {
  expoArgs.push('--dev-client');
}

const child = spawn('npx', expoArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: ip,
  },
});

child.on('exit', (code) => process.exit(code ?? 0));
