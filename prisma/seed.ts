import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedUsers } from './seed/users';
import { seedMainCategories } from './seed/main-categories';
import { seedCategories } from './seed/categories';
import { seedSubCategories } from './seed/sub-categories';
import { seedAttributes } from './seed/attributes';
import { seedBrands } from './seed/brands';
import { seedShops } from './seed/shops';
import { seedProducts } from './seed/products';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Starting seed process...');
  
  try {
    // Clean up database (in reverse order of dependencies)
    console.log('🧹 Cleaning up database...');
    await prisma.paymentTransaction.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.couponUser.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.address.deleteMany();
    await prisma.productAttribute.deleteMany();
    await prisma.product.deleteMany();
    await prisma.attributeValue.deleteMany();
    await prisma.attribute.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.subCategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.mainCategory.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleaned');

    // Seed users
    console.log('👤 Seeding users...');
    const hashedUsers = await Promise.all(
      seedUsers.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
      }))
    );
    await prisma.user.createMany({ data: hashedUsers });
    console.log('✅ Users seeded');

    // Seed main categories
    console.log('📂 Seeding main categories...');
    await prisma.mainCategory.createMany({ data: seedMainCategories });
    console.log('✅ Main categories seeded');

    // Seed categories
    console.log('📂 Seeding categories...');
    await prisma.category.createMany({ data: seedCategories });
    console.log('✅ Categories seeded');

    // Seed sub-categories
    console.log('📂 Seeding sub-categories...');
    await prisma.subCategory.createMany({ data: seedSubCategories });
    console.log('✅ Sub-categories seeded');

    // Seed attributes
    console.log('🏷️ Seeding attributes and values...');
    for (const attribute of seedAttributes) {
      const { values, ...attributeData } = attribute;
      const createdAttribute = await prisma.attribute.create({
        data: attributeData,
      });

      await prisma.attributeValue.createMany({
        data: values.map((value) => ({
          value,
          attributeId: createdAttribute.id,
        })),
      });
    }
    console.log('✅ Attributes and values seeded');

    // Seed brands
    console.log('🏢 Seeding brands...');
    await prisma.brand.createMany({ data: seedBrands });
    console.log('✅ Brands seeded');

    // Seed shops
    console.log('🏪 Seeding shops...');
    const users = await prisma.user.findMany({
      where: { role: 'SELLER' },
    });
    
    const shopsWithOwners = seedShops.map((shop, index) => ({
      ...shop,
      ownerId: users[index % users.length].id,
    }));
    
    await prisma.shop.createMany({ data: shopsWithOwners });
    console.log('✅ Shops seeded');

    // Seed products
    console.log('📦 Seeding products...');
    const shops = await prisma.shop.findMany();
    const categories = await prisma.category.findMany();
    const subCategories = await prisma.subCategory.findMany();
    const brands = await prisma.brand.findMany();
    
    const productsWithRelations = seedProducts.map((product, index) => ({
      ...product,
      shopId: shops[index % shops.length].id,
      categoryId: categories[index % categories.length].id,
      subCategoryId: subCategories[index % subCategories.length].id,
      brandId: brands[index % brands.length].id,
    }));
    
    for (const product of productsWithRelations) {
      await prisma.product.create({
        data: product,
      });
    }
    console.log('✅ Products seeded');

    console.log('🎉 Seed process completed successfully!');
  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });