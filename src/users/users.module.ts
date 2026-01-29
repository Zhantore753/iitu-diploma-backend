import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserRepository } from './users.repository';
import { UsersService } from './users.service';
import { BcryptModule } from 'src/bcrypt/bcrypt.module';

@Module({
  imports: [PrismaModule, CacheModule.register(), BcryptModule],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}