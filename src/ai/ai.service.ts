import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from 'src/prisma/prisma.service';
import { MachineService } from 'src/machine/machine.service';

const MODEL = 'claude-haiku-4-5';

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

@Injectable()
export class AiService implements OnModuleInit {
  private client: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly machineService: MachineService,
  ) {}

  onModuleInit() {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  // ── 1. Description generator ────────────────────────────────────────────

  async generateDescription(dto: {
    name: string;
    category: string;
    model?: string;
    year?: number;
    power?: string;
    location: string;
    pricePerDay: number;
  }): Promise<{ description: string }> {
    const prompt = `Напиши профессиональное описание объявления об аренде сельскохозяйственной техники для платформы в Казахстане.
Техника: ${dto.name}
Категория: ${dto.category}
${dto.model ? `Модель: ${dto.model}` : ''}
${dto.year ? `Год выпуска: ${dto.year}` : ''}
${dto.power ? `Мощность: ${dto.power}` : ''}
Местоположение: ${dto.location}
Цена аренды: ${dto.pricePerDay} ₸/день

Напиши 2–3 предложения. Тон должен быть деловым и кратким: для чего подходит техника, ключевые характеристики и почему её стоит арендовать. Только текст описания, без заголовков.`;

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');

      return { description: text.trim() };
    } catch (err) {
      console.error('[AI] generate-description error:', err);
      throw new InternalServerErrorException('AI service unavailable');
    }
  }

  // ── 2. Price suggester ──────────────────────────────────────────────────

  async suggestPrice(dto: {
    category: string;
    regionName: string;
    year?: number;
    power?: string;
  }): Promise<{ minPrice: number; maxPrice: number; suggested: number; reasoning: string }> {
    // Fetch real market prices from DB for context
    const existing = await this.prisma.machine.findMany({
      where: { category: { name: dto.category } },
      select: { pricePerDay: true },
      take: 10,
    });

    const prices = existing.map((m) => Number(m.pricePerDay));
    const marketContext =
      prices.length > 0
        ? `Текущие цены аренды похожей техники на платформе (₸/день): ${prices.join(', ')}`
        : 'Данных о текущих ценах на платформе нет.';

    const prompt = `Ты эксперт по рынку аренды сельскохозяйственной техники в Казахстане.

${marketContext}

Категория техники: ${dto.category}
Регион: ${dto.regionName}
${dto.year ? `Год выпуска: ${dto.year}` : ''}
${dto.power ? `Мощность: ${dto.power}` : ''}

Предложи оптимальную цену аренды в тенге (₸) за день.
Верни ТОЛЬКО валидный JSON без markdown и пояснений:
{"minPrice": число, "maxPrice": число, "suggested": число, "reasoning": "краткое обоснование на русском (1-2 предложения)"}`;

    let raw = '';
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = response.content
        .filter((b) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');
    } catch (err) {
      console.error('[AI] suggest-price error:', err);
      throw new InternalServerErrorException('AI service unavailable');
    }

    try {
      return JSON.parse(stripCodeFences(raw));
    } catch (err) {
      console.error('[AI] suggest-price JSON parse error:', raw);
      throw new BadRequestException('AI returned invalid response, try again');
    }
  }

  // ── 3. Natural language search ──────────────────────────────────────────

  async parseSearch(query: string): Promise<Record<string, any>[]> {
    // Load real category/region names for the prompt
    const [categories, regions] = await Promise.all([
      this.prisma.machineCategory.findMany({ select: { name: true } }),
      this.prisma.region.findMany({ select: { name: true } }),
    ]);

    const categoryList = categories.map((c) => c.name).join(', ');
    const regionList = regions.map((r) => r.name).join(', ');

    const prompt = `Ты помощник по поиску сельскохозяйственной техники. Разбери поисковый запрос и извлеки фильтры.

Доступные категории: ${categoryList}
Доступные регионы: ${regionList}

Запрос: "${query}"

Верни ТОЛЬКО валидный JSON без markdown:
{"categoryName": "точное название из списка или null", "regionName": "точное название из списка или null", "keyword": "ключевое слово для поиска по названию/описанию или null"}`;

    let raw = '';
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = response.content
        .filter((b) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');
    } catch (err) {
      console.error('[AI] parse-search error:', err);
      throw new InternalServerErrorException('AI service unavailable');
    }

    let parsed: { categoryName?: string; regionName?: string; keyword?: string };
    try {
      parsed = JSON.parse(stripCodeFences(raw));
    } catch (err) {
      console.error('[AI] parse-search JSON parse error:', raw);
      throw new BadRequestException('AI returned invalid response, try again');
    }

    // Build Prisma where clause from extracted filters
    const where: any = {};
    if (parsed.categoryName) {
      where.category = { name: parsed.categoryName };
    }
    if (parsed.regionName) {
      where.region = { name: parsed.regionName };
    }
    if (parsed.keyword) {
      where.OR = [
        { name: { contains: parsed.keyword, mode: 'insensitive' } },
        { description: { contains: parsed.keyword, mode: 'insensitive' } },
      ];
    }

    const machines = await this.prisma.machine.findMany({
      where,
      include: {
        photos: true,
        category: true,
        region: true,
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        attachments: { include: { attachment: true } },
      },
    });

    return machines.map((m) => this.machineService.serializeMachine(m));
  }
}
