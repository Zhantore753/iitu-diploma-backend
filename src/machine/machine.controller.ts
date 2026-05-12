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
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from 'generated/prisma';
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
  @ApiOkResponse({ description: 'Successfully retrieved machines', type: PaginatedMachineResponseDto })
  @ApiQuery({ name: 'searchBy', required: false })
  @ApiQuery({ name: 'searchValue', required: false })
  @ApiQuery({ name: 'orderBy', required: false })
  @ApiQuery({ name: 'orderType', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOperation({ summary: 'Get all machines with filtering and pagination' })
  async findAll(@Query() query: FindAllMachinesDto): Promise<PaginatedMachineResponseDto> {
    const { searchBy, searchValue, orderBy, orderType, skip, take } = query;
    const where = this.buildWhereClause(searchBy, searchValue);
    const order = orderBy ? { [orderBy]: orderType ?? 'asc' } : undefined;
    return this.machineService.findAll(where, order, skip, take);
  }

  @Get('my-machines')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Machines owned by the current user' })
  @ApiOperation({ summary: 'Get machines belonging to the authenticated user' })
  async myMachines(@User() user: any) {
    return this.machineService.getMyMachines(user.sub);
  }

  @Post()
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', 10))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Machine created' })
  @ApiOperation({ summary: 'Create a machine with photos (up to 10)' })
  async create(
    @User() user: any,
    @Body() dto: CreateMachineDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.machineService.createWithPhotos(user.sub, dto, files);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Machine successfully updated' })
  @ApiForbiddenResponse({ description: 'User not authorized to update this machine' })
  @ApiOperation({ summary: 'Update a machine' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
    @Body() dto: UpdateMachineDto,
  ) {
    return this.machineService.update(id, user.sub, dto as Prisma.MachineUpdateInput);
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({ description: 'Machine successfully retrieved' })
  @ApiOperation({ summary: 'Get machine by ID' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.machineService.findByIdSerialized(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Machine successfully deleted' })
  @ApiForbiddenResponse({ description: 'User not authorized to delete this machine' })
  @ApiOperation({ summary: 'Delete a machine' })
  async delete(@User() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.machineService.delete(user.sub, id);
  }

  private buildWhereClause(
    searchBy?: string,
    searchValue?: string,
  ): Prisma.MachineWhereInput {
    if (!searchBy || !searchValue) return {};

    const searchStrategies: Record<string, Prisma.MachineWhereInput> = {
      name: { name: { contains: searchValue, mode: 'insensitive' } },
      description: { description: { contains: searchValue, mode: 'insensitive' } },
      location: { location: { contains: searchValue, mode: 'insensitive' } },
      currency: { currency: { equals: searchValue } },
    };

    return searchStrategies[searchBy] ?? {};
  }
}
