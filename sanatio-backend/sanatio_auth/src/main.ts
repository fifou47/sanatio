import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';

async function bootstrap() {
  let app;
  try {
    const keyPath = path.join(__dirname, '../..', 'ssl', 'key.pem');
    const certPath = path.join(__dirname, '../..', 'ssl', 'cert.pem');
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      app = await NestFactory.create(AppModule, { httpsOptions });
    } else {
      app = await NestFactory.create(AppModule);
    }
  } catch {
    app = await NestFactory.create(AppModule);
  }

  app.use(helmet({ crossOriginOpenerPolicy: false, originAgentCluster: false }));
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*'];
  app.enableCors({ origin: allowedOrigins, credentials: true });
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

  if (process.env.EXPOSE_SWAGGER !== 'false') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }
  const port = Number(process.env.PORT || 3443);
  await app.listen(port);
  console.log(`🚀 Auth service démarré sur ${await app.getUrl()}`);
}
bootstrap();
