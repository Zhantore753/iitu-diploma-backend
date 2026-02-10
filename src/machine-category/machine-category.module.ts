import { Module } from '@nestjs/common';
import { MachineCategoryService } from './machine-category.service';
import { MachineCategoryController } from './machine-category.controller';
import { MachineCategoryRepository } from './machine-category.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [MachineCategoryService, MachineCategoryRepository, PrismaService],
  controllers: [MachineCategoryController]
})
export class MachineCategoryModule {}
