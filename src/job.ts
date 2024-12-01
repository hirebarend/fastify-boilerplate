import moment = require('moment');
import { Container, disposeContainer, getContainer } from './core';
import { BitcoinService } from './core/services/bitcoin.service';

const ip: string = '46.101.166.63';

let sum: number = 0;
let count: number = 0;

function arrayToChunks<T>(arr: Array<T>, n: number): Array<Array<T>> {
  const result = [];

  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }

  return result;
}

async function handleTransaction(
  txId: string,
  block: {
    hash: string;
    confirmations: number;
    height: number;
    version: number;
    versionHex: string;
    merkleroot: string;
    time: number;
    mediantime: number;
    nonce: number;
    bits: string;
    difficulty: number;
    chainwork: string;
    nTx: number;
    previousblockhash: string;
    strippedsize: number;
    size: number;
    weight: number;
    tx: Array<string>;
  },
) {
  const timestamp1: number = new Date().getTime();

  const transaction = await BitcoinService.getRawTransaction(
    ip,
    txId,
    block.hash,
  );

  const timestamp2: number = new Date().getTime();

  sum += timestamp2 - timestamp1;
  count += 1;

  console.log(sum / count);

  if (transaction.vin.find((x) => x.coinbase)) {
    return;
  }

  for (const x of transaction.vout) {
    if (!x.scriptPubKey.address) {
      continue;
    }

    const obj = {
      address: x.scriptPubKey.address,
      blockHash: block.hash,
      confirmations: block.confirmations,
      n: x.n,
      timestamp: block.time,
      transactionId: transaction.txid,
      value: x.value,
    };

    // console.log(
    //   `${obj.value} to ${obj.address} on ${moment(obj.timestamp * 1000).format('LLL')}`,
    // );
  }
}

export async function job() {
  // const container: Container = await getContainer();

  const startHeight: number = 694937;

  // const startHeight: number = await BitcoinService.getBlockCount(ip);

  const height: number = await BitcoinService.getBlockCount(ip);

  console.log(`height: ${height}`);

  for (let i = startHeight + 1; i < height; i++) {
    const blockHash = await BitcoinService.getBlockHash(ip, height);

    const block = await BitcoinService.getBlock(ip, blockHash);

    for (const txId of block.tx) {
      await handleTransaction(txId, block);
    }
  }

  await disposeContainer();
}
