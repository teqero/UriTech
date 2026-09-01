#!/usr/bin/env node

const { spawn } = require('node:child_process');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/expo-start.js <expo-args...>');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'expo';
const spawnArgs = isWindows ? ['/d', '/s', '/c', ['expo', ...args].map(quoteForCmd).join(' ')] : args;

const child = spawn(command, spawnArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_NO_DEPENDENCY_VALIDATION: '1',
  },
});

function quoteForCmd(value) {
  if (!value) {
    return '""';
  }

  if (!/[\s"&^<>|()]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
