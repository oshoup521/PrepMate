import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ErrorLogService } from './error-log.service';

@ApiTags('error-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('error-logs')
export class ErrorLogController {
  constructor(private readonly errorLogService: ErrorLogService) {}

  @ApiOperation({ summary: 'List error logs (newest first)' })
  @ApiQuery({ name: 'level', required: false, enum: ['error', 'warn'] })
  @ApiQuery({ name: 'resolved', required: false, type: Boolean })
  @ApiQuery({ name: 'since', required: false, description: 'ISO date string, e.g. 2026-05-01' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @Get()
  findAll(
    @Query('level') level?: string,
    @Query('resolved') resolvedRaw?: string,
    @Query('since') since?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const resolved = resolvedRaw === 'true' ? true : resolvedRaw === 'false' ? false : undefined;
    const sinceDate = since ? new Date(since) : undefined;
    return this.errorLogService.findAll({ level, resolved, since: sinceDate, limit, offset });
  }

  @ApiOperation({ summary: 'Mark an error log as resolved' })
  @Patch(':id/resolve')
  resolve(@Param('id', ParseUUIDPipe) id: string) {
    return this.errorLogService.resolve(id);
  }

  @ApiOperation({ summary: 'Delete all resolved error logs' })
  @Delete('resolved')
  deleteResolved() {
    return this.errorLogService.deleteResolved().then((count) => ({ deleted: count }));
  }
}
