import cluster from 'cluster';
require('dotenv').config();
import * as os from 'os';
import { startServer } from './server';
import { job } from './job';

const regExp: RegExp = new RegExp(/^\-\-([^=]+)=(.+)$/);

for (const arg of process.argv.slice(2)) {
  const regExpExecArray: RegExpExecArray | null = regExp.exec(arg);

  if (!regExpExecArray) {
    throw new Error(`unable to parse argument: ${arg}`);
  }

  process.env[regExpExecArray[1].toUpperCase()] = regExpExecArray[2];
}

if (process.env.JOB) {
  (async () => {
    while (true) {
      await job();

      for (let i = 0; i < 5 * 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  })();
} else {
  if (process.env.CLUSTER) {
    if (cluster.isPrimary) {
      for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
      }
    } else {
      startServer();
    }
  } else {
    startServer();
  }
}