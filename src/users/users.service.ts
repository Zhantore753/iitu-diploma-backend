import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'generated/prisma';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserRepository } from './users.repository';
import { BcryptService } from '../bcrypt/bcrypt.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly bcryptService: BcryptService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;
    
    try {
      const cached = await this.cacheManager.get<User>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user email: ${email}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache error for key ${cacheKey}: ${error.message}`);
    }

    const user = await this.userRepo.findByEmail(email);
    
    if (user) {
      try {
        await Promise.all([
          this.cacheManager.set(cacheKey, user, this.configService.get('CACHE_TTL') || 30000),
          this.cacheManager.set(this.getCacheKey(user.id), user, this.configService.get('CACHE_TTL') || 30000),
        ]);
      } catch (error) {
        this.logger.warn(`Failed to cache user ${user.id}: ${error.message}`);
      }
    }
    
    return user;
  }

  async findById(id: number): Promise<User | null> {
    const cacheKey = this.getCacheKey(id);

    try {
      const cached = await this.cacheManager.get<User>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user id: ${id}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache error for key ${cacheKey}: ${error.message}`);
    }

    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    try {
      await Promise.all([
        this.cacheManager.set(cacheKey, user, this.configService.get('CACHE_TTL') || 30000),
        this.cacheManager.set(`user:email:${user.email}`, user, this.configService.get('CACHE_TTL') || 30000),
      ]);
    } catch (error) {
      this.logger.warn(`Failed to cache user ${id}: ${error.message}`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Хешируем пароль перед созданием
      const hashedPassword = await this.bcryptService.hash(createUserDto.password);
      const userData = {
        ...createUserDto,
        password: hashedPassword,
      };
      
      const user = await this.userRepo.create(userData);
      
      // Инвалидируем связанные кэши
      await this.invalidateUserCache(user.id);
      
      return user;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async update(id: number, updateData: UpdateUserDto): Promise<User> {
    try {
      // Получаем текущего пользователя для инвалидации кэша по email
      const currentUser = await this.userRepo.findById(id);
      if (!currentUser) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      const user = await this.userRepo.update(id, updateData);
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      // Инвалидируем кэши
      await this.invalidateUserCache(id);
      // Также инвалидируем кэш по старому email, если email изменился
      if (updateData.email && updateData.email !== currentUser.email) {
        await this.cacheManager.del(`user:email:${currentUser.email}`);
      }

      return user;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw error;
    }
  }

  async updatePassword(id: number, newPassword: string): Promise<User> {
    try {
      // Хешируем новый пароль
      const hashedPassword = await this.bcryptService.hash(newPassword);
      
      const user = await this.userRepo.update(id, { password: hashedPassword });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      // Инвалидируем кэш пользователя
      await this.invalidateUserCache(id);

      return user;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw error;
    }
  }

  async deactivate(id: number): Promise<User> {
    try {
      const user = await this.userRepo.update(id, { isActive: false });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      // Инвалидируем кэш пользователя
      await this.invalidateUserCache(id);

      return user;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      // Получаем пользователя перед удалением для инвалидации кэша по email
      const user = await this.userRepo.findById(id);
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      await this.userRepo.delete(id);
      
      // Инвалидируем все кэши пользователя
      await this.invalidateUserCache(id);
      await this.cacheManager.del(`user:email:${user.email}`);
      
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw error;
    }
  }

  async findAll(
    where?: any,
    orderBy?: any,
    skip?: number,
    take?: number,
  ): Promise<User[]> {
    const cacheKey = this.getListCacheKey(where, orderBy, skip, take);
    
    try {
      const cached = await this.cacheManager.get<User[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for users list`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache error for list key ${cacheKey}: ${error.message}`);
    }

    const users = await this.userRepo.findAll(where, orderBy, skip, take);
    
    try {
      await this.cacheManager.set(cacheKey, users, this.configService.get('CACHE_TTL') || 30000);
    } catch (error) {
      this.logger.warn(`Failed to cache users list: ${error.message}`);
    }

    return users;
  }

  async count(where?: any): Promise<number> {
    const cacheKey = this.getCountCacheKey(where);
    
    try {
      const cached = await this.cacheManager.get<number>(cacheKey);
      if (cached !== undefined) {
        this.logger.debug(`Cache hit for users count`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache error for count key ${cacheKey}: ${error.message}`);
    }

    const count = await this.userRepo.count(where);
    
    try {
      await this.cacheManager.set(cacheKey, count, this.configService.get('CACHE_TTL') || 30000);
    } catch (error) {
      this.logger.warn(`Failed to cache users count: ${error.message}`);
    }

    return count;
  }

  // Вспомогательные методы для кэширования
  private getCacheKey(id: number): string {
    return `user:id:${id}`;
  }

  private getListCacheKey(where?: any, orderBy?: any, skip?: number, take?: number): string {
    const params = {
      where: JSON.stringify(where || {}),
      orderBy: JSON.stringify(orderBy || {}),
      skip: skip || 0,
      take: take || 10,
    };
    return `users:list:${JSON.stringify(params)}`;
  }

  private getCountCacheKey(where?: any): string {
    return `users:count:${JSON.stringify(where || {})}`;
  }

  private async invalidateUserCache(id: number): Promise<void> {
    try {
      // Удаляем основные кэши пользователя
      await Promise.all([
        this.cacheManager.del(this.getCacheKey(id)),
        // Инвалидируем связанные кэши списков
        this.invalidateListCaches(),
      ]);
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache for user ${id}: ${error.message}`);
    }
  }

  private async invalidateListCaches(): Promise<void> {
    try {
      // Этот метод зависит от реализации кэша
      // Если используете Redis, можно сделать так:
      
      // Вариант 1: Использовать теги (если поддерживается)
      // await this.cacheManager.store.keys('users:list:*').then(keys => {
      //   return Promise.all(keys.map(key => this.cacheManager.del(key)));
      // });
      
      // Вариант 2: Удалять по паттерну (зависит от драйвера кэша)
      // Просто логируем, что нужно инвалидировать
      this.logger.debug('List caches should be invalidated');
      
      // Вариант 3: Удалить конкретные ключи, если знаете паттерн
      // await this.cacheManager.del('users:count:*'); // не работает с wildcard в стандартном Cache
      
    } catch (error) {
      this.logger.warn(`Failed to invalidate list caches: ${error.message}`);
    }
  }
}