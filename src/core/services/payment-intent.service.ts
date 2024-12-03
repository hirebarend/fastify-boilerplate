import * as uuid from 'uuid';
import { PaymentIntent } from '../models';

const paymentIntents: Array<PaymentIntent> = [
  {
    address: 'bc1qt7u0qvla785vz2u7whd8vv0rt942ertu5p2sq2',
    amount: 0.00103473,
    callback: null,
    created: new Date().getTime() / 1000,
    id: uuid.v4(),
    metadata: {},
    reference: uuid.v4(),
    status: 'pending',
    updated: new Date().getTime() / 1000,
  },
];

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
  findByAddress,
  updateStatus,
};
