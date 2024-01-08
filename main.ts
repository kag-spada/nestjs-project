import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
  const port = process.env.PORT || 3000;
  Logger.log(`Server is listening on port ${port}`);
}
bootstrap();
