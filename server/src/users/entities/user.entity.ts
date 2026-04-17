import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string;
  @Column({ default: true })
  isEmailVerified: boolean;
  
  @Column({ type: 'text', nullable: true })
  @Exclude()
  emailVerificationToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  emailVerificationExpires: Date | null;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  passwordResetExpires: Date | null;

  @Column({ default: 3 })
  sessionCredits: number;

  @Column({ default: 3 })
  totalSessionCredits: number;

  @Column({ type: 'text', nullable: true })
  razorpayPaymentId: string | null;

  @Column({ type: 'text', nullable: true })
  razorpayOrderId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
