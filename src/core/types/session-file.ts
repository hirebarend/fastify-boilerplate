export type SessionFile = {
  id: string;

  metadata: {
    columns: Array<string>;

    count: number;
  };

  name: string;

  session: {
    id: string;
  };

  url: string;
};
