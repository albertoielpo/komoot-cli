#!/usr/bin/env node
'use strict';

// Exit quietly instead of crashing with an unhandled EPIPE when stdout is
// piped into something that closes early (e.g. `komoot-cli ... | head`).
for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (err) => {
    if (err.code === 'EPIPE') {
      process.exit(0);
    }
    throw err;
  });
}

require('../dist/index.js').run(process.argv);
