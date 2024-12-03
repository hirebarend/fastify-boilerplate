import bip32 from 'bip32';
import * as bip39 from 'bip39';
import bs58check from 'bs58check';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

const bip32Api = bip32(ecc);

function convertExtendedPublicKey(extendedPublicKey: string): string {
  if (extendedPublicKey.startsWith('xpub')) {
    const buffer: Buffer = Buffer.from(bs58check.decode(extendedPublicKey));

    buffer.writeUInt32BE(0x04b24746, 0);

    return bs58check.encode(buffer);
  }

  if (extendedPublicKey.startsWith('zpub')) {
    const buffer: Buffer = Buffer.from(bs58check.decode(extendedPublicKey));

    buffer.writeUInt32BE(0x0488b21e, 0);

    return bs58check.encode(buffer);
  }

  throw new Error();
}

export function generateMnemonic(): string {
  return bip39.generateMnemonic(12);
}

export function getAddressFromExtendedPublicKey(
  extendedPublicKey: string,
  index: number,
): string {
  const bip32Interface = bip32Api.fromBase58(
    convertExtendedPublicKey(extendedPublicKey),
  );

  const publicKey = bip32Interface.derive(index).publicKey;

  const payment = bitcoin.payments.p2wpkh({
    pubkey: publicKey,
    network: bitcoin.networks.bitcoin,
  });

  if (!payment.address) {
    throw new Error();
  }

  return payment.address;
}

export function getExtendedPublicKeyFromMnemonic(str: string): string {
  const buffer: Buffer = bip39.mnemonicToSeedSync(str);

  const bip32Interface = bip32Api
    .fromSeed(buffer)
    .derivePath(`m/84'/0'/0'/0`)
    .neutered();

  return convertExtendedPublicKey(bip32Interface.toBase58());
}
