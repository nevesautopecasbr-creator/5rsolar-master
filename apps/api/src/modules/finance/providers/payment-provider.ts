export type ChargeRequest = {
  receivableId: string;
  amount: number;
  method: "BOLETO" | "PIX";
};

export type ChargeResponse = {
  provider: string;
  reference: string;
  url: string;
};

export const PAYMENT_PROVIDER = "PAYMENT_PROVIDER";

export interface PaymentProvider {
  createCharge(input: ChargeRequest): Promise<ChargeResponse>;
}
