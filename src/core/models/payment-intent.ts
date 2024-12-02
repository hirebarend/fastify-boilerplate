export type PaymentIntent = {
  address: string;

  amount: number;

  callback: string | null;

  created: number;

  id: string;

  metadata: { [key: string]: string };

  reference: string;

  status: 'pending' | 'unconfirmed' | 'partially_confirmed' | 'confirmed';

  updated: number;
};
