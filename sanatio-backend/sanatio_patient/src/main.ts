import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  let app;
  try {
    const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../..', 'ssl', 'key.pem');
    const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../..', 'ssl', 'cert.pem');
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      app = await NestFactory.create(AppModule, {
        httpsOptions: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      });
    } else {
      app = await NestFactory.create(AppModule);
    }
  } catch {
    app = await NestFactory.create(AppModule);
  }
  app.use(helmet());
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*'];
  app.enableCors({ origin: allowedOrigins, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Patient Service API')
    .setDescription('API REST de gestion des patients, factures et notes')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || '4000');
}
bootstrap();
