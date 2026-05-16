import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

type FieldType = 'string' | 'int' | 'float' | 'decimal' | 'boolean' | 'date' | 'enum';

type AdminField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  multiline?: boolean;
  options?: string[];
  sensitive?: boolean;
  relation?: {
    resource: string;
    labelFields?: string[];
  };
};

type ResourceConfig = {
  key: string;
  label: string;
  delegate: string;
  fields: AdminField[];
  tableFields: string[];
  searchFields?: string[];
  defaultOrder?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, any>;
};

const userTypeOptions = ['serviceProvider', 'farmer', 'admin'];
const rentalStatusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];
const paymentStatusOptions = ['not_paid', 'waiting', 'paid', 'refunded'];
const notificationTypeOptions = [
  'rental_request',
  'rental_confirmed',
  'message',
  'payment_required',
];

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminService.name);

  private readonly resources: Record<string, ResourceConfig> = {
    users: {
      key: 'users',
      label: 'Пользователи',
      delegate: 'user',
      tableFields: ['id', 'email', 'firstName', 'lastName', 'userType', 'isActive'],
      searchFields: ['email', 'firstName', 'lastName', 'phone'],
      defaultOrder: { createdAt: 'desc' },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'email', label: 'Email', type: 'string', required: true },
        { name: 'password', label: 'Пароль', type: 'string', sensitive: true },
        { name: 'firstName', label: 'Имя', type: 'string', required: true },
        { name: 'lastName', label: 'Фамилия', type: 'string', required: true },
        { name: 'phone', label: 'Телефон', type: 'string', required: true },
        { name: 'avatar', label: 'Аватар URL', type: 'string' },
        { name: 'bio', label: 'О себе', type: 'string', multiline: true },
        { name: 'address', label: 'Адрес', type: 'string' },
        { name: 'userType', label: 'Тип', type: 'enum', options: userTypeOptions, required: true },
        { name: 'isVerified', label: 'Подтвержден', type: 'boolean' },
        { name: 'isActive', label: 'Активен', type: 'boolean' },
        { name: 'createdAt', label: 'Создан', type: 'date', readonly: true },
        { name: 'updatedAt', label: 'Обновлен', type: 'date', readonly: true },
      ],
    },
    machines: {
      key: 'machines',
      label: 'Техника',
      delegate: 'machine',
      tableFields: ['id', 'name', 'location', 'pricePerDay', 'isAvailable'],
      searchFields: ['name', 'description', 'location', 'currency'],
      defaultOrder: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
        owner: { select: { id: true, email: true } },
      },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'name', label: 'Название', type: 'string', required: true },
        { name: 'description', label: 'Описание', type: 'string', multiline: true, required: true },
        { name: 'categoryId', label: 'Категория', type: 'int', required: true, relation: { resource: 'machineCategories', labelFields: ['name'] } },
        { name: 'power', label: 'Мощность', type: 'string' },
        { name: 'executors', label: 'Исполнители', type: 'string' },
        { name: 'model', label: 'Модель', type: 'string' },
        { name: 'year', label: 'Год', type: 'int' },
        { name: 'loadCapacity', label: 'Грузоподъемность', type: 'int' },
        { name: 'totalWeight', label: 'Вес', type: 'int' },
        { name: 'location', label: 'Локация', type: 'string', required: true },
        { name: 'latitude', label: 'Широта', type: 'float' },
        { name: 'longitude', label: 'Долгота', type: 'float' },
        { name: 'availabilityStart', label: 'Доступна с', type: 'date' },
        { name: 'availabilityEnd', label: 'Доступна до', type: 'date' },
        { name: 'regionId', label: 'Регион', type: 'int', required: true, relation: { resource: 'regions', labelFields: ['name'] } },
        { name: 'pricePerDay', label: 'Цена в день', type: 'decimal', required: true },
        { name: 'currency', label: 'Валюта', type: 'string' },
        { name: 'ownerId', label: 'Владелец', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'isAvailable', label: 'Доступна', type: 'boolean' },
        { name: 'createdAt', label: 'Создана', type: 'date', readonly: true },
        { name: 'updatedAt', label: 'Обновлена', type: 'date', readonly: true },
      ],
    },
    machineCategories: {
      key: 'machineCategories',
      label: 'Категории',
      delegate: 'machineCategory',
      tableFields: ['id', 'name'],
      searchFields: ['name'],
      defaultOrder: { name: 'asc' },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'name', label: 'Название', type: 'string', required: true },
      ],
    },
    machineModels: {
      key: 'machineModels',
      label: 'Модели техники',
      delegate: 'machineModel',
      tableFields: ['id', 'name', 'categoryId'],
      searchFields: ['name'],
      defaultOrder: { name: 'asc' },
      include: { category: { select: { id: true, name: true } } },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'name', label: 'Название', type: 'string', required: true },
        { name: 'categoryId', label: 'Категория', type: 'int', required: true, relation: { resource: 'machineCategories', labelFields: ['name'] } },
      ],
    },
    regions: {
      key: 'regions',
      label: 'Регионы',
      delegate: 'region',
      tableFields: ['id', 'name'],
      searchFields: ['name'],
      defaultOrder: { name: 'asc' },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'name', label: 'Название', type: 'string', required: true },
      ],
    },
    attachments: {
      key: 'attachments',
      label: 'Навесное',
      delegate: 'attachment',
      tableFields: ['id', 'name'],
      searchFields: ['name'],
      defaultOrder: { name: 'asc' },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'name', label: 'Название', type: 'string', required: true },
      ],
    },
    attachmentOnMachine: {
      key: 'attachmentOnMachine',
      label: 'Навесное техники',
      delegate: 'attachmentOnMachine',
      tableFields: ['id', 'machineId', 'attachmentId'],
      include: {
        machine: { select: { id: true, name: true } },
        attachment: { select: { id: true, name: true } },
      },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'machineId', label: 'Техника', type: 'int', required: true, relation: { resource: 'machines', labelFields: ['name', 'location'] } },
        { name: 'attachmentId', label: 'Навесное', type: 'int', required: true, relation: { resource: 'attachments', labelFields: ['name'] } },
      ],
    },
    machinePhotos: {
      key: 'machinePhotos',
      label: 'Фото техники',
      delegate: 'machinePhoto',
      tableFields: ['id', 'url', 'machineId'],
      searchFields: ['url'],
      include: { machine: { select: { id: true, name: true } } },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'url', label: 'Фото', type: 'string', required: true },
        { name: 'machineId', label: 'Техника', type: 'int', required: true, relation: { resource: 'machines', labelFields: ['name', 'location'] } },
      ],
    },
    rentals: {
      key: 'rentals',
      label: 'Аренды',
      delegate: 'rental',
      tableFields: ['id', 'machineId', 'renterId', 'status', 'paymentStatus', 'totalPrice'],
      defaultOrder: { createdAt: 'desc' },
      include: {
        machine: { select: { id: true, name: true } },
        renter: { select: { id: true, email: true } },
      },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'machineId', label: 'Техника', type: 'int', required: true, relation: { resource: 'machines', labelFields: ['name', 'location'] } },
        { name: 'renterId', label: 'Арендатор', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'startDate', label: 'Дата начала', type: 'date', required: true },
        { name: 'endDate', label: 'Дата окончания', type: 'date', required: true },
        { name: 'rentalDays', label: 'Дней', type: 'int', required: true },
        { name: 'totalPrice', label: 'Итого', type: 'decimal', required: true },
        { name: 'status', label: 'Статус', type: 'enum', options: rentalStatusOptions },
        { name: 'paymentStatus', label: 'Оплата', type: 'enum', options: paymentStatusOptions },
        { name: 'machineLatitude', label: 'Широта техники', type: 'float' },
        { name: 'machineLongitude', label: 'Долгота техники', type: 'float' },
        { name: 'baseMachineLatitude', label: 'Базовая широта', type: 'float' },
        { name: 'baseMachineLongitude', label: 'Базовая долгота', type: 'float' },
        { name: 'trackingUpdatedAt', label: 'Трекинг обновлен', type: 'date' },
        { name: 'createdAt', label: 'Создана', type: 'date', readonly: true },
        { name: 'updatedAt', label: 'Обновлена', type: 'date', readonly: true },
      ],
    },
    rentalStatusHistory: {
      key: 'rentalStatusHistory',
      label: 'История аренд',
      delegate: 'rentalStatusHistory',
      tableFields: ['id', 'rentalId', 'status', 'changedAt'],
      defaultOrder: { changedAt: 'desc' },
      include: { rental: { select: { id: true, status: true, paymentStatus: true } } },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'rentalId', label: 'Аренда', type: 'int', required: true, relation: { resource: 'rentals', labelFields: ['status', 'paymentStatus'] } },
        { name: 'status', label: 'Статус', type: 'enum', options: rentalStatusOptions, required: true },
        { name: 'changedAt', label: 'Изменено', type: 'date' },
      ],
    },
    conversations: {
      key: 'conversations',
      label: 'Диалоги',
      delegate: 'conversation',
      tableFields: ['id', 'machineId', 'participant1Id', 'participant2Id'],
      defaultOrder: { updatedAt: 'desc' },
      include: {
        machine: { select: { id: true, name: true } },
        participant1: { select: { id: true, email: true } },
        participant2: { select: { id: true, email: true } },
      },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'machineId', label: 'Техника', type: 'int', relation: { resource: 'machines', labelFields: ['name', 'location'] } },
        { name: 'participant1Id', label: 'Участник 1', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'participant2Id', label: 'Участник 2', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'p1LastReadAt', label: 'Прочитано 1', type: 'date' },
        { name: 'p2LastReadAt', label: 'Прочитано 2', type: 'date' },
        { name: 'createdAt', label: 'Создан', type: 'date', readonly: true },
        { name: 'updatedAt', label: 'Обновлен', type: 'date', readonly: true },
      ],
    },
    messages: {
      key: 'messages',
      label: 'Сообщения',
      delegate: 'message',
      tableFields: ['id', 'conversationId', 'senderId', 'text', 'createdAt'],
      searchFields: ['text'],
      defaultOrder: { createdAt: 'desc' },
      include: {
        conversation: { select: { id: true, participant1Id: true, participant2Id: true } },
        sender: { select: { id: true, email: true } },
      },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'conversationId', label: 'Диалог', type: 'int', required: true, relation: { resource: 'conversations', labelFields: ['participant1Id', 'participant2Id'] } },
        { name: 'senderId', label: 'Отправитель', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'text', label: 'Текст', type: 'string', multiline: true, required: true },
        { name: 'createdAt', label: 'Создано', type: 'date', readonly: true },
      ],
    },
    notifications: {
      key: 'notifications',
      label: 'Уведомления',
      delegate: 'notification',
      tableFields: ['id', 'userId', 'type', 'rentalId', 'isRead'],
      defaultOrder: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true } } },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'userId', label: 'Пользователь', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'type', label: 'Тип', type: 'enum', options: notificationTypeOptions, required: true },
        { name: 'rentalId', label: 'Аренда', type: 'int', relation: { resource: 'rentals', labelFields: ['status', 'paymentStatus'] } },
        { name: 'isRead', label: 'Прочитано', type: 'boolean' },
        { name: 'createdAt', label: 'Создано', type: 'date', readonly: true },
      ],
    },
    reviews: {
      key: 'reviews',
      label: 'Отзывы',
      delegate: 'review',
      tableFields: ['id', 'machineId', 'renterId', 'rentalId', 'rating'],
      searchFields: ['text'],
      defaultOrder: { createdAt: 'desc' },
      include: {
        machine: { select: { id: true, name: true } },
        renter: { select: { id: true, email: true } },
        rental: { select: { id: true, status: true, paymentStatus: true } },
      },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'machineId', label: 'Техника', type: 'int', required: true, relation: { resource: 'machines', labelFields: ['name', 'location'] } },
        { name: 'renterId', label: 'Арендатор', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'rentalId', label: 'Аренда', type: 'int', required: true, relation: { resource: 'rentals', labelFields: ['status', 'paymentStatus'] } },
        { name: 'rating', label: 'Оценка', type: 'int', required: true },
        { name: 'text', label: 'Текст', type: 'string', multiline: true },
        { name: 'createdAt', label: 'Создан', type: 'date', readonly: true },
      ],
    },
    refreshTokens: {
      key: 'refreshTokens',
      label: 'Refresh tokens',
      delegate: 'refreshToken',
      tableFields: ['id', 'userId', 'expiresAt', 'lastUsedAt'],
      defaultOrder: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true } } },
      fields: [
        { name: 'id', label: 'ID', type: 'int', readonly: true },
        { name: 'token', label: 'Токен', type: 'string', sensitive: true, required: true },
        { name: 'userId', label: 'Пользователь', type: 'int', required: true, relation: { resource: 'users', labelFields: ['email', 'firstName', 'lastName'] } },
        { name: 'expiresAt', label: 'Истекает', type: 'date', required: true },
        { name: 'ip', label: 'IP', type: 'string' },
        { name: 'userAgent', label: 'User agent', type: 'string' },
        { name: 'lastUsedAt', label: 'Последнее использование', type: 'date' },
        { name: 'createdAt', label: 'Создан', type: 'date', readonly: true },
      ],
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureDefaultAdmin();
  }

  private async ensureDefaultAdmin() {
    const existingAdmin = await this.prisma.user.findFirst({
      where: { userType: 'admin' },
      select: { id: true, email: true },
    });

    if (existingAdmin) {
      this.logger.log(`Admin user already exists: ${existingAdmin.email}`);
      return;
    }

    const email =
      this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@agri-rental.local';
    const password =
      this.configService.get<string>('ADMIN_PASSWORD') ?? 'Admin12345!';

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Agri',
        phone: '+77000000000',
        userType: 'admin',
        isVerified: true,
        isActive: true,
      },
    });

    this.logger.log(`Default admin user created: ${email}`);
  }

  getMeta() {
    return Object.values(this.resources).map(({ key, label, fields, tableFields }) => ({
      key,
      label,
      fields,
      tableFields,
    }));
  }

  async relationOptions(resourceKey: string, fieldName: string) {
    const resource = this.getResource(resourceKey);
    const field = resource.fields.find((item) => item.name === fieldName);
    if (!field?.relation) {
      throw new NotFoundException('Связь для поля не найдена');
    }

    const relatedResource = this.getResource(field.relation.resource);
    const delegate = this.getDelegate(relatedResource);
    const labelFields = field.relation.labelFields ?? ['name', 'email'];
    const select = labelFields.reduce<Record<string, boolean>>(
      (acc, name) => ({ ...acc, [name]: true }),
      { id: true },
    );

    const items = await delegate.findMany({
      take: 500,
      orderBy: relatedResource.defaultOrder,
      select,
    });

    return items.map((item) => ({
      id: item.id,
      label: this.formatRelationLabel(item, labelFields),
    }));
  }

  async dashboard() {
    const [
      users,
      machines,
      rentals,
      pendingRentals,
      reviews,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.machine.count(),
      this.prisma.rental.count(),
      this.prisma.rental.count({ where: { status: 'pending' } }),
      this.prisma.review.count(),
      this.prisma.rental.aggregate({ _sum: { totalPrice: true } }),
    ]);

    return {
      users,
      machines,
      rentals,
      pendingRentals,
      reviews,
      totalRevenue: totalRevenue._sum.totalPrice ?? 0,
    };
  }

  async list(resourceKey: string, query: { skip?: string; take?: string; search?: string }) {
    const resource = this.getResource(resourceKey);
    const delegate = this.getDelegate(resource);
    const skip = Math.max(Number(query.skip ?? 0), 0);
    const take = Math.min(Math.max(Number(query.take ?? 25), 1), 100);
    const where = this.buildSearch(resource, query.search);

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        skip,
        take,
        orderBy: resource.defaultOrder,
        include: resource.include,
      }),
      delegate.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async getOne(resourceKey: string, id: number) {
    const resource = this.getResource(resourceKey);
    const item = await this.getDelegate(resource).findUnique({
      where: { id },
      include: resource.include,
    });
    if (!item) throw new NotFoundException('Запись не найдена');
    return item;
  }

  async create(resourceKey: string, body: Record<string, any>) {
    const resource = this.getResource(resourceKey);
    const data = await this.prepareData(resource, body, false);
    try {
      return await this.getDelegate(resource).create({ data });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async update(resourceKey: string, id: number, body: Record<string, any>) {
    const resource = this.getResource(resourceKey);
    const data = await this.prepareData(resource, body, true);
    try {
      return await this.getDelegate(resource).update({ where: { id }, data });
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async delete(resourceKey: string, id: number) {
    const resource = this.getResource(resourceKey);
    await this.getDelegate(resource).delete({ where: { id } });
    return { ok: true };
  }

  private getResource(resourceKey: string) {
    const resource = this.resources[resourceKey];
    if (!resource) throw new NotFoundException('Раздел админки не найден');
    return resource;
  }

  private getDelegate(resource: ResourceConfig) {
    return this.prisma[resource.delegate];
  }

  private formatRelationLabel(item: Record<string, any>, labelFields: string[]) {
    const label = labelFields
      .map((field) => item[field])
      .filter((value) => value !== null && value !== undefined && value !== '')
      .join(' · ');

    return label ? `#${item.id} · ${label}` : `#${item.id}`;
  }

  private handlePrismaWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException(
        'Выбрана несуществующая связанная запись. Обновите страницу и выберите значение из списка.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException('Такая запись уже существует.');
    }

    throw error;
  }

  private buildSearch(resource: ResourceConfig, search?: string) {
    const value = search?.trim();
    if (!value || !resource.searchFields?.length) return undefined;

    return {
      OR: resource.searchFields.map((field) => ({
        [field]: { contains: value, mode: 'insensitive' },
      })),
    };
  }

  private async prepareData(
    resource: ResourceConfig,
    body: Record<string, any>,
    isUpdate: boolean,
  ) {
    const data: Record<string, any> = {};

    for (const field of resource.fields) {
      if (field.readonly || field.name === 'id') continue;
      if (!(field.name in body)) continue;

      if (resource.key === 'users' && field.name === 'password') {
        const password = String(body.password ?? '').trim();
        if (!password) {
          if (!isUpdate) throw new BadRequestException('Пароль обязателен');
          continue;
        }
        data.password = await bcrypt.hash(password, 10);
        continue;
      }

      const value = this.castValue(field, body[field.name]);
      if (value === undefined) continue;
      data[field.name] = value;
    }

    return data;
  }

  private castValue(field: AdminField, raw: any) {
    if (raw === undefined) return undefined;
    if (raw === null || raw === '') {
      return field.required ? undefined : null;
    }

    switch (field.type) {
      case 'int':
        return Number.parseInt(raw, 10);
      case 'float':
        return Number(raw);
      case 'decimal':
        return String(raw);
      case 'boolean':
        return raw === true || raw === 'true' || raw === 'on' || raw === 1 || raw === '1';
      case 'date':
        return new Date(raw);
      default:
        return String(raw);
    }
  }
}
