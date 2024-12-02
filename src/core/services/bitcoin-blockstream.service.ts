import axios from 'axios';
import * as bitcore from 'bitcore-lib';
import { Block, SimpleBlock } from '../models';

async function getBlock(blockHash: string): Promise<Block> {
  throw new Error('not implemented yet!');
}

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

// TODO: add caching
async function getSimpleBlock(blockHash: string): Promise<SimpleBlock> {
  const height: number = await getBlockCount();

  const responseBlock = await axios.get<{ height: number }>(
    `https://blockstream.info/api/block/${blockHash}`,
  );

  const responseBlockRaw = await axios.get(
    `https://blockstream.info/api/block/${blockHash}/raw`,
    {
      responseType: 'arraybuffer',
    },
  );

  const block = new bitcore.Block(responseBlockRaw.data);

  return {
    confirmations: height - responseBlock.data.height,
    tx: block.transactions.map((x) => {
      return {
        txid: x.id,
        vout: x.outputs.map((y) => {
          return {
            value: y.satoshis / 100_000_000,
            scriptPubKey: {
              address: y.script.toAddress().toString(),
            },
          };
        }),
      };
    }),
  };
}

export const BitcoinBlockStreamService = {
  getBlock,
  getBlockCount,
  getBlockHash,
  getSimpleBlock,
};
