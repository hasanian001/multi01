import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { Review, ReviewResponse, ReviewsResponse } from './entities/review.entity';
import { CreateReviewInput, UpdateReviewInput, ReplyReviewInput, ReviewFilterInput } from './dto/review.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Review)
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Query(() => ReviewsResponse)
  async reviews(
    @Args('filterInput', { nullable: true }) filterInput?: ReviewFilterInput,
  ): Promise<ReviewsResponse> {
    return this.reviewService.findAll(filterInput || {});
  }

  @Query(() => ReviewResponse)
  async review(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<ReviewResponse> {
    return this.reviewService.findOne(id);
  }

  @Mutation(() => ReviewResponse)
  @UseGuards(AuthGuard)
  async createReview(
    @Args('createReviewInput') createReviewInput: CreateReviewInput,
    @CurrentUser() user,
  ): Promise<ReviewResponse> {
    return this.reviewService.create(createReviewInput, user);
  }

  @Mutation(() => ReviewResponse)
  @UseGuards(AuthGuard)
  async updateReview(
    @Args('updateReviewInput') updateReviewInput: UpdateReviewInput,
    @CurrentUser() user,
  ): Promise<ReviewResponse> {
    return this.reviewService.update(updateReviewInput, user);
  }

  @Mutation(() => ReviewResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async replyToReview(
    @Args('replyReviewInput') replyReviewInput: ReplyReviewInput,
    @CurrentUser() user,
  ): Promise<ReviewResponse> {
    return this.reviewService.replyToReview(replyReviewInput, user);
  }

  @Mutation(() => ReviewResponse)
  @UseGuards(AuthGuard)
  async deleteReview(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<ReviewResponse> {
    return this.reviewService.remove(id, user);
  }
}