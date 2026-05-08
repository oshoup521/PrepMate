import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ErrorLog } from './entities/error-log.entity';

export interface CreateErrorLogDto {
  level: 'error' | 'warn';
  method: string;
  path: string;
  statusCode: number;
  message: string;
  stack?: string;
  userId?: string;
  ip?: string;
}

@Injectable()
export class ErrorLogService {
  constructor(
    @InjectRepository(ErrorLog)
    private readonly repo: Repository<ErrorLog>,
  ) {}

  async save(dto: CreateErrorLogDto): Promise<void> {
    try {
      await this.repo.save(this.repo.create(dto));
    } catch {
      // Never let logging crash the app
    }
  }

  async findAll(filters: {
    level?: string;
    resolved?: boolean;
    since?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: ErrorLog[]; total: number }> {
    const { level, resolved, since, limit = 50, offset = 0 } = filters;

    const where: any = {};
    if (level) where.level = level;
    if (resolved !== undefined) where.resolved = resolved;
    if (since) where.createdAt = MoreThanOrEqual(since);

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
      skip: offset,
    });

    return { data, total };
  }

  async resolve(id: string): Promise<ErrorLog | null> {
    await this.repo.update(id, { resolved: true });
    return this.repo.findOne({ where: { id } });
  }

  async deleteResolved(): Promise<number> {
    const result = await this.repo.delete({ resolved: true });
    return result.affected ?? 0;
  }
}
