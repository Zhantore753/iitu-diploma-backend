import { Module } from '@nestjs/common';
import { FileModule } from 'src/file/file.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [PrismaModule, FileModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
