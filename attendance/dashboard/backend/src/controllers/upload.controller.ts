import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, openSync, readSync, closeSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { Request } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { StrictRateLimiterGuard } from '../auth/strict-rate-limiter.guard';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAGIC_BYTES_MAP: Record<string, Uint8Array[]> = {
  '.jpg': [new Uint8Array([0xff, 0xd8, 0xff])],
  '.jpeg': [new Uint8Array([0xff, 0xd8, 0xff])],
  '.png': [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  '.gif': [new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
  '.webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
};

function validateMagicBytes(filePath: string, ext: string): boolean {
  const signatures = MAGIC_BYTES_MAP[ext];
  if (!signatures) return false;
  const maxLen = Math.max(...signatures.map((s) => s.length));
  const buf = Buffer.alloc(maxLen);
  let fd: number;
  try {
    fd = openSync(filePath, 'r');
    readSync(fd, buf, 0, maxLen, 0);
    closeSync(fd);
  } catch {
    return false;
  }
  return signatures.some((sig) => sig.every((b, i) => buf[i] === b));
}

@Controller('upload')
@UseGuards(AuthGuard('jwt'), RolesGuard, StrictRateLimiterGuard)
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const name = uuid() + extname(file.originalname);
          cb(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          cb(new BadRequestException(`Extension non autorisée : ${ext}. Extensions acceptées : ${ALLOWED_EXTENSIONS.join(', ')}`), false);
          return;
        }
        if (!file.mimetype.match(/^image\//)) {
          cb(new BadRequestException('Seules les images sont acceptées'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('Fichier requis');
    const ext = extname(file.originalname).toLowerCase();
    if (!validateMagicBytes(file.path, ext)) {
      throw new BadRequestException('Le fichier ne correspond pas à un format image valide');
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return { url: `${baseUrl}/uploads/${file.filename}` };
  }
}
