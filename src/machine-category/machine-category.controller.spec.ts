import { Test, TestingModule } from '@nestjs/testing';
import { MachineCategoryController } from './machine-category.controller';

describe('MachineCategoryController', () => {
  let controller: MachineCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachineCategoryController],
    }).compile();

    controller = module.get<MachineCategoryController>(MachineCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
