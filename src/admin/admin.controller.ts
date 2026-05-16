import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserType } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { FileService } from 'src/file/file.service';
import { Public } from 'src/public/public.decorator';
import { ADMIN_HTML } from './admin.ui';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  @Public()
  index(@Res() res: Response) {
    return res.type('html').send(ADMIN_HTML);
  }

  @Get('api/dashboard')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('api/resources')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  resources() {
    return this.adminService.getMeta();
  }

  @Post('api/upload/machine-photo')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Можно загружать только изображения'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadMachinePhoto(@UploadedFile() file: Express.Multer.File) {
    const url = await this.fileService.upload(file, 'machines');
    return { url };
  }

  @Get('api/:resource')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  list(
    @Param('resource') resource: string,
    @Query() query: { skip?: string; take?: string; search?: string },
  ) {
    return this.adminService.list(resource, query);
  }

  @Get('api/:resource/:field/options')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  relationOptions(
    @Param('resource') resource: string,
    @Param('field') field: string,
  ) {
    return this.adminService.relationOptions(resource, field);
  }

  @Get('api/:resource/:id')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  getOne(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.getOne(resource, id);
  }

  @Post('api/:resource')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  create(@Param('resource') resource: string, @Body() body: Record<string, any>) {
    return this.adminService.create(resource, body);
  }

  @Patch('api/:resource/:id')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  update(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    return this.adminService.update(resource, id, body);
  }

  @Delete('api/:resource/:id')
  @ApiBearerAuth()
  @Roles([UserType.admin])
  delete(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.delete(resource, id);
  }
}
