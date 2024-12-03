export type Transaction = {
  from: Array<string>;

  id: string;

  status: 'pending' | 'unconfirmed' | 'partially_confirmed' | 'confirmed';

  timestamp: number;

  to: string;

  value: number;
};
