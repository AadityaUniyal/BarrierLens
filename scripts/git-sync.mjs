import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const dir = path.resolve('.');

  // 1. Stage modified and new files
  const matrix = await git.statusMatrix({ fs, dir });
  const toAdd = [];
  const toRemove = [];

  for (const [filepath, head, workdir, stage] of matrix) {
    if (filepath.startsWith('.git') || filepath.startsWith('node_modules')) continue;

    // file modified or created
    if (workdir === 2 && head !== 2) {
      toAdd.push(filepath);
    } else if (workdir === 0 && head === 1) {
      toRemove.push(filepath);
    } else if (workdir === 2 && stage !== 2) {
      toAdd.push(filepath);
    }
  }

  console.log(`[Git Sync] Staging ${toAdd.length} files...`);
  for (const file of toAdd) {
    await git.add({ fs, dir, filepath: file });
  }

  for (const file of toRemove) {
    await git.remove({ fs, dir, filepath: file });
  }

  // 2. Commit
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Aaditya Uniyal',
      email: 'aadityauniyal@users.noreply.github.com'
    },
    message: process.argv[2] || 'feat(websites-journeys): implement real neon persistence for websites and journeys with interactive journey architect'
  });

  console.log(`[Git Sync] Committed successfully: ${sha}`);

  // 3. Push if token available
  const token = process.env.GH_PUSH_TOKEN;
  if (token) {
    console.log('[Git Sync] Pushing to origin/main with retrieved GitHub token...');
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: token, password: '' }),
    });
    console.log('[Git Sync] Push result:', pushResult);
    console.log('[Git Sync] Successfully pushed to https://github.com/AadityaUniyal/BarrierLens.git!');
  } else {
    console.log('[Git Sync] Ready to push. GH_PUSH_TOKEN not supplied.');
  }
}

main().catch(console.error);
