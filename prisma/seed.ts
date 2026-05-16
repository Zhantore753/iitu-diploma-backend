import * as bcrypt from 'bcrypt';
import { mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  NotificationType,
  PaymentStatus,
  PrismaClient,
  RentalStatus,
  UserType,
} from '../generated/prisma';

const prisma = new PrismaClient();

const password = 'Admin12345!';

const regions = [
  { name: 'Алматы', lat: 43.238949, lng: 76.889709 },
  { name: 'Астана', lat: 51.169392, lng: 71.449074 },
  { name: 'Шымкент', lat: 42.341684, lng: 69.590101 },
  { name: 'Алматинская область', lat: 43.873111, lng: 77.096944 },
  { name: 'Акмолинская область', lat: 52.0, lng: 69.0 },
  { name: 'Карагандинская область', lat: 49.806, lng: 73.085 },
  { name: 'Костанайская область', lat: 53.2198, lng: 63.6354 },
  { name: 'Восточно-Казахстанская область', lat: 49.948, lng: 82.628 },
  { name: 'Западно-Казахстанская область', lat: 51.233, lng: 51.367 },
  { name: 'Северо-Казахстанская область', lat: 54.873, lng: 69.15 },
  { name: 'Павлодарская область', lat: 52.287, lng: 76.967 },
  { name: 'Жамбылская область', lat: 42.9, lng: 71.366 },
  { name: 'Кызылординская область', lat: 44.852, lng: 65.509 },
  { name: 'Туркестанская область', lat: 43.3, lng: 68.25 },
  { name: 'Мангистауская область', lat: 43.65, lng: 51.2 },
  { name: 'Абайская область', lat: 50.411, lng: 80.227 },
  { name: 'Жетысуская область', lat: 45.015, lng: 78.373 },
  { name: 'Улытауская область', lat: 47.783, lng: 67.7 },
];

const modelsByCategory: Record<string, string[]> = {
  Тракторы: [
    'John Deere 8R 340',
    'Case IH Magnum 340',
    'New Holland T7.315',
    'Massey Ferguson 7726 S',
    'Беларус 3522',
  ],
  Комбайны: [
    'CLAAS LEXION 770',
    'John Deere S780',
    'Case IH Axial-Flow 8250',
    'New Holland CR10.90',
  ],
  Сеялки: [
    'Horsch Pronto 6 DC',
    'Amazone D9 6000-TC',
    'John Deere 1890',
    'Great Plains 3S-5000',
  ],
  Опрыскиватели: [
    'John Deere R4045',
    'Case IH Patriot 4450',
    'Amazone UX 5201',
    'Hardi Alpha Evo',
  ],
  Культиваторы: [
    'Lemken Rubin 12',
    'Kuhn Performer 4000',
    'Kverneland Turbo T',
    'Great Plains Terra-Max',
  ],
  Плуги: ['Lemken Diamant 11', 'Kuhn Varimaster 183', 'Kverneland Ecomat'],
  Косилки: ['CLAAS DISCO 9200', 'Kuhn FC 8730 D', 'New Holland H8060'],
  'Пресс-подборщики': [
    'John Deere C441R',
    'CLAAS ROLLANT 455',
    'New Holland RB180',
  ],
  Бороны: ['Lemken Zirkon 12', 'Kuhn HR 4004', 'Horsch Joker 12 RT'],
  Жатки: ['John Deere 640FD', 'CLAAS VARIO 930', 'Case IH 3050'],
  Погрузчики: ['JCB 435 S', 'Bobcat S770', 'Manitou MLT 741'],
  Прицепы: ['Wielton NS3 S/27', 'Kroger Agroliner HKD 402', 'Fliegl ASW 271'],
};

const attachments = [
  'Плуг оборотный',
  'Культиватор',
  'Дисковая борона',
  'Сеялка зерновая',
  'Картофелесажалка',
  'Опрыскиватель навесной',
  'Фронтальный ковш',
  'Вилы паллетные',
  'Косилка роторная',
  'Пресс-подборщик',
  'Разбрасыватель удобрений',
  'Прицеп самосвальный',
  'Жатка зерновая',
  'Каток кольчато-шпоровый',
  'Глубокорыхлитель',
  'Погрузочная стрела',
];

const providerNames = [
  ['Айбек', 'Серикбаев'],
  ['Данияр', 'Омаров'],
  ['Марат', 'Тлеубаев'],
  ['Санжар', 'Ибраев'],
  ['Арман', 'Касымов'],
  ['Ербол', 'Ахметов'],
  ['Нурлан', 'Жумабаев'],
  ['Руслан', 'Ким'],
  ['Бекзат', 'Сагындыков'],
  ['Тимур', 'Волков'],
  ['Алишер', 'Нургалиев'],
  ['Мурат', 'Кенжетаев'],
];

const farmerNames = [
  ['Алия', 'Муканова'],
  ['Жанар', 'Абдрахманова'],
  ['Елена', 'Петрова'],
  ['Асель', 'Кайратова'],
  ['Дина', 'Садыкова'],
  ['Ильяс', 'Рахимов'],
  ['Олег', 'Смирнов'],
  ['Мадина', 'Турсунова'],
  ['Бауыржан', 'Есенов'],
  ['Наталья', 'Громова'],
  ['Еркебулан', 'Мусин'],
  ['Светлана', 'Корнеева'],
];

const machineImageFiles = [
  'Tractor ploughing the field - geograph.org.uk - 272849.jpg',
  'The Combine Harvester (9481272274).jpg',
  'Seed drill - geograph.org.uk - 1771557.jpg',
  'Lite-Trac Crop Sprayer.jpg',
  'Ready To Plough Another Five Furrows - geograph.org.uk - 1542527.jpg',
  'IHC International 1460 combine harvester.jpg',
  'CaseCombineHarvester.jpg',
];

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

async function fileExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function commonsFileUrl(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(fileName: string, destination: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
  const response = await fetch(commonsFileUrl(fileName), {
    headers: {
      'User-Agent': 'agri-rental-platform-seed/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('image/')) {
    throw new Error(`Unexpected content type for ${fileName}: ${contentType}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 10_000) {
    throw new Error(`Downloaded image is too small: ${fileName}`);
  }

  await writeFile(destination, buffer);
      return;
    } catch (error) {
      lastError = error;
      await sleep(2500 * attempt);
    }
  }

  throw lastError;
}

async function ensureSeedMachineImages() {
  const uploadDir = join(process.cwd(), 'uploads', 'machines', 'seed');
  await mkdir(uploadDir, { recursive: true });

  const localUrls: string[] = [];

  for (let i = 0; i < machineImageFiles.length; i++) {
    const sourceName = machineImageFiles[i];
    const localFileName = `${String(i + 1).padStart(2, '0')}-${sourceName
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()}.jpg`;
    const destination = join(uploadDir, localFileName);

    if (!(await fileExists(destination))) {
      await downloadImage(sourceName, destination);
      await sleep(1500);
    }

    localUrls.push(`/uploads/machines/seed/${localFileName}`);
  }

  return localUrls;
}

async function upsertUser(
  index: number,
  firstName: string,
  lastName: string,
  userType: UserType,
  hashedPassword: string,
) {
  const prefix = userType === UserType.serviceProvider ? 'provider' : 'farmer';
  const email = `${prefix}${index + 1}@demo.agri`;

  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      userType,
      isVerified: true,
      isActive: index % 11 !== 0,
    },
    create: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: `+7701${String(1000000 + index * 13729).slice(0, 7)}`,
      avatar: `https://i.pravatar.cc/160?u=${email}`,
      bio:
        userType === UserType.serviceProvider
          ? 'Владелец сельхозтехники, работаю по области и соседним районам.'
          : 'Фермерское хозяйство, выращиваем зерновые и кормовые культуры.',
      address: `${pick(regions, index).name}, участок ${index + 7}`,
      userType,
      isVerified: true,
      isActive: index % 11 !== 0,
    },
  });
}

async function findOrCreateAttachment(name: string) {
  const existing = await prisma.attachment.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.attachment.create({ data: { name } });
}

async function findOrCreateMachine(data: {
  name: string;
  description: string;
  categoryId: number;
  power?: string;
  executors?: string;
  model?: string;
  year?: number;
  loadCapacity?: number;
  totalWeight?: number;
  location: string;
  latitude: number;
  longitude: number;
  availabilityStart: Date;
  availabilityEnd: Date;
  regionId: number;
  pricePerDay: number;
  ownerId: number;
  isAvailable: boolean;
}) {
  const existing = await prisma.machine.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.machine.update({ where: { id: existing.id }, data });
  }

  return prisma.machine.create({ data });
}

async function findOrCreateMachinePhoto(machineId: number, url: string) {
  const existing = await prisma.machinePhoto.findFirst({
    where: { machineId, url },
  });
  if (existing) return existing;
  return prisma.machinePhoto.create({ data: { machineId, url } });
}

async function findOrCreateAttachmentOnMachine(
  machineId: number,
  attachmentId: number,
) {
  const existing = await prisma.attachmentOnMachine.findFirst({
    where: { machineId, attachmentId },
  });
  if (existing) return existing;
  return prisma.attachmentOnMachine.create({ data: { machineId, attachmentId } });
}

async function findOrCreateRental(data: {
  machineId: number;
  renterId: number;
  startDate: Date;
  endDate: Date;
  rentalDays: number;
  totalPrice: number;
  status: RentalStatus;
  paymentStatus: PaymentStatus;
  machineLatitude?: number;
  machineLongitude?: number;
  baseMachineLatitude?: number;
  baseMachineLongitude?: number;
  trackingUpdatedAt?: Date;
}) {
  const existing = await prisma.rental.findFirst({
    where: {
      machineId: data.machineId,
      renterId: data.renterId,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
  if (existing) {
    return prisma.rental.update({ where: { id: existing.id }, data });
  }
  return prisma.rental.create({ data });
}

async function findOrCreateStatusHistory(rentalId: number, status: RentalStatus) {
  const existing = await prisma.rentalStatusHistory.findFirst({
    where: { rentalId, status },
  });
  if (existing) return existing;
  return prisma.rentalStatusHistory.create({ data: { rentalId, status } });
}

async function findOrCreateConversation(
  participant1Id: number,
  participant2Id: number,
  machineId: number | null,
) {
  const existing = await prisma.conversation.findFirst({
    where: { participant1Id, participant2Id, machineId },
  });
  if (existing) return existing;
  return prisma.conversation.create({
    data: {
      participant1Id,
      participant2Id,
      machineId,
      p1LastReadAt: daysFromNow(-1),
      p2LastReadAt: null,
    },
  });
}

async function findOrCreateMessage(
  conversationId: number,
  senderId: number,
  text: string,
) {
  const existing = await prisma.message.findFirst({
    where: { conversationId, senderId, text },
  });
  if (existing) return existing;
  return prisma.message.create({ data: { conversationId, senderId, text } });
}

async function findOrCreateNotification(data: {
  userId: number;
  type: NotificationType;
  rentalId?: number;
  isRead: boolean;
}) {
  const existing = await prisma.notification.findFirst({ where: data });
  if (existing) return existing;
  return prisma.notification.create({ data });
}

async function findOrCreateReview(data: {
  machineId: number;
  renterId: number;
  rentalId: number;
  rating: number;
  text: string;
}) {
  const existing = await prisma.review.findFirst({
    where: { rentalId: data.rentalId },
  });
  if (existing) return existing;

  const samePair = await prisma.review.findFirst({
    where: { machineId: data.machineId, renterId: data.renterId },
  });
  if (samePair) return samePair;

  return prisma.review.create({ data });
}

async function main() {
  console.log('Seeding demo data...');
  const hashedPassword = await bcrypt.hash(password, 10);
  const machineImageUrls = await ensureSeedMachineImages();

  await prisma.machinePhoto.deleteMany({
    where: { url: { contains: 'source.unsplash.com' } },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@agri-rental.local' },
    update: {
      password: hashedPassword,
      userType: UserType.admin,
      isVerified: true,
      isActive: true,
    },
    create: {
      email: 'admin@agri-rental.local',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Agri',
      phone: '+77000000000',
      userType: UserType.admin,
      isVerified: true,
      isActive: true,
    },
  });

  const categoryRecords: any[] = [];
  for (const name of Object.keys(modelsByCategory)) {
    categoryRecords.push(
      await prisma.machineCategory.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    );
  }

  const regionRecords: any[] = [];
  for (const region of regions) {
    regionRecords.push(
      await prisma.region.upsert({
        where: { name: region.name },
        update: {},
        create: { name: region.name },
      }),
    );
  }

  let modelCount = 0;
  for (const category of categoryRecords) {
    for (const modelName of modelsByCategory[category.name] ?? []) {
      const existing = await prisma.machineModel.findFirst({
        where: { name: modelName, categoryId: category.id },
      });
      if (!existing) {
        await prisma.machineModel.create({
          data: { name: modelName, categoryId: category.id },
        });
      }
      modelCount++;
    }
  }

  const attachmentRecords: any[] = [];
  for (const name of attachments) {
    attachmentRecords.push(await findOrCreateAttachment(name));
  }

  const providers: any[] = [];
  for (let i = 0; i < providerNames.length; i++) {
    providers.push(
      await upsertUser(
        i,
        providerNames[i][0],
        providerNames[i][1],
        UserType.serviceProvider,
        hashedPassword,
      ),
    );
  }

  const farmers: any[] = [];
  for (let i = 0; i < farmerNames.length; i++) {
    farmers.push(
      await upsertUser(
        i,
        farmerNames[i][0],
        farmerNames[i][1],
        UserType.farmer,
        hashedPassword,
      ),
    );
  }

  const machines: any[] = [];
  for (let i = 0; i < 42; i++) {
    const category = pick(categoryRecords, i);
    const region = pick(regionRecords, i + 3);
    const regionSeed = regions.find((item) => item.name === region.name) ?? regions[0];
    const owner = pick(providers, i);
    const model = pick(modelsByCategory[category.name] ?? ['Agri Model'], i);
    const price = 28000 + (i % 9) * 9500 + Math.floor(i / 9) * 3000;
    const machine = await findOrCreateMachine({
      name: `${model} · ${region.name} · ${i + 1}`,
      description:
        `Демо техника для тестирования админки. ${model}, регион ${region.name}. ` +
        'Подходит для сезонных работ, можно менять все поля и проверять связи.',
      categoryId: category.id,
      power: `${120 + (i % 8) * 35} л.с.`,
      executors: i % 3 === 0 ? `${owner.firstName} ${owner.lastName}` : undefined,
      model,
      year: 2017 + (i % 8),
      loadCapacity: category.name === 'Прицепы' || category.name === 'Погрузчики' ? 3500 + i * 120 : undefined,
      totalWeight: 4200 + i * 180,
      location: `${region.name}, база ${i + 1}`,
      latitude: regionSeed.lat + (i % 5) * 0.07,
      longitude: regionSeed.lng + (i % 6) * 0.05,
      availabilityStart: daysFromNow(-20 + (i % 6)),
      availabilityEnd: daysFromNow(40 + (i % 30)),
      regionId: region.id,
      pricePerDay: price,
      ownerId: owner.id,
      isAvailable: i % 7 !== 0,
    });
    machines.push(machine);

    for (let photoIndex = 0; photoIndex < 3; photoIndex++) {
      await findOrCreateMachinePhoto(
        machine.id,
        pick(machineImageUrls, i + photoIndex),
      );
    }

    for (let attachmentIndex = 0; attachmentIndex < 2; attachmentIndex++) {
      await findOrCreateAttachmentOnMachine(
        machine.id,
        pick(attachmentRecords, i + attachmentIndex).id,
      );
    }
  }

  const statuses = [
    RentalStatus.pending,
    RentalStatus.confirmed,
    RentalStatus.completed,
    RentalStatus.cancelled,
  ];
  const paymentStatuses = [
    PaymentStatus.not_paid,
    PaymentStatus.waiting,
    PaymentStatus.paid,
    PaymentStatus.refunded,
  ];

  const rentals: any[] = [];
  for (let i = 0; i < 64; i++) {
    const machine = pick(machines, i);
    const farmer = pick(farmers, i + 2);
    const startDate = daysFromNow(-35 + i);
    const rentalDays = 2 + (i % 9);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + rentalDays);
    const status = pick(statuses, i);
    const paymentStatus =
      status === RentalStatus.completed
        ? PaymentStatus.paid
        : status === RentalStatus.cancelled
          ? pick([PaymentStatus.not_paid, PaymentStatus.refunded], i)
          : pick(paymentStatuses, i + 1);

    const rental = await findOrCreateRental({
      machineId: machine.id,
      renterId: farmer.id,
      startDate,
      endDate,
      rentalDays,
      totalPrice: Number(machine.pricePerDay) * rentalDays,
      status,
      paymentStatus,
      machineLatitude: machine.latitude ? Number(machine.latitude) + 0.01 : undefined,
      machineLongitude: machine.longitude ? Number(machine.longitude) + 0.01 : undefined,
      baseMachineLatitude: machine.latitude ? Number(machine.latitude) : undefined,
      baseMachineLongitude: machine.longitude ? Number(machine.longitude) : undefined,
      trackingUpdatedAt: status === RentalStatus.confirmed ? daysFromNow(-1) : undefined,
    });
    rentals.push(rental);

    await findOrCreateStatusHistory(rental.id, RentalStatus.pending);
    if (status !== RentalStatus.pending) {
      await findOrCreateStatusHistory(rental.id, RentalStatus.confirmed);
    }
    if (status === RentalStatus.completed || status === RentalStatus.cancelled) {
      await findOrCreateStatusHistory(rental.id, status);
    }

    await findOrCreateNotification({
      userId: machine.ownerId,
      type: NotificationType.rental_request,
      rentalId: rental.id,
      isRead: i % 4 === 0,
    });
    await findOrCreateNotification({
      userId: farmer.id,
      type:
        status === RentalStatus.confirmed
          ? NotificationType.rental_confirmed
          : NotificationType.payment_required,
      rentalId: rental.id,
      isRead: i % 5 === 0,
    });
  }

  for (let i = 0; i < 30; i++) {
    const machine = pick(machines, i);
    const farmer = pick(farmers, i + 4);
    const owner = providers.find((provider) => provider.id === machine.ownerId) ?? providers[0];
    const conversation = await findOrCreateConversation(
      owner.id,
      farmer.id,
      machine.id,
    );

    await findOrCreateMessage(
      conversation.id,
      farmer.id,
      `Здравствуйте! Интересует ${machine.name} на ближайшие даты.`,
    );
    await findOrCreateMessage(
      conversation.id,
      owner.id,
      'Добрый день. Техника доступна, можем обсудить доставку и график.',
    );
    await findOrCreateMessage(
      conversation.id,
      farmer.id,
      'Отлично, отправьте пожалуйста условия аренды и итоговую стоимость.',
    );
  }

  let reviewCount = 0;
  const completedRentals = rentals.filter(
    (rental) => rental.status === RentalStatus.completed,
  );
  for (let i = 0; i < completedRentals.length; i++) {
    const rental = completedRentals[i];
    const review = await findOrCreateReview({
      machineId: rental.machineId,
      renterId: rental.renterId,
      rentalId: rental.id,
      rating: 4 + (i % 2),
      text:
        i % 2 === 0
          ? 'Техника приехала вовремя, состояние хорошее, работы закрыли без простоев.'
          : 'Все прошло нормально. Хотелось бы чуть быстрее подтверждение, но техника отличная.',
    });
    if (review) reviewCount++;
  }

  await findOrCreateNotification({
    userId: admin.id,
    type: NotificationType.message,
    isRead: false,
  });

  console.log('Seed complete:');
  console.log(`- admin: admin@agri-rental.local / ${password}`);
  console.log(`- users: ${providers.length + farmers.length + 1}`);
  console.log(`- categories: ${categoryRecords.length}`);
  console.log(`- models: ${modelCount}`);
  console.log(`- regions: ${regionRecords.length}`);
  console.log(`- attachments: ${attachmentRecords.length}`);
  console.log(`- machines: ${machines.length}`);
  console.log(`- rentals: ${rentals.length}`);
  console.log(`- conversations: 30`);
  console.log(`- reviews: ${reviewCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
