import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache set for key: ${key} with TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */  async reset(): Promise<void> {
    try {
      // Note: cache-manager v5+ doesn't have a reset method
      // We'll need to implement clearing by tracking keys or using a different approach
      this.logger.debug('Cache reset requested - skipping as not supported in current version');
    } catch (error) {
      this.logger.error('Cache reset error:', error);
    }
  }

  /**
   * Get or set pattern - if key exists, return it, otherwise compute and cache the value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null || value === undefined) {
      this.logger.debug(`Computing and caching value for key: ${key}`);
      value = await factory();
      await this.set(key, value, ttl);
    }
    
    return value;
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(userId: string, sessionData: any, ttl = 3600000): Promise<void> {
    const key = `user_session:${userId}`;
    await this.set(key, sessionData, ttl);
  }

  /**
   * Get cached user session
   */
  async getUserSession(userId: string): Promise<any> {
    const key = `user_session:${userId}`;
    return this.get(key);
  }

  /**
   * Cache interview questions for a role/difficulty combination
   */
  async cacheInterviewQuestions(
    role: string,
    difficulty: string,
    questions: any[],
    ttl = 1800000, // 30 minutes
  ): Promise<void> {
    const key = `interview_questions:${role}:${difficulty}`;
    await this.set(key, questions, ttl);
  }

  /**
   * Get cached interview questions
   */  async getInterviewQuestions(role: string, difficulty: string): Promise<any[]> {
    const key = `interview_questions:${role}:${difficulty}`;
    const result = await this.get<any[]>(key);
    return result || [];
  }

  /**
   * Cache user statistics
   */
  async cacheUserStats(userId: string, stats: any, ttl = 600000): Promise<void> {
    const key = `user_stats:${userId}`;
    await this.set(key, stats, ttl);
  }

  /**
   * Get cached user statistics
   */
  async getUserStats(userId: string): Promise<any> {
    const key = `user_stats:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate user-related cache entries
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `user_session:${userId}`,
      `user_stats:${userId}`,
    ];
    
    for (const pattern of patterns) {
      await this.del(pattern);
    }
  }
}