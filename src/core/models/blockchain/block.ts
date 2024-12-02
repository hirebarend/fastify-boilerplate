import { Transaction } from './transaction';

export type Block = {
  hash: string;
  confirmations: number;
  size: number;
  strippedsize: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: Array<Transaction>;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: number;
  nTx: number;
  previousblockhash: string;
  nextblockhash: string;
};
