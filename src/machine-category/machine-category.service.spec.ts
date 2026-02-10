import { Test, TestingModule } from '@nestjs/testing';
import { MachineCategoryService } from './machine-category.service';

describe('MachineCategoryService', () => {
  let service: MachineCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MachineCategoryService],
    }).compile();

    service = module.get<MachineCategoryService>(MachineCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
