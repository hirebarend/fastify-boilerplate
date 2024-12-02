import axios from 'axios';
import * as bitcore from 'bitcore-lib';
import { Block, SimpleBlock } from '../models';

const ip: string = '46.101.166.63';

async function getBlock(blockHash: string): Promise<Block> {
  const response = await axios.post<{
    id: number;
    jsonrpc: string;
    result: Block;
  }>(
    `http://${ip}:8332`,
    {
      method: 'getblock',
      params: [blockHash, 2],
      id: Math.floor(Math.random() * 1_000_000),
      jsonrpc: '2.0',
    },
    {
      auth: {
        password: 'password',
        username: 'username',
      },
    },
  );

  return response.data.result;
}

async function getBlockCount(): Promise<number> {
  const response = await axios.post<{
    id: number;
    jsonrpc: string;
    result: number;
  }>(
    `http://${ip}:8332`,
    {
      method: 'getblockcount',
      params: [],
      id: Math.floor(Math.random() * 1_000_000),
      jsonrpc: '2.0',
    },
    {
      auth: {
        password: 'password',
        username: 'username',
      },
    },
  );

  return response.data.result;
}

async function getBlockHash(height: number): Promise<string> {
  const response = await axios.post<{
    id: number;
    jsonrpc: string;
    result: string;
  }>(
    `http://${ip}:8332`,
    {
      method: 'getblockhash',
      params: [height],
      id: Math.floor(Math.random() * 1_000_000),
      jsonrpc: '2.0',
    },
    {
      auth: {
        password: 'password',
        username: 'username',
      },
    },
  );

  return response.data.result;
}

async function getSimpleBlock(blockHash: string): Promise<SimpleBlock> {
  const height: number = await getBlockCount();

  const response = await axios.get(
    `https://blockstream.info/api/block/${blockHash}/raw`,
    {
      responseType: 'arraybuffer',
    },
  );

  const block = new bitcore.Block(response.data);

  return {
    confirmations: 6, // TODO
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

export const BitcoinService = {
  getBlock,
  getBlockCount,
  getBlockHash,
  getSimpleBlock,
};
