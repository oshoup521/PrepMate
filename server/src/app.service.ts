import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkDbHealth(): Promise<{
    db: 'ok' | 'error';
    latencyMs: number;
    dbError?: string;
  }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { db: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      return {
        db: 'error',
        latencyMs: Date.now() - start,
        dbError: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
