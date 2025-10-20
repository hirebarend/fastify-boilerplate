export type Query = {
  contentType: string;

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

  url: string;
};
