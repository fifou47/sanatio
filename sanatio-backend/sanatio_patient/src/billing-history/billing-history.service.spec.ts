import { Test, TestingModule } from '@nestjs/testing';
import { BillingHistoryService } from './billing-history.service';

describe('BillingHistoryService', () => {
  let service: BillingHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingHistoryService],
    }).compile();

    service = module.get<BillingHistoryService>(BillingHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
