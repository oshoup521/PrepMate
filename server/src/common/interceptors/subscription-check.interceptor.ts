import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../../users/users.service';

@Injectable()
export class SubscriptionCheckInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (
      user &&
      user.plan === 'pro' &&
      user.planExpiresAt &&
      new Date(user.planExpiresAt) < new Date()
    ) {
      // Fire-and-forget — downgrade in DB, update request user synchronously for this request
      this.usersService.expirePlan(user.id).catch(() => {
        // silently ignore DB errors; next request will retry
      });

      // Update the in-request user object so downstream handlers see accurate plan
      request.user = { ...user, plan: 'free', planExpiresAt: null };
    }

    return next.handle();
  }
}
