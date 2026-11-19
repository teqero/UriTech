#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://akyzbuvdokdrjpuzhocg.supabase.co/functions/v1/uritech-api/api/v1';

const env = {
  ...process.env,
  EXPO_USE_METRO_WORKSPACE_ROOT: '1',
  EXPO_NO_DEPENDENCY_VALIDATION: '1',
  EXPO_EXPORT_WEB: '1',
  EXPO_PUBLIC_API_URL: apiUrl,
};

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, env, stdio: 'inherit', shell: true });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

run('npm', ['run', 'build', '--workspace=@uritech/shared'], root);
run('npm', ['run', 'build:web', '--workspace=@uritech/mobile-user'], root);
console.log('[build-mobile-web] OK → apps/mobile-user/dist');