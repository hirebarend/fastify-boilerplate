export type Query = {
  contentType: string;

  created: number;

  hash: string;

  id: string;

  metadata: {
    columns: Array<string>;

    count: number;

    elapsed: number;

    prompt?: string;
  };

  name: string;

  query: string;

  session: {
    id: string;
  };

  size: number;

  rows: Array<Array<any>>;

  updated: number;

  url: string;
};
