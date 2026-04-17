import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiPropertyOptional({ enum: ['starter', 'popular', 'power'] })
  @IsOptional()
  @IsIn(['starter', 'popular', 'power'])
  pack?: 'starter' | 'popular' | 'power';

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  sessions?: number;
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

  @ApiPropertyOptional({ enum: ['starter', 'popular', 'power'] })
  @IsOptional()
  @IsIn(['starter', 'popular', 'power'])
  pack?: 'starter' | 'popular' | 'power';

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  sessions?: number;
}
