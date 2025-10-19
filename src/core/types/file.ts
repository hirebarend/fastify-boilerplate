export type File = {
  contentType: string;

  hash: string;

  id: string;

  metadata: {
    columns: Array<string>;

    count: number;
  };

  name: string;

  session: {
    id: string;
  };

  size: number;

  url: string;
};
