import { Module } from '@nestjs/common';
import { RentalController } from './rental.controller';
import { RentalRepository } from './rental.repository';
import { IRentalRepository } from './rental.repository.interface';
import { RentalService } from './rental.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    RentalService,
    {
      provide: IRentalRepository,
      useClass: RentalRepository,
    },
  ],
  controllers: [RentalController],
})
export class RentalModule {}
