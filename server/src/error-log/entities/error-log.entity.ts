import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('error_logs')
export class ErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 10, default: 'error' })
  level: string; // 'error' | 'warn'

  @Column({ length: 10 })
  method: string;

  @Index()
  @Column()
  path: string;

  @Column()
  statusCode: number;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  stack: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ default: false })
  resolved: boolean;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
