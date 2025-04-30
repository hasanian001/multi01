import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User, AuthResponse, MessageResponse } from './entities/user.entity';
import { SignupInput, LoginInput, UpdateUserInput, ChangePasswordInput } from './dto/user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => AuthResponse)
  async signup(@Args('input') signupInput: SignupInput): Promise<AuthResponse> {
    return this.userService.signup(signupInput);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') loginInput: LoginInput): Promise<AuthResponse> {
    return this.userService.login(loginInput);
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return this.userService.getUserById(user.id);
  }

  @Mutation(() => AuthResponse)
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Args('input') updateData: UpdateUserInput,
  ): Promise<AuthResponse> {
    return this.userService.updateProfile(user.id, updateData);
  }

  @Mutation(() => MessageResponse)
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input') passwordData: ChangePasswordInput,
  ): Promise<MessageResponse> {
    return this.userService.changePassword(user.id, passwordData);
  }

  @Mutation(() => MessageResponse)
  @UseGuards(AuthGuard)
  async logout(@Context() context: any): Promise<MessageResponse> {
    const token = context.req.headers.authorization?.split(' ')[1];
    return this.userService.logout(token);
  }

  // TODO: Add other mutations like requestPasswordReset, resetPassword, verifyEmail, etc.
}