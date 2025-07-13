import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      this.logger.debug(`JWT payload received: ${JSON.stringify(payload)}`);
      
      if (!payload.sub) {
        this.logger.error('JWT payload missing sub (user ID)');
        throw new UnauthorizedException('Invalid token payload');
      }

      const userId = payload.sub;
      this.logger.debug(`Looking up user with ID: ${userId}`);
      
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        this.logger.error(`User not found for ID: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`User found: ${user.email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
