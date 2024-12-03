import * as fnv from 'fnv-plus';
import * as fs from 'fs';
import * as path from 'path';

export function KeyValueStore(directory: string) {
  return {
    get: (key: string) => {
      const index: number = fnv.fast1a32(key) % 1000;

      const filename: string = path.join(directory, `index-${index}.json`);

      const arr: Array<{ key: string; value: any }> = JSON.parse(
        fs.readFileSync(filename, 'utf-8'),
      );

      const item = arr.find((x) => x.key === key);

      if (!item) {
        return null;
      }

      return item.value;
    },
    set: (key: string, value: any) => {
      const index: number = fnv.fast1a32(key) % 1000;

      const filename: string = path.join(directory, `index-${index}.json`);

      if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, JSON.stringify([{ key, value }]));

        return;
      }

      const arr: Array<{ key: string; value: any }> = JSON.parse(
        fs.readFileSync(filename, 'utf-8'),
      );

      arr.push({
        key,
        value,
      });

      fs.writeFileSync(filename, JSON.stringify(arr));
    },
  };
}
