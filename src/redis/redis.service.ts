// src/redis/redis.service.ts
import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  /**
   * Сохранить значение с TTL (время жизни в секундах)
   */
  async set(key: string, value: string | number | object, ttl?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      if (ttl) {
        await this.redisClient.setex(key, ttl, stringValue);
      } else {
        await this.redisClient.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Failed to set key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Получить значение по ключу
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key "${key}":`, error);
      return null;
    }
  }

  /**
   * Получить и разобрать JSON значение
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get JSON for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Удалить ключ
   */
  async del(key: string): Promise<number> {
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key "${key}":`, error);
      return 0;
    }
  }

  /**
   * Удалить несколько ключей
   */
  async delMultiple(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      return await this.redisClient.del(...keys);
    } catch (error) {
      this.logger.error(`Failed to delete multiple keys:`, error);
      return 0;
    }
  }

  /**
   * Установить TTL для ключа (в секундах)
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redisClient.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to set TTL for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Получить оставшееся время жизни ключа (в секундах)
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key "${key}":`, error);
      return -2; // -2 означает, что ключ не существует
    }
  }

  /**
   * Проверить существование ключа
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Инкремент значения
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Инкремент значения на заданное число
   */
  async incrby(key: string, increment: number): Promise<number> {
    try {
      return await this.redisClient.incrby(key, increment);
    } catch (error) {
      this.logger.error(`Failed to increment by for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Декремент значения
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.redisClient.decr(key);
    } catch (error) {
      this.logger.error(`Failed to decrement key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Сохранить значение в хеш
   */
  async hset(key: string, field: string, value: string | number | object): Promise<void> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await this.redisClient.hset(key, field, stringValue);
    } catch (error) {
      this.logger.error(`Failed to hset for key "${key}" field "${field}":`, error);
      throw error;
    }
  }

  /**
   * Получить значение из хеша
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redisClient.hget(key, field);
    } catch (error) {
      this.logger.error(`Failed to hget for key "${key}" field "${field}":`, error);
      return null;
    }
  }

  /**
   * Получить все поля и значения хеша
   */
  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.redisClient.hgetall(key);
    } catch (error) {
      this.logger.error(`Failed to hgetall for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Удалить поле из хеша
   */
  async hdel(key: string, field: string): Promise<number> {
    try {
      return await this.redisClient.hdel(key, field);
    } catch (error) {
      this.logger.error(`Failed to hdel for key "${key}" field "${field}":`, error);
      return 0;
    }
  }

  /**
   * Добавить значение в список
   */
  async lpush(key: string, value: string | number | object): Promise<number> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return await this.redisClient.lpush(key, stringValue);
    } catch (error) {
      this.logger.error(`Failed to lpush for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Получить элементы из списка
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redisClient.lrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Failed to lrange for key "${key}":`, error);
      return [];
    }
  }

  /**
   * Добавить элемент в множество
   */
  async sadd(key: string, value: string | number): Promise<number> {
    try {
      return await this.redisClient.sadd(key, String(value));
    } catch (error) {
      this.logger.error(`Failed to sadd for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Получить все элементы множества
   */
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redisClient.smembers(key);
    } catch (error) {
      this.logger.error(`Failed to smembers for key "${key}":`, error);
      return [];
    }
  }

  /**
   * Проверить наличие элемента в множестве
   */
  async sismember(key: string, value: string | number): Promise<boolean> {
    try {
      const result = await this.redisClient.sismember(key, String(value));
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to sismember for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Удалить элемент из множества
   */
  async srem(key: string, value: string | number): Promise<number> {
    try {
      return await this.redisClient.srem(key, String(value));
    } catch (error) {
      this.logger.error(`Failed to srem for key "${key}":`, error);
      return 0;
    }
  }

  /**
   * Поиск ключей по шаблону
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys for pattern "${pattern}":`, error);
      return [];
    }
  }

  /**
   * Атомарная операция: установить значение если не существует
   */
  async setnx(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const result = await this.redisClient.setnx(key, value);
      
      if (result === 1 && ttl) {
        await this.redisClient.expire(key, ttl);
      }
      
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to setnx for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Пинг Redis сервера
   */
  async ping(): Promise<string> {
    try {
      return await this.redisClient.ping();
    } catch (error) {
      this.logger.error('Failed to ping Redis:', error);
      throw error;
    }
  }

  /**
   * Получить информацию о Redis
   */
  async info(): Promise<string> {
    try {
      return await this.redisClient.info();
    } catch (error) {
      this.logger.error('Failed to get Redis info:', error);
      throw error;
    }
  }

  /**
   * Получить статистику клиента
   */
  async getClientInfo(): Promise<any> {
    try {
      const clients = await this.redisClient.client('LIST');
      return clients;
    } catch (error) {
      this.logger.error('Failed to get client info:', error);
      return null;
    }
  }

  /**
   * Закрыть соединение с Redis при завершении работы модуля
   */
  async onModuleDestroy() {
    try {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Error while closing Redis connection:', error);
    }
  }

  /**
   * Получить статус подключения
   */
  getStatus(): string {
    return this.redisClient.status;
  }

  /**
   * Проверить подключение к Redis
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await this.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}