import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for a verification email.');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }  async register(email: string, name: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }
    
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // For development environment, create user with email already verified
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    const user = await this.usersService.create(
      email, 
      name, 
      password, 
      isDevelopment ? undefined : emailVerificationToken, 
      isDevelopment ? undefined : emailVerificationExpires,
      isDevelopment // Auto-verify in development
    );
    
    // In development, auto-login the user
    if (isDevelopment) {
      const payload = { email: user.email, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isEmailVerified: true,
        },
        message: 'Registration successful! Auto-logged in for development.'
      };
    }
    
    // Send verification email in production
    await this.emailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
      user.name
    );
    
    return {
      message: 'Registration successful. Please check your email to verify your account.',
      email: user.email,
    };
  }
  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }
      if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }
    
    await this.usersService.verifyEmail(user.id);
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);
    
    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }
  
  // Utility method to manually verify a user by email (for development only)
  async verifyUserByEmail(email: string) {
    // Ensure this is only available in development mode
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('This functionality is only available in development mode');
    }
    
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    if (user.isEmailVerified) {
      return {
        message: 'User is already verified',
        email: user.email,
      };
    }
    
    await this.usersService.verifyEmail(user.id);
    
    return {
      message: 'User verified successfully. You can now log in.',
      email: user.email,
    };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }
    
    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await this.usersService.updateVerificationToken(
      user.id,
      emailVerificationToken,
      emailVerificationExpires
    );
    
    await this.emailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
      user.name
    );
    
    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await this.usersService.updatePasswordResetToken(
      user.id,
      resetToken,
      resetExpires
    );
    
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name
    );
    
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }
    
    await this.usersService.updatePassword(user.id, newPassword);
    
    return {
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }
}
