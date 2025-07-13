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
  @Column({ default: false })
  isEmailVerified: boolean;
  
  @Column({ type: 'text', nullable: true })
  @Exclude()
  emailVerificationToken: string | null;

  @Column({ type: 'datetime', nullable: true })
  @Exclude()
  emailVerificationExpires: Date | null;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  passwordResetToken: string | null;

  @Column({ type: 'datetime', nullable: true })
  @Exclude()
  passwordResetExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
