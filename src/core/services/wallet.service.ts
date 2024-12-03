import * as uuid from 'uuid';
import {
  generateMnemonic,
  getAddressFromExtendedPublicKey,
  getExtendedPublicKeyFromMnemonic,
  KeyValueStore,
} from '../functions';
import { Wallet } from '../models';

const keyValueStore = KeyValueStore('data');

// createWallets();

function createWallets(): void {
  const numberOfWallets: number = 5_000;
  const numberOfSubWallets: number = 50;

  for (let i = 0; i < numberOfWallets; i++) {
    const wallet: Wallet = build(`wallet-${i}-${0}`);

    keyValueStore.set(wallet.address, wallet);

    for (let index = 1; index < numberOfSubWallets; index++) {
      const subWallet: Wallet = build(
        `wallet-${i}-${index}`,
        wallet.extendedPublicKey,
        index,
      );

      keyValueStore.set(subWallet.address, subWallet);
    }
  }
}

function build(
  name: string,
  extendedPublicKey: string | null = null,
  index: number = 0,
): Wallet {
  if (!extendedPublicKey) {
    const mnemonic = generateMnemonic();

    extendedPublicKey = getExtendedPublicKeyFromMnemonic(mnemonic);

    const wallet: Wallet = {
      address: getAddressFromExtendedPublicKey(extendedPublicKey, index),
      extendedPublicKey,
      id: uuid.v4(),
      index,
      mnemonic,
      name,
    };

    return wallet;
  }

  const wallet: Wallet = {
    address: getAddressFromExtendedPublicKey(extendedPublicKey, index),
    extendedPublicKey,
    id: uuid.v4(),
    index,
    mnemonic: null,
    name,
  };

  return wallet;
}

async function create(
  name: string,
  extendedPublicKey: string | null = null,
  index: number = 0,
): Promise<Wallet> {
  const wallet: Wallet = build(name, extendedPublicKey, index);

  // TODO

  return wallet;
}

async function findByAddress(address: string): Promise<Wallet | null> {
  return keyValueStore.get(address);
}

export const WalletService = {
  build,
  create,
  findByAddress,
};
