import {
  BlockchainService,
  PaymentIntent,
  PaymentIntentService,
  Transaction,
} from './core';
import { logger } from './logger';

async function handleTransactions(transactions: Array<Transaction>) {
  for (const transaction of transactions) {
    let paymentIntent: PaymentIntent | null =
      await PaymentIntentService.findByAddress(transaction.to);

    if (!paymentIntent) {
      continue;
    }

    if (paymentIntent.status === 'confirmed') {
      logger.info(`payment intent status is already confirmed`);

      continue;
    }

    if (paymentIntent.amount !== transaction.value) {
      continue;
    }

    if (paymentIntent.status === transaction.status) {
      logger.verbose(`payment intent status remains unchanged`);

      continue;
    }

    paymentIntent = await PaymentIntentService.updateStatus(
      paymentIntent.id,
      transaction.status,
    );

    logger.info(`payment intent status changed to ${paymentIntent.status}`);
  }
}

export async function job() {
  await PaymentIntentService.createPaymentIntents();

  while (true) {
    let height: number = await BlockchainService.getBlockCount();

    height = 872451 + 1;

    for (let i = height - 4; i <= height; i++) {
      const blockHash = await BlockchainService.getBlockHash(i);

      const transactions =
        await BlockchainService.getTransactionFromBlockHash(blockHash);

      await handleTransactions(transactions);
    }

    await new Promise((resolve) => setTimeout(resolve, 8 * 60_000));
  }
}
