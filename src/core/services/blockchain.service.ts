import axios from 'axios';
import * as bitcore from 'bitcore-lib';
import { cache } from '../functions';
import { Transaction } from '../models';

const axiosGet = cache(axios.get);

async function getBlockCount(): Promise<number> {
  const response = await axios.get<number>(
    `https://blockstream.info/api/blocks/tip/height`,
  );

  return response.data;
}

async function getBlockHash(height: number): Promise<string> {
  const response = await axios.get<string>(
    `https://blockstream.info/api/block-height/${height}`,
  );

  return response.data;
}

async function getTransactionFromBlockHash(
  blockHash: string,
): Promise<Array<Transaction>> {
  const height: number = await getBlockCount();

  const responseBlock = await axiosGet(
    `https://blockstream.info/api/block/${blockHash}`,
  );

  const confirmations: number = height - responseBlock.data.height;

  const responseBlockRaw = await axiosGet(
    `https://blockstream.info/api/block/${blockHash}/raw`,
    {
      responseType: 'arraybuffer',
    },
  );

  const block = new bitcore.Block(responseBlockRaw.data);

  return block.transactions
    .map((transaction) => {
      return transaction.outputs.map((output, index: number) => {
        return {
          from: transaction.inputs
            .filter((x) => x.script)
            .map((x) => x.script.toAddress().toString()),
          id: `${transaction.id}_${index}`,
          status: confirmations >= 6 ? 'confirmed' : 'partially_confirmed',
          timestamp: block.header.time,
          to: output.script.toAddress().toString(),
          value: output.satoshis / 100_000_000,
        } as Transaction;
      });
    })
    .reduce((a, b) => a.concat(b));
}

export const BlockchainService = {
  getBlockCount,
  getBlockHash,
  getTransactionFromBlockHash,
};
