import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

@Injectable()
export class FileService {
  async upload(
    file: Express.Multer.File,
    folder: 'avatars' | 'files',
  ): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const fileName = `${randomUUID()}.${ext}`;

    const uploadPath = join(
      process.cwd(),
      'uploads',
      folder,
    );

    await fs.mkdir(uploadPath, { recursive: true });

    const fullPath = join(uploadPath, fileName);

    await fs.writeFile(fullPath, file.buffer);

    return `/uploads/${folder}/${fileName}`;
  }
}
