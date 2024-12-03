import { BloomFilter } from './bloom-filter';

test('BloomFilter#add', async () => {
  const bloomFilter = BloomFilter(100);

  bloomFilter.add('hello world');
});

test('BloomFilter#check', async () => {
  const bloomFilter = BloomFilter(100);

  bloomFilter.add('hello world');

  const result = bloomFilter.check('hello world');

  expect(result).toBeTruthy();
});
