import { Test, TestingModule } from '@nestjs/testing';
import { BillingHistoryController } from './billing-history.controller';

describe('BillingHistoryController', () => {
  let controller: BillingHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingHistoryController],
    }).compile();

    controller = module.get<BillingHistoryController>(BillingHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
