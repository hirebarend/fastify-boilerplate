import cluster from 'cluster';
require('dotenv').config();
import * as os from 'os';
import { startServer } from './server.js';
import { job } from './job.js';

if (process.env.JOB) {
  job();
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
