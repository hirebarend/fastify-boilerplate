export type SimpleTransaction = {
  // in_active_chain: boolean;
  // hex: string;
  txid: string;
  // hash: string;
  // size: number;
  // vsize: number;
  // weight: number;
  // version: number;
  // locktime: number;
  // vin: Array<{
  //   txid: string;
  //   vout: number;
  //   scriptSig: {
  //     asm: string;
  //     hex: string;
  //   };
  //   sequence: number;
  //   txinwitness: Array<string>;
  // }>;
  vout: Array<{
    value: number;
    // n: number;
    scriptPubKey: {
      // asm: string;
      // hex: string;
      // reqSigs: number;
      // type: string;
      address: string;
      // addresses: Array<string>;
    };
  }>;
  // blockhash: string;
  // confirmations: number;
  // blocktime: number;
  // time: number;
};
