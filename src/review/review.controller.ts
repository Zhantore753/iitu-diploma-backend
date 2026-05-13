import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/public/public.decorator';
import { User } from 'src/users/users.decorator';
import { ReviewService } from './review.service';

@ApiTags('review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('recent')
  @Public()
  @ApiOperation({ summary: 'Get most recent reviews across all machines' })
  async getRecentReviews(@Query('take') take?: string) {
    return this.reviewService.getRecentReviews(Math.min(Number(take) || 6, 50));
  }

  @Get('machine/:machineId')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a machine' })
  async getMachineReviews(@Param('machineId', ParseIntPipe) machineId: number) {
    return this.reviewService.getMachineReviews(machineId);
  }

  @Get('can-review/:machineId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user can review this machine' })
  async canReview(
    @Param('machineId', ParseIntPipe) machineId: number,
    @User() user: any,
  ) {
    return this.reviewService.canReview(user.sub, machineId);
  }

  @Post()
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a review for a completed rental' })
  async createReview(
    @User() user: any,
    @Body()
    body: { machineId: number; rentalId: number; rating: number; text?: string },
  ) {
    return this.reviewService.createReview(user.sub, body);
  }
}
