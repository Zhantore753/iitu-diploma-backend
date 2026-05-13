import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/public/public.decorator';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-description')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate a machine rental description using AI' })
  async generateDescription(
    @Body()
    body: {
      name: string;
      category: string;
      model?: string;
      year?: number;
      power?: string;
      location: string;
      pricePerDay: number;
    },
  ) {
    return this.aiService.generateDescription(body);
  }

  @Post('suggest-price')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Suggest a rental price based on category and region' })
  async suggestPrice(
    @Body()
    body: {
      category: string;
      regionName: string;
      year?: number;
      power?: string;
    },
  ) {
    return this.aiService.suggestPrice(body);
  }

  @Post('parse-search')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Natural language machine search' })
  async parseSearch(@Body('query') query: string) {
    return this.aiService.parseSearch(query);
  }
}
