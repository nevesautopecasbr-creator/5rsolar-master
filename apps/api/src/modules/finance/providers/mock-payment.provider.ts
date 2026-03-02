import {
  BoletoResponse,
  PaymentProvider,
  PixResponse,
} from "./payment-provider.interface";

export class MockPaymentProvider implements PaymentProvider {
  async createBoleto(input: {
    amount: number;
    dueDate: string;
    payerName: string;
  }): Promise<BoletoResponse> {
    return {
      barcode: "34191.79001 01043.510047 91020.150008 9 90000000010000",
      line: "34199.99999 99999.999999 99999.999999 9 99990000001000",
      amount: input.amount,
      dueDate: input.dueDate,
    };
  }

  async createPix(input: {
    amount: number;
    payerName: string;
    expiresAt?: string;
  }): Promise<PixResponse> {
    return {
      payload: `00020126360014BR.GOV.BCB.PIX0114+5511999999995204000053039865405${input.amount.toFixed(
        2,
      )}5802BR5920${input.payerName}6009SAO PAULO62070503***6304ABCD`,
      qrCode: "data:image/png;base64,MOCK_QR_CODE",
      amount: input.amount,
      expiresAt: input.expiresAt ?? new Date(Date.now() + 3600_000).toISOString(),
    };
  }
}
