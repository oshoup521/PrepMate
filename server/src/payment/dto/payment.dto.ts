import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ enum: ['starter', 'popular', 'power'] })
  @IsIn(['starter', 'popular', 'power'])
  pack: 'starter' | 'popular' | 'power';
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  @ApiProperty({ enum: ['starter', 'popular', 'power'] })
  @IsIn(['starter', 'popular', 'power'])
  pack: 'starter' | 'popular' | 'power';
}
