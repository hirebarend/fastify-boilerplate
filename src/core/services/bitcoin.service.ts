import axios from 'axios';

async function getBlock(
  ip: string,
  blockHash: string,
): Promise<{
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
}> {
  const response = await axios.post<{
    id: number;
    jsonrpc: string;
    result: any;
  }>(
    `http://${ip}:8332`,
    {
      method: 'getblock',
      params: [blockHash],
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

async function getBlockCount(ip: string): Promise<number> {
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

async function getBlockHash(ip: string, height: number): Promise<string> {
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

async function getRawTransaction(
  ip: string,
  txid: string,
  blockhash: string,
): Promise<{
  in_active_chain: boolean;
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Array<{
    coinbase: string;
    txinwitness: any;
    sequence: number;
  }>;
  vout: Array<{
    value: number;
    n: number;
    scriptPubKey: {
      asm: string;
      desc: string;
      hex: string;
      address: string | undefined;
      type: string;
    };
  }>;
  hex: string;
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
}> {
  const response = await axios.post<{
    id: number;
    jsonrpc: string;
    result: any;
  }>(
    `http://${ip}:8332`,
    {
      method: 'getrawtransaction',
      params: [txid, true, blockhash],
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

export const BitcoinService = {
  getBlock,
  getBlockCount,
  getBlockHash,
  getRawTransaction,
};
