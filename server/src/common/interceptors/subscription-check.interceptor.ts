import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

// No-op interceptor — plan expiry removed in favour of session credit packs
@Injectable()
export class SubscriptionCheckInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}
