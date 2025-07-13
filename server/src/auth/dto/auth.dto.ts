import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password' 
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'User full name',
    minLength: 2,
    maxLength: 50 
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password',
    minLength: 6,
    maxLength: 100 
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty({ 
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    description: 'Email verification token' 
  })
  @IsNotEmpty({ message: 'Verification token is required' })
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    description: 'Password reset token' 
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString()
  token: string;

  @ApiProperty({ 
    example: 'newpassword123',
    description: 'New password',
    minLength: 6,
    maxLength: 100 
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;
}
