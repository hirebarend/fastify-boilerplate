import * as uuid from 'uuid';
import {
  generateMnemonic,
  getAddressFromExtendedPublicKey,
  getExtendedPublicKeyFromMnemonic,
} from '../functions';
import { Wallet } from '../models';

const wallets = createWallets();

function createWallets(): Array<Wallet> {
  const numberOfWallets: number = 5_000;
  const numberOfSubWallets: number = 100;

  const wallets: Array<Wallet> = [];

  for (let i = 0; i < numberOfWallets; i++) {
    for (let index = 1; index < numberOfSubWallets; index++) {
      wallets.push(build(`wallet-${i}-${index}`, null, index));
    }
  }

  return wallets;
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
  return wallets.find((x) => x.address === address) || null;
}

export const WalletService = {
  build,
  create,
  findByAddress,
};
