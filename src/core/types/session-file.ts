export type SessionFile = {
  created: number;

  deleted: boolean;

  id: string;

  metadata: {
    columns: Array<string>;

    count: number;
  };

  name: string;

  session: {
    id: string;
  };

  updated: number;

  url: string;
};
