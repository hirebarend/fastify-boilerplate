export function cache<T>(fn: (...args: Array<any>) => Promise<T>) {
  const map: { [key: string]: T | undefined } = {};

  return async (...args: Array<any>) => {
    const key: string = JSON.stringify(args);

    if (map[key]) {
      return map[key];
    }

    const result = await fn(...args);

    map[key] = result;

    return result;
  };
}
