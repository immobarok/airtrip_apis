import { Controller, Post, Body, Get, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { HostResponseDto } from './dto/host-response.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.createReview(userId, createReviewDto);
  }

  @Public()
  @Get('listing/:listingId')
  getListingReviews(
    @Param('listingId') listingId: string,
    @Query() query: GetReviewsDto
  ) {
    return this.reviewsService.getListingReviews(listingId, query);
  }

  @Public()
  @Get('user/:userId')
  getUserReviews(
    @Param('userId') userId: string,
    @Query() query: GetReviewsDto
  ) {
    return this.reviewsService.getUserReviews(userId, query);
  }

  @Patch(':id/response')
  @UseGuards(JwtAuthGuard)
  addHostResponse(
    @Param('id') id: string,
    @Body() hostResponseDto: HostResponseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.addHostResponse(id, userId, hostResponseDto);
  }
}
