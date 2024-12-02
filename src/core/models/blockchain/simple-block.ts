import { SimpleTransaction } from './simple-transaction';
import { Transaction } from './transaction';

export type SimpleBlock = {
  //   hash: string;
    confirmations: number;
  //   size: number;
  //   strippedsize: number;
  //   weight: number;
  //   height: number;
  //   version: number;
  //   versionHex: string;
  //   merkleroot: string;
  tx: Array<SimpleTransaction>;
  //   time: number;
  //   mediantime: number;
  //   nonce: number;
  //   bits: string;
  //   difficulty: number;
  //   chainwork: number;
  //   nTx: number;
  //   previousblockhash: string;
  //   nextblockhash: string;
};
