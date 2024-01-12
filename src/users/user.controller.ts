import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  Redirect,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CreateUserDto } from './dto/createUser.dto';
import { LoginUserDto } from './dto/login.dto';
import { LinkedInUserInfo, LinkedInSearchData } from 'src/utils/types';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Post('login')
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string }> {
    return this.userService.loginUser(loginUserDto);
  }

  @Get('linkedin')
  @Redirect('')
  async linkedIn(
    @Query('code') code: string,
  ): Promise<{ url: string }> {
    return await this.userService.getLinkedInDetails(code);
  }

  @Post('scrap')
  async scrap(
    @Body() body: { url: string; access_token: string; pages: number },
  ): Promise<{ data: LinkedInSearchData[] | []}> {
    return await this.userService.scrapLinkedinUrl(
      body.url,
      body.pages,
      body.access_token,
    );
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
