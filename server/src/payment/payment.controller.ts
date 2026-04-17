import { Body, Controller, Post, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Create a Razorpay order for a session pack' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentService.createOrder({ pack: dto.pack, sessions: dto.sessions });
  }

  @ApiOperation({ summary: 'Verify payment and add session credits' })
  @ApiResponse({ status: 200, description: 'Payment verified and credits added' })
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Request() req, @Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyAndAddCredits(
      req.user.id,
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
      { pack: dto.pack, sessions: dto.sessions },
    );
  }
}
