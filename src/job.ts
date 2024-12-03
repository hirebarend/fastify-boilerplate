import {
  BitcoinBlockStreamService as BitcoinService,
  PaymentIntent,
  PaymentIntentService,
  SimpleBlock,
} from './core';
import { logger } from './logger';

async function handleSimpleBlock(simpleBlock: SimpleBlock) {
  for (const transaction of simpleBlock.tx) {
    for (const x of transaction.vout) {
      if (!x.scriptPubKey.address) {
        continue;
      }

      const paymentIntent: PaymentIntent | null =
        await PaymentIntentService.findByAddress(x.scriptPubKey.address);

      if (!paymentIntent) {
        continue;
      }

      if (paymentIntent.status === 'confirmed') {
        logger.info(`payment intent status is already confirmed`);

        continue;
      }

      if (paymentIntent.amount !== x.value) {
        continue;
      }

      const status:
        | 'pending'
        | 'unconfirmed'
        | 'partially_confirmed'
        | 'confirmed' =
        simpleBlock.confirmations >= 6 ? 'confirmed' : 'partially_confirmed';

      if (paymentIntent.status === status) {
        logger.verbose(`payment intent status remains unchanged`);

        continue;
      }

      await PaymentIntentService.updateStatus(paymentIntent.id, status);

      logger.info(
        `payment intent status changed from ${paymentIntent.status} to ${status}`,
      );
    }
  }
}

export async function job() {
  await PaymentIntentService.createPaymentIntents();

  while (true) {
    const height: number = await BitcoinService.getBlockCount();

    for (let i = height - 4; i <= height; i++) {
      const blockHash = await BitcoinService.getBlockHash(i);

      const simpleBlock: SimpleBlock =
        await BitcoinService.getSimpleBlock(blockHash);

      await handleSimpleBlock(simpleBlock);
    }

    await new Promise((resolve) => setTimeout(resolve, 8 * 60_000));
  }
}
