import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MachineModule } from 'src/machine/machine.module';

@Module({
  imports: [PrismaModule, MachineModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
