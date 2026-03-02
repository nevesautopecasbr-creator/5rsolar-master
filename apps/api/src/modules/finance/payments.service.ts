import { Injectable } from "@nestjs/common";
import { MockPaymentProvider } from "./providers/mock-payment.provider";
import { CreateBoletoDto } from "./dto/create-boleto.dto";
import { CreatePixDto } from "./dto/create-pix.dto";

@Injectable()
export class PaymentsService {
  private readonly provider = new MockPaymentProvider();

  createBoleto(dto: CreateBoletoDto) {
    return this.provider.createBoleto(dto);
  }

  createPix(dto: CreatePixDto) {
    return this.provider.createPix(dto);
  }
}
