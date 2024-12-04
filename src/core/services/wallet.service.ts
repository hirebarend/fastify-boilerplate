import * as uuid from 'uuid';
import {
  generateMnemonic,
  getAddressFromExtendedPublicKey,
  getExtendedPublicKeyFromMnemonic,
} from '../functions';
import { Wallet } from '../models';
import { getContainer } from '../container';

function build(
  name: string,
  extendedPublicKey: string | null = null,
  index: number = 0,
): Wallet {
  if (!extendedPublicKey) {
    const mnemonic: string = generateMnemonic();

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
  const container = await getContainer();

  const collection = container.db.collection<Wallet>('wallets');

  const wallet: Wallet = build(name, extendedPublicKey, index);

  await collection.insertOne({
    address: wallet.address,
    extendedPublicKey: wallet.extendedPublicKey,
    id: wallet.id,
    index: wallet.index,
    mnemonic: wallet.mnemonic,
    name: wallet.name,
  });

  return wallet;
}

async function findByAddress(address: string): Promise<Wallet | null> {
  const container = await getContainer();

  const collection = container.db.collection<Wallet>('wallets');

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

export const WalletService = {
  create,
  findByAddress,
};
