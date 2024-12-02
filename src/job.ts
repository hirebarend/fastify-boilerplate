import {
  BitcoinBlockStreamService as BitcoinService,
  PaymentIntent,
  PaymentIntentService,
  SimpleBlock,
} from './core';

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
        continue;
      }

      if (paymentIntent.amount !== x.value) {
        // TODO: logging
        console.log(`expected ${paymentIntent.amount}, got ${x.value}`);
        continue;
      }

      const status:
        | 'pending'
        | 'unconfirmed'
        | 'partially_confirmed'
        | 'confirmed' =
        simpleBlock.confirmations >= 6 ? 'confirmed' : 'partially_confirmed';

      if (paymentIntent.status === status) {
        continue;
      }

      await PaymentIntentService.updateStatus(paymentIntent.id, status);
    }
  }
}

export async function job() {
  await PaymentIntentService.createPaymentIntents();

  while (true) {
    const height: number = await BitcoinService.getBlockCount();

    console.log(`height: ${height}`);

    for (let i = height - 4; i <= height; i++) {
      console.log(`i: ${i}`);

      const blockHash = await BitcoinService.getBlockHash(i);

      console.log(`blockHash: ${blockHash}`);

      const simpleBlock: SimpleBlock =
        await BitcoinService.getSimpleBlock(blockHash);

      await handleSimpleBlock(simpleBlock);
    }

    await new Promise((resolve) => setTimeout(resolve, 8 * 60_000));
  }
}
