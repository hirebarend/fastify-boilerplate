import axios from 'axios';
import { faker } from '@faker-js/faker';
import { PaymentIntent } from '../models';

const paymentIntents: Array<PaymentIntent> = [
  {
    address: 'bc1qt7u0qvla785vz2u7whd8vv0rt942ertu5p2sq2',
    amount: 0.00103473,
    callback: null,
    created: new Date().getTime() / 1000,
    id: '',
    metadata: {},
    reference: '',
    status: 'pending',
    updated: new Date().getTime() / 1000,
  },
];

async function createPaymentIntents() {
  // const response = await axios.get<
  //   Array<{
  //     txid: string;
  //     fee: number;
  //     vsize: number;
  //     value: number;
  //   }>
  // >('https://blockstream.info/api/mempool/recent');
  // for (const x of response.data) {
  //   try {
  //     const responseTx = await axios.get<{
  //       txid: string;
  //       version: number;
  //       locktime: number;
  //       vin: Array<{
  //         txid: string;
  //         vout: number;
  //         prevout: {
  //           scriptpubkey: string;
  //           scriptpubkey_asm: string;
  //           scriptpubkey_type: string;
  //           scriptpubkey_address: string;
  //           value: number;
  //         };
  //         scriptsig: string;
  //         scriptsig_asm: string;
  //         witness: [string];
  //         is_coinbase: boolean;
  //         sequence: number;
  //       }>;
  //       vout: Array<{
  //         scriptpubkey: string;
  //         scriptpubkey_asm: string;
  //         scriptpubkey_type: string;
  //         scriptpubkey_address: string;
  //         value: number;
  //       }>;
  //       size: number;
  //       weight: number;
  //       fee: number;
  //       status: {
  //         confirmed: boolean;
  //         block_height: number;
  //         block_hash: string;
  //         block_time: number;
  //       };
  //     }>(`https://blockstream.info/api/tx/${x.txid}`);
  //     for (const y of responseTx.data.vout) {
  //       const paymentIntent: PaymentIntent = {
  //         address: y.scriptpubkey_address,
  //         amount: y.value / 100_000_000,
  //         callback: null,
  //         created: new Date().getTime(),
  //         id: faker.string.alphanumeric({
  //           casing: 'lower',
  //           length: 8,
  //         }),
  //         metadata: {},
  //         reference: faker.string.alphanumeric({
  //           casing: 'lower',
  //           length: 8,
  //         }),
  //         status: 'pending',
  //         updated: new Date().getTime(),
  //       };
  //       paymentIntents.push(paymentIntent);
  //     }
  //   } catch {
  //   } finally {
  //     await new Promise((resolve) => setTimeout(resolve, 750));
  //   }
  // }
}

async function findByAddress(address: string): Promise<PaymentIntent | null> {
  return paymentIntents.find((x) => x.address === address) || null;
}

async function updateStatus(
  id: string,
  status: 'pending' | 'unconfirmed' | 'partially_confirmed' | 'confirmed',
): Promise<PaymentIntent> {
  const paymentIntent: PaymentIntent | undefined = paymentIntents.find(
    (x) => x.id === id,
  );

  if (!paymentIntent) {
    throw new Error();
  }

  paymentIntent.status = status;

  return paymentIntent;
}

export const PaymentIntentService = {
  createPaymentIntents,
  findByAddress,
  updateStatus,
};
