import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBillDto } from './dto/create-bill.dto/create-bill.dto';
import { Bill, BillingHistory, BillingHistoryDocument } from './billing-history.schema/billing-history.schema';

@Injectable()
export class BillingHistoryService {
  constructor(
    @InjectModel(BillingHistory.name)
    private readonly bhModel: Model<BillingHistoryDocument>,
  ) {}

  async addBill(patientId: string, dto: CreateBillDto): Promise<Bill> {
    const history = await this.bhModel.findOne({ patientId });
    if (!history) throw new NotFoundException('Historique introuvable');

    const bill = {
      ...dto,
      date: new Date(), // Ajouter la date si absente
      _id: new Date().getTime().toString(), // ou utiliser new Types.ObjectId()
    };

    history.bills.push(bill);
    await history.save();

    return bill;
  }

  async getHistory(patientId: string): Promise<BillingHistory> {
    const history = await this.bhModel.findOne({ patientId });
    if (!history) throw new NotFoundException('Historique introuvable');
    return history;
  }

  async getBillById(patientId: string, billId: string): Promise<Bill> {
    const history = await this.bhModel.findOne({ patientId });
    if (!history) throw new NotFoundException('Historique introuvable');

    const bill = history.bills.find((b) => b.invoiceId?.toString() === billId);
    if (!bill) throw new NotFoundException('Facture introuvable');

    return bill;
  }
}
