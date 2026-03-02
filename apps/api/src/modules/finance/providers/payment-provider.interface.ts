export type BoletoResponse = {
  barcode: string;
  line: string;
  amount: number;
  dueDate: string;
};

export type PixResponse = {
  payload: string;
  qrCode: string;
  amount: number;
  expiresAt: string;
};

export interface PaymentProvider {
  createBoleto(input: {
    amount: number;
    dueDate: string;
    payerName: string;
  }): Promise<BoletoResponse>;
  createPix(input: {
    amount: number;
    payerName: string;
    expiresAt?: string;
  }): Promise<PixResponse>;
}
