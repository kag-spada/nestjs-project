import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CreateUserDto } from './dto/createUser.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Post('verify-email/:verificationToken')
  async verifyEmail(
    @Param('verificationToken') verificationToken: string,
  ): Promise<string> {
    try {
      await this.userService.verifyEmail(verificationToken);
      return 'Email verified successfully! You can now log in.';
    } catch (error) {
      return 'Invalid verification token.';
    }
  }

  @Post('login')
  async loginUser(@Body() user: User): Promise<{ accessToken: string }> {
    return this.userService.loginUser(user.email, user.password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }): Promise<string> {
    try {
      await this.userService.initiatePasswordReset(body.email);
      return 'Reset password email sent successfully! Please check your email for further instructions.';
    } catch (error) {
      return 'Invalid email address. Please provide a valid email associated with your account.';
    }
  }
  @Post('reset-password/:resetToken')
  async resetPassword(
    @Param('resetToken') resetToken: string,
    @Body() body: { password: string },
  ): Promise<string> {
    try {
      await this.userService.resetPassword(resetToken, body.password);
      return 'Password reset successful! You can now log in with your new password.';
    } catch (error) {
      return 'Invalid reset token or password. Please try again.';
    }
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }
}
