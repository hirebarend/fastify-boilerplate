import {
  getAddressFromExtendedPublicKey,
  getExtendedPublicKeyFromMnemonic,
} from './bitcoin';

test('#getAddressFromExtendedPublicKey', async () => {
  const extendedPublicKey: string = getExtendedPublicKeyFromMnemonic(
    'dad car hollow unfold puppy peanut shadow rich kind young police axis',
  );

  const result = getAddressFromExtendedPublicKey(extendedPublicKey, 0);

  expect(result).toBe('bc1q0vje60r2nzx8kqk8x7f0ug98jv3esarj4a9ngv');
});

test('#getExtendedPublicKeyFromMnemonic', async () => {
  const result = getExtendedPublicKeyFromMnemonic(
    'dad car hollow unfold puppy peanut shadow rich kind young police axis',
  );

  expect(result).toBe(
    'zpub6sSyenTGhcK9rFUPvhBR7tSt1yaKebwpMhKnhD3Hspyy5YNoHiLMzLPtLnLaNkR1gGBycZPe83zZGR9rwLqmVrbx6MaeTtEgGVqwJQnvKi6',
  );
});
