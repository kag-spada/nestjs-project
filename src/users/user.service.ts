import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/createUser.dto';
import { v4 as uuid } from 'uuid';
import { LoginUserDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const verificationToken = uuid();
      createUserDto.verificationToken = verificationToken;
      createUserDto.isLoggedIn = false;

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      createUserDto.password = hashedPassword;

      const newUser = await this.userRepository.save(createUserDto);

      return newUser;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async loginUser(
    loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string }> {
    try {
      const { email, password } = loginUserDto;
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new UnauthorizedException('Invalid Credentials');
      }

      if (!user.isLoggedIn) {
        throw new UnauthorizedException(
          'Please verify your email before logging in.',
        );
      }

      const passwordMatched = await bcrypt.compare(password, user.password);

      if (!passwordMatched) {
        throw new UnauthorizedException('Invalid Credentials');
      }

      const payload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        error.message || 'Failed to login user',
      );
    }
  }

  async verifyEmail(verificationToken: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { verificationToken },
      });

      if (!user) {
        throw new NotFoundException('Invalid verification token');
      }

      user.verificationToken = null;
      user.isLoggedIn = true;
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async initiatePasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException(
          'Invalid email address. Please provide a valid email associated with your account.',
        );
      }

      const resetToken = uuid();
      user.resetToken = resetToken;
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to initiate password reset',
      );
    }
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { resetToken } });

      if (!user) {
        throw new NotFoundException(
          'Invalid reset token. Please initiate the password reset process again.',
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
