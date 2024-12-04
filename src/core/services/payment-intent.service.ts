import * as uuid from 'uuid';
import { PaymentIntent } from '../models';
import { getContainer } from '../container';

async function create(
  address: string,
  amount: number,
  reference: string,
): Promise<PaymentIntent> {
  const container = await getContainer();

  const collection = container.db.collection<PaymentIntent>('payment-intents');

  const paymentIntent: PaymentIntent = {
    address,
    amount,
    callback: null,
    created: new Date().getTime(),
    id: uuid.v4(),
    metadata: {},
    reference,
    status: 'pending',
    updated: new Date().getTime(),
  };

  await collection.insertOne({
    address: paymentIntent.address,
    amount: paymentIntent.amount,
    callback: paymentIntent.callback,
    created: paymentIntent.created,
    id: paymentIntent.id,
    metadata: paymentIntent.metadata,
    reference: paymentIntent.reference,
    status: paymentIntent.status,
    updated: paymentIntent.updated,
  });

  return paymentIntent;
}

async function findByAddress(address: string): Promise<PaymentIntent | null> {
  const container = await getContainer();

  const collection = container.db.collection<PaymentIntent>('payment-intents');

  const document = await collection.findOne(
    {
      address,
    },
    {
      projection: {
        _id: 0,
      },
    },
  );

  return document;
}

async function setStatus(
  id: string,
  status: 'pending' | 'unconfirmed' | 'partially_confirmed' | 'confirmed',
): Promise<PaymentIntent> {
  const container = await getContainer();

  const collection = container.db.collection<PaymentIntent>('payment-intents');

  await collection.updateOne(
    { id },
    {
      $set: {
        status,
      },
    },
  );

  const document = await collection.findOne(
    {
      id,
    },
    {
      projection: {
        _id: 0,
      },
    },
  );

  if (!document) {
    throw new Error();
  }

  return document;
}

export const PaymentIntentService = {
  create,
  findByAddress,
  setStatus,
};
