import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = process.env.UPLOAD_DIR || 'uploads';
          try {
            fs.mkdirSync(dir, { recursive: true });
          } catch {}
          cb(null, dir);
        },
        filename: (req, file, cb) =>
          cb(
            null,
            `${Date.now()}-${Math.random().toString(36).slice(2)}${extname(file.originalname)}`,
          ),
      }),
      limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024) },
      fileFilter: (req, file, cb) => {
        const allowed = (process.env.ALLOWED_MIME_TYPES || 'image/png,image/jpeg,application/pdf')
          .split(',')
          .map((s) => s.trim());
        if (!allowed.includes(file.mimetype)) return cb(new BadRequestException('Invalid file type') as any, false);
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file');
    const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    return {
      url: `${base}/files/${file.filename}`,
      name: file.originalname,
      size: file.size,
      mime: file.mimetype,
    };
  }
}
