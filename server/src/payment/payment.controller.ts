import { Body, Controller, Delete, Post, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/payment.dto';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: 'Create a Razorpay order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentService.createOrder(dto.plan);
  }

  @ApiOperation({ summary: 'Verify payment and upgrade user to Pro' })
  @ApiResponse({ status: 200, description: 'Payment verified and plan upgraded' })
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Request() req, @Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyAndUpgrade(
      req.user.id,
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
      dto.plan,
    );
  }

  @ApiOperation({ summary: 'Cancel Pro subscription and revert to free plan' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @Delete('subscription')
  @HttpCode(HttpStatus.OK)
  cancelSubscription(@Request() req) {
    return this.paymentService.cancelSubscription(req.user.id);
  }
}
