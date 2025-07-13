import { 
  Body, 
  Controller, 
  Post, 
  Get,
  Query,
  HttpCode, 
  HttpStatus, 
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyEmailDto, ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }
      
      return this.authService.login(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful, verification email sent' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(
        registerDto.email,
        registerDto.name,
        registerDto.password,
      );
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    try {
      return await this.authService.verifyEmail(verifyEmailDto.token);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Email verification failed');
    }
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'User not found or email already verified' })
  @ApiBody({ type: ResendVerificationDto })
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    try {
      return await this.authService.resendVerification(resendVerificationDto.email);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to resend verification email');
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      return await this.authService.forgotPassword(forgotPasswordDto.email);
    } catch (error) {
      // Always return success message for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }
  }
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.password
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Password reset failed');
    }
  }

  // Development-only endpoint for manually verifying users
  @Post('dev-verify')
  @ApiOperation({ summary: 'Development-only endpoint to manually verify a user by email' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'User not found or already verified' })
  async devVerifyUser(@Body() body: { email: string }) {
    if (process.env.NODE_ENV !== 'development') {
      throw new BadRequestException('This endpoint is only available in development mode');
    }
    
    try {
      return await this.authService.verifyUserByEmail(body.email);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify user');
    }
  }
}
