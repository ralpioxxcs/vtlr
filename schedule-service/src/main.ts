import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ScheduleModel } from './schedule/entities/schedule.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('vtlr')
    .setDescription('vtlr API')
    .setVersion('0.1')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      extraModels: [ScheduleModel],
    });
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  //app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
