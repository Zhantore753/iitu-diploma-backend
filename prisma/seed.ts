import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const categories = [
  'Тракторы',
  'Комбайны',
  'Сеялки',
  'Опрыскиватели',
  'Культиваторы',
  'Плуги',
  'Косилки',
  'Пресс-подборщики',
  'Бороны',
  'Жатки',
  'Погрузчики',
  'Прицепы',
];

const regions = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Алматинская область',
  'Акмолинская область',
  'Карагандинская область',
  'Костанайская область',
  'Восточно-Казахстанская область',
  'Западно-Казахстанская область',
  'Северо-Казахстанская область',
  'Павлодарская область',
  'Жамбылская область',
  'Кызылординская область',
  'Туркестанская область',
  'Мангистауская область',
  'Абайская область',
  'Жетысуская область',
  'Улытауская область',
];

const modelsByCategory: Record<string, string[]> = {
  'Тракторы': [
    'John Deere 8R',
    'Case IH Magnum 340',
    'New Holland T7',
    'Massey Ferguson 7726',
  ],
  'Комбайны': [
    'CLAAS LEXION 770',
    'John Deere S780',
    'Case IH Axial-Flow 8250',
    'New Holland CR10.90',
  ],
  'Сеялки': [
    'Horsch Pronto 6 DC',
    'Amazone D9 6000-TC',
    'John Deere 1890',
    'Great Plains 3S-5000',
  ],
  'Опрыскиватели': [
    'John Deere R4045',
    'Case IH Patriot 4450',
    'Amazone UX 5201',
    'Hardi Alpha Evo',
  ],
  'Культиваторы': [
    'Lemken Rubin 12',
    'Kuhn Performer 4000',
    'Kverneland Turbo T',
    'Great Plains Terra-Max',
  ],
  'Плуги': [
    'Lemken Diamant 11',
    'Kuhn Varimaster 183',
    'Kverneland Ecomat',
  ],
  'Косилки': [
    'CLAAS DISCO 9200',
    'Kuhn FC 8730 D',
    'New Holland H8060',
  ],
  'Пресс-подборщики': [
    'John Deere C441R',
    'CLAAS ROLLANT 455',
    'New Holland RB180',
  ],
  'Бороны': [
    'Lemken Zirkon 12',
    'Kuhn HR 4004',
    'Horsch Joker 12 RT',
  ],
  'Жатки': [
    'John Deere 640FD',
    'CLAAS VARIO 930',
    'Case IH 3050',
  ],
  'Погрузчики': [
    'JCB 435 S',
    'Bobcat S770',
    'Manitou MLT 741',
  ],
  'Прицепы': [
    'Wielton NS3 S/27',
    'Kröger Agroliner HKD 402',
    'Fliegl ASW 271',
  ],
};

async function main() {
  console.log('Seeding categories...');
  for (const name of categories) {
    await prisma.machineCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${categories.length} categories seeded`);

  console.log('Seeding regions...');
  for (const name of regions) {
    await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${regions.length} regions seeded`);

  console.log('Seeding machine models...');
  let modelCount = 0;
  for (const [categoryName, models] of Object.entries(modelsByCategory)) {
    const category = await prisma.machineCategory.findUnique({
      where: { name: categoryName },
    });
    if (!category) continue;

    for (const modelName of models) {
      const exists = await prisma.machineModel.findFirst({
        where: { name: modelName, categoryId: category.id },
      });
      if (!exists) {
        await prisma.machineModel.create({
          data: { name: modelName, categoryId: category.id },
        });
      }
      modelCount++;
    }
  }
  console.log(`✓ ${modelCount} models seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
