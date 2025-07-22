import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly eventClient: ClientProxy,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const payment = new this.paymentModel({
      ...dto,
      status: PaymentStatus.SUCCESS,
    });
    const saved = await payment.save();
    this.eventClient.emit('PaymentSucceeded', { paymentId: saved.paymentId, invoiceId: dto.invoiceId });
    return saved;
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find().exec();
  }

  async findOne(id: string): Promise<Payment> {
    const pay = await this.paymentModel.findOne({ paymentId: id }).exec();
    if (!pay) throw new NotFoundException('Payment not found');
    return pay;
  }
}
