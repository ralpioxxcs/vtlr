import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ScheduleModel } from './schedule/entities/schedule.entity';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { UserModel } from './user/entities/user.entity';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  app.setGlobalPrefix('v1.0/scheduler', {});
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('vtlr')
    .setDescription('vtlr API')
    .setVersion('0.1')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      extraModels: [ScheduleModel, UserModel],
    });
  SwaggerModule.setup('api', app, documentFactory);
  const theme = new SwaggerTheme();
  const options = {
    explorer: false,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.NORD_DARK),
  };
  SwaggerModule.setup('api', app, documentFactory, options);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4004, '0.0.0.0');
}
bootstrap();
