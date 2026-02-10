import { Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { RegionRepository } from './region.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [RegionService, RegionRepository, PrismaService],
  controllers: [RegionController]
})
export class RegionModule {}
