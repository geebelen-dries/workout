#!/usr/bin/env node
/**
 * Start Metro for Expo Go on a physical device (LAN IP, not 127.0.0.1).
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

const ip =
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME ||
  (() => {
    try {
      return execSync("ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1", {
        encoding: "utf8",
      }).trim();
    } catch {
      return getLanIp();
    }
  })();

if (!ip) {
  console.error("Could not detect LAN IP. Set REACT_NATIVE_PACKAGER_HOSTNAME and retry.");
  process.exit(1);
}

console.log(`\nExpo Go URL: exp://${ip}:8081\n`);
console.log(`(iPhone must be on the same Wi‑Fi as this Mac)\n`);

const child = spawn(
  "npx",
  ["expo", "start", "--lan", "--clear", "--go"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      REACT_NATIVE_PACKAGER_HOSTNAME: ip,
    },
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
