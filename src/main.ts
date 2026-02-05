import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.enableCors();
  app.use(cookieParser());

  app.use('/uploads', express.static('uploads'));

// main.ts
app.useGlobalPipes(new ValidationPipe({ 
  transform: true, 
  transformOptions: { enableImplicitConversion: true } // Это заставит NestJS пытаться конвертировать типы сам
}));

  const config = new DocumentBuilder()
    .setTitle('Agri-rental platform')
    .setDescription('The agri-rental API description')
    .setVersion('1.0')
    .addTag('cats')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
