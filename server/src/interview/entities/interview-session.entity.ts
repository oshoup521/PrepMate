import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class InterviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column()
  difficulty: string;

  @Column({ nullable: true })
  description: string;

  @Column('json', { default: '[]' })
  questions: any[];

  @Column('json', { default: '[]' })
  answers: any[];

  @Column('json', { default: '[]' })
  evaluations: any[];

  @Column('json', { nullable: true })
  summary: any;

  @Column({ default: 'active' })
  status: string; // 'active', 'in_progress', 'completed'

  @Column({ default: false })
  completed: boolean; // Keep for backward compatibility

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}
