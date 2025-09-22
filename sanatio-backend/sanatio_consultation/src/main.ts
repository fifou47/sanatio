import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  let app: NestExpressApplication;
  try {
    const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../..', 'ssl', 'key.pem');
    const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../..', 'ssl', 'cert.pem');
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      app = await NestFactory.create<NestExpressApplication>(AppModule, {
        httpsOptions: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      });
    } else {
      app = await NestFactory.create<NestExpressApplication>(AppModule);
    }
  } catch {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
  }
  app.use(helmet());

  const allowedOrigins = process.env.WS_ALLOWED_ORIGINS
    ? process.env.WS_ALLOWED_ORIGINS.split(',')
    : ['*'];
  app.enableCors({ origin: allowedOrigins, credentials: true });

  // Serve uploaded files under /files without @nestjs/serve-static
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/files' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Sanatio Consultation Service')
    .setDescription('Gère les consultations (chat/voice/video), le calcul de tarifs et les événements.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, doc);

  const port = process.env.PORT || 4008;
  await app.listen(port);
  console.log(`Consultation service en écoute sur ${port}`);
}
bootstrap();
