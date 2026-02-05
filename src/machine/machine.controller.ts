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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Machine, Prisma } from 'generated/prisma';
import { Public } from 'src/public/public.decorator';
import { User } from 'src/users/users.decorator';
import { CreateMachineDto } from './dto/create-machine.dto';
import { FindAllMachinesDto } from './dto/findAll.dto';
import { PaginatedMachineResponseDto } from './dto/response.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { MachineService } from './machine.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('machine')
@Controller('machine')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @Get()
  @Public()
  @ApiOkResponse({
    description: 'Successfully retrieved machines',
    type: PaginatedMachineResponseDto,
  })
  @ApiQuery({ name: 'searchBy', required: false })
  @ApiQuery({ name: 'searchValue', required: false })
  @ApiQuery({
    name: 'orderBy',
    required: false,
  })
  @ApiQuery({ name: 'orderType', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOperation({ summary: 'Get all machines with filtering and pagination' })
  async findAll(
    @Query() query: FindAllMachinesDto,
  ): Promise<PaginatedMachineResponseDto> {
    const { searchBy, searchValue, orderBy, orderType, skip, take } = query;

    const where = this.buildWhereClause(searchBy, searchValue);
    const order = orderBy ? { [orderBy]: orderType ?? 'asc' } : undefined;

    return this.machineService.findAll(where, order, skip, take);
  }

  @Post()
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Создать машину с фото (до 10 шт)' })
  async create(
    @User() user: any,
    @Body() dto: CreateMachineDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.machineService.createWithPhotos(user.sub, dto, files);
  }

  // @Patch(':id')
  // @ApiBearerAuth()
  // @ApiOkResponse({ description: 'Machine successfully updated' })
  // @ApiForbiddenResponse({
  //   description: 'User not authorized to update this machine',
  // })
  // @ApiOperation({ summary: 'Update a machine' })
  // async update(
  //   @Param('id', ParseIntPipe) id: number,
  //   @User() user: any,
  //   @Body() dto: UpdateMachineDto,
  // ): Promise<Machine> {
  //   return await this.machineService.update(id, user.sub, dto);
  // }

  @Get(':id')
  @Public()
  @ApiOkResponse({
    description: 'Machine successfully retrieved',
  })
  @ApiResponse({ status: 404, description: 'Machine not found' })
  @ApiOperation({ summary: 'Get machine by ID' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Machine> {
    return await this.machineService.findById(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Machine successfully deleted' })
  @ApiForbiddenResponse({
    description: 'User not authorized to delete this machine',
  })
  @ApiOperation({ summary: 'Delete a machine' })
  async delete(
    @User() user: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Machine> {
    return await this.machineService.delete(user.sub, id);
  }

  private buildWhereClause(
    searchBy?: string,
    searchValue?: string,
  ): Prisma.MachineWhereInput {
    if (!searchBy || !searchValue) return {};

    // Define allowed search fields and their search strategies
    const searchStrategies = {
      name: { contains: searchValue, mode: 'insensitive' as const },
      description: { contains: searchValue, mode: 'insensitive' as const },
      location: { contains: searchValue, mode: 'insensitive' as const },
      currency: { equals: searchValue }, // Exact match for currency
    };

    return searchStrategies[searchBy]
      ? { [searchBy]: searchStrategies[searchBy] }
      : {};
  }
}
