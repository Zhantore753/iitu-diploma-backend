import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/public/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOkResponse({ description: 'List of all machine categories' })
  @ApiOperation({ summary: 'Get all categories' })
  async findAll() {
    return this.prisma.machineCategory.findMany({ orderBy: { name: 'asc' } });
  }

  @Get('regions')
  @Public()
  @ApiOkResponse({ description: 'List of all regions' })
  @ApiOperation({ summary: 'Get all regions' })
  async findAllRegions() {
    return this.prisma.region.findMany({ orderBy: { name: 'asc' } });
  }

  @Get(':id/models')
  @Public()
  @ApiOkResponse({ description: 'Models belonging to a category' })
  @ApiOperation({ summary: 'Get machine models by category ID' })
  async findModelsByCategory(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.machineModel.findMany({
      where: { categoryId: id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
