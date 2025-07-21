import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../..', 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../..', 'ssl', 'cert.pem')),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.use(helmet({ crossOriginOpenerPolicy: false, originAgentCluster: false }));
  app.enableCors();
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Viby Auth API')
    .setDescription('API Auth avec HTTPS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3443);
  console.log(`🚀 Serveur HTTPS démarré sur https://localhost:3443/api/docs`);
}
bootstrap();
