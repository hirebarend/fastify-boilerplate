import {
  BlockchainService,
  getContainer,
  PaymentIntent,
  PaymentIntentService,
  Transaction,
} from './core';
import { logger } from './logger';

async function handleTransactions(
  transactions: Array<Transaction>,
): Promise<void> {
  for (const transaction of transactions) {
    await handleTransaction(transaction);

    await new Promise((resolve) => setTimeout(resolve, 75));
  }
}

async function handleTransaction(transaction: Transaction): Promise<void> {
  let paymentIntent: PaymentIntent | null =
    await PaymentIntentService.findByAddress(transaction.to);

  if (!paymentIntent) {
    return;
  }

  if (paymentIntent.status === 'confirmed') {
    logger.info(`payment intent status is already confirmed`);

    return;
  }

  if (paymentIntent.amount !== transaction.value) {
    return;
  }

  if (paymentIntent.status === transaction.status) {
    logger.verbose(`payment intent status remains unchanged`);

    return;
  }

  paymentIntent = await PaymentIntentService.setStatus(
    paymentIntent.id,
    transaction.status,
  );

  logger.info(`payment intent status changed to ${paymentIntent.status}`);
}

export async function job() {
  const container = await getContainer();

  const collection = container.db.collection<{ hash: string }>('blocks');

  while (true) {
    let height: number = await BlockchainService.getBlockCount();

    for (let i = height - 3; i <= height; i++) {
      const blockHash = await BlockchainService.getBlockHash(i);

      if (await collection.findOne({ hash: blockHash })) {
        continue;
      }

      const transactions =
        await BlockchainService.getTransactionFromBlockHash(blockHash);

      await handleTransactions(transactions);

      await collection.insertOne({ hash: blockHash });
    }

    await new Promise((resolve) => setTimeout(resolve, 8 * 60_000));
  }
}
