import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceStatus } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceSearchDto } from './dto/invoice-search.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,

    // On injecte le token de connexion Mongoose
    @InjectConnection()
    private readonly connection: Connection,

    // On injecte le ClientProxy nommé "EVENT_BUS"
    @Inject('EVENT_BUS')
    private readonly eventClient: ClientProxy,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = new this.invoiceModel(dto);
    const created = await invoice.save();
    this.eventClient.emit('InvoiceGenerated', { invoiceId: created.invoiceId });
    return created;
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceModel.find().exec();
  }

  async findOne(id: string): Promise<Invoice> {
    const inv = await this.invoiceModel.findOne({ invoiceId: id }).exec();
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const inv = await this.invoiceModel.findOneAndUpdate(
      { invoiceId: id },
      { status: dto.status },
      { new: true },
    );
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async remove(id: string): Promise<void> {
    const res = await this.invoiceModel.deleteOne({ invoiceId: id }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('Invoice not found');
  }

  async search(filters: InvoiceSearchDto): Promise<Invoice[]> {
    const query: any = {};
    if (filters.status)   query.status = filters.status;
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo)   query.date.$lte = new Date(filters.dateTo);
    }
    return this.invoiceModel.find(query).exec();
  }

  async pay(id: string): Promise<Invoice> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const inv = await this.invoiceModel.findOne({ invoiceId: id }).session(session);
      if (!inv) throw new NotFoundException('Invoice not found');
      if (inv.status !== InvoiceStatus.PENDING)
        throw new ConflictException('Invoice not in PENDING status');

      inv.status = InvoiceStatus.PAID;
      await inv.save({ session });
      // on émet l’événement PaymentSucceeded
      this.eventClient.emit('PaymentSucceeded', { invoiceId: id });
      await session.commitTransaction();
      return inv;
    } catch (err) {
      await session.abortTransaction();
      this.eventClient.emit('PaymentFailed', { invoiceId: id, error: err.message });
      throw err;
    } finally {
      session.endSession();
    }
  }
}
