import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join, extname } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

@Injectable()
export class FileService {
  async upload(
    file: Express.Multer.File,
    folder: 'avatars' | 'files' | 'machines', // Добавили машины
  ): Promise<string> {
    try {
      // extname надежнее, чем split('.').pop()
      const fileExt = extname(file.originalname); 
      const fileName = `${randomUUID()}${fileExt}`;

      const uploadPath = join(process.cwd(), 'uploads', folder);

      // Создаем папку, если её нет
      await fs.mkdir(uploadPath, { recursive: true });

      const fullPath = join(uploadPath, fileName);
      await fs.writeFile(fullPath, file.buffer);

      // Возвращаем относительный путь для сохранения в БД
      return `/uploads/${folder}/${fileName}`;
    } catch (error) {
      throw new InternalServerErrorException('Ошибка при сохранении файла');
    }
  }
}