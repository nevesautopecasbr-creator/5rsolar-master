import { ChargeRequest, ChargeResponse, PaymentProvider } from "./payment-provider";

export class MockPaymentProvider implements PaymentProvider {
  async createCharge(input: ChargeRequest): Promise<ChargeResponse> {
    return {
      provider: "mock",
      reference: `${input.method}-${input.receivableId}-${Date.now()}`,
      url: `https://pay.mock.local/${input.method.toLowerCase()}/${input.receivableId}`,
    };
  }
}
