import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis | null = null;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('⚠️ REDIS_URL not found in environment. Redis features will be disabled.');
      return;
    }

    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null; // Stop retrying after 3 attempts
          return Math.min(times * 50, 2000);
        },
      });

      this.redisClient.on('error', (err) => {
        // Silent error to prevent crash, but could log if needed
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
    }
  }

  onModuleDestroy() {
    this.redisClient?.disconnect();
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.redisClient) return;
    try {
      if (ttl) {
        await this.redisClient.set(key, value, 'EX', ttl);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (e) {}
  }

  async get(key: string): Promise<string | null> {
    if (!this.redisClient) return null;
    try {
      return await this.redisClient.get(key);
    } catch (e) {
      return null;
    }
  }

  async del(key: string): Promise<number> {
    if (!this.redisClient) return 0;
    try {
      return await this.redisClient.del(key);
    } catch (e) {
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    if (!this.redisClient) return 0;
    try {
      return await this.redisClient.exists(key);
    } catch (e) {
      return 0;
    }
  }
}
