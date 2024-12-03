import * as fnv from 'fnv-plus';

export function BloomFilter(size: number) {
  const arr = new Array(size).fill(0);

  return {
    add: (str: string) => {
      const index: number = fnv.fast1a32(str);

      arr[index % size] = 1;
    },
    check: (str: string) => {
      const index: number = fnv.fast1a32(str);

      return arr[index % size] === 1;
    },
  };
}
