import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkDbHealth(): Promise<{ db: string; latencyMs: number }> {
    const start = Date.now();
    await this.dataSource.query('SELECT 1');
    return { db: 'ok', latencyMs: Date.now() - start };
  }
}
