import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async create(
    email: string, 
    name: string, 
    password: string,
    emailVerificationToken?: string,
    emailVerificationExpires?: Date,
    autoVerify = false
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.usersRepository.create({
      email,
      name,
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: autoVerify // Automatically verify email if specified
    });
    
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.debug(`User not found for ID: ${id}`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${error.message}`);
      return null;
    }
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { emailVerificationToken: token } 
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { passwordResetToken: token } 
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }

  async updateVerificationToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    });
  }

  async updatePasswordResetToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async expirePlan(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { plan: 'free', planExpiresAt: null });
  }

  async upgradeToPro(
    userId: string,
    billingCycle: 'monthly' | 'annual',
    razorpayPaymentId: string,
    razorpayOrderId: string,
  ): Promise<void> {
    const now = new Date();
    const planExpiresAt = new Date(now);
    if (billingCycle === 'annual') {
      planExpiresAt.setDate(planExpiresAt.getDate() + 365);
    } else {
      planExpiresAt.setDate(planExpiresAt.getDate() + 30);
    }
    await this.usersRepository.update(userId, {
      plan: 'pro',
      billingCycle,
      planExpiresAt,
      razorpayPaymentId,
      razorpayOrderId,
    });
  }
}
