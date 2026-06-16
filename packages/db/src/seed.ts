import "dotenv/config";

import { hash } from "@node-rs/argon2";
import { getEnv } from "@autodrop/config";
import { PrismaClient, ProductSource, ProductStatus, RoleName, StoreStatus, SupplierType, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();
const env = getEnv();

const permissionMap: Record<RoleName, Array<{ resource: string; action: string; description: string }>> = {
  ADMIN: [
    { resource: "*", action: "*", description: "Full platform access" }
  ],
  MANAGER: [
    { resource: "dashboard", action: "view", description: "View dashboard" },
    { resource: "products", action: "manage", description: "Manage products" },
    { resource: "orders", action: "manage", description: "Manage orders" },
    { resource: "customers", action: "manage", description: "Manage customers" },
    { resource: "marketing", action: "manage", description: "Manage campaigns" },
    { resource: "analytics", action: "view", description: "View analytics" },
    { resource: "ai", action: "configure", description: "Configure AI providers" },
    { resource: "settings", action: "manage", description: "Manage store settings" }
  ],
  STAFF: [
    { resource: "dashboard", action: "view", description: "View dashboard" },
    { resource: "products", action: "view", description: "View products" },
    { resource: "orders", action: "manage", description: "Process orders" },
    { resource: "customers", action: "view", description: "View customers" },
    { resource: "marketing", action: "view", description: "View campaigns" },
    { resource: "analytics", action: "view", description: "View analytics" }
  ],
  VIEWER: [
    { resource: "dashboard", action: "view", description: "View dashboard" },
    { resource: "products", action: "view", description: "View products" },
    { resource: "orders", action: "view", description: "View orders" },
    { resource: "customers", action: "view", description: "View customers" },
    { resource: "analytics", action: "view", description: "View analytics" },
    { resource: "settings", action: "view", description: "View settings" }
  ]
};

const roleDescriptions: Record<RoleName, string> = {
  ADMIN: "Platform administrators with full access.",
  MANAGER: "Store managers who can operate the business.",
  STAFF: "Operational staff with limited management access.",
  VIEWER: "Read-only users for monitoring and reporting."
};

async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32
  });
}

async function seedRolesAndPermissions() {
  const permissionIdsByRole = new Map<RoleName, string[]>();

  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: roleDescriptions[roleName] },
      create: { name: roleName, description: roleDescriptions[roleName] }
    });

    const permissionIds: string[] = [];

    for (const permission of permissionMap[roleName]) {
      const createdPermission = await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: permission.resource,
            action: permission.action
          }
        },
        update: { description: permission.description },
        create: {
          name: `${permission.resource}:${permission.action}`,
          description: permission.description,
          resource: permission.resource,
          action: permission.action
        }
      });

      permissionIds.push(createdPermission.id);

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: createdPermission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: createdPermission.id
        }
      });
    }

    permissionIdsByRole.set(roleName, permissionIds);
  }

  return permissionIdsByRole;
}

async function main() {
  await seedRolesAndPermissions();

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMIN } });
  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);

  const adminUser = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: {
      name: "AutoDrop Admin",
      passwordHash,
      roleId: adminRole.id,
      status: UserStatus.ACTIVE
    },
    create: {
      email: env.SEED_ADMIN_EMAIL,
      name: "AutoDrop Admin",
      passwordHash,
      roleId: adminRole.id,
      status: UserStatus.ACTIVE
    }
  });

  const store = await prisma.store.upsert({
    where: { slug: env.SEED_STORE_SLUG },
    update: {
      name: env.SEED_STORE_NAME,
      ownerId: adminUser.id,
      status: StoreStatus.ACTIVE
    },
    create: {
      name: env.SEED_STORE_NAME,
      slug: env.SEED_STORE_SLUG,
      description: "Phase 1 demo store",
      ownerId: adminUser.id,
      status: StoreStatus.ACTIVE
    }
  });

  await prisma.supplier.upsert({
    where: { id: "seed-printify-supplier" },
    update: {
      storeId: store.id,
      name: "Printify Demo Supplier",
      type: SupplierType.PRINTIFY
    },
    create: {
      id: "seed-printify-supplier",
      storeId: store.id,
      name: "Printify Demo Supplier",
      type: SupplierType.PRINTIFY,
      isActive: true,
      settings: { syncMode: "manual" }
    }
  });

  const products = [
    {
      title: "Mountain Sunrise Tee",
      description: "Soft unisex tee featuring a sunrise graphic.",
      category: "Apparel",
      source: ProductSource.PRINTIFY,
      basePrice: "16.00",
      suggestedPrice: "29.00",
      tags: ["tshirt", "sunrise", "outdoor"],
      variants: [
        { title: "Black / M", sku: "MSUN-BLK-M", color: "Black", size: "M", price: "29.00", costPrice: "16.00" },
        { title: "Black / L", sku: "MSUN-BLK-L", color: "Black", size: "L", price: "29.00", costPrice: "16.00" }
      ]
    },
    {
      title: "Minimalist Desk Mat",
      description: "Large desk mat designed for modern workspaces.",
      category: "Home Office",
      source: ProductSource.MANUAL,
      basePrice: "12.50",
      suggestedPrice: "24.99",
      tags: ["desk", "workspace", "minimalist"],
      variants: [
        { title: "Gray", sku: "DMAT-GRY", color: "Gray", size: "Standard", price: "24.99", costPrice: "12.50" }
      ]
    },
    {
      title: "Pet Portrait Mug",
      description: "Custom mug optimized for print-on-demand personalization.",
      category: "Drinkware",
      source: ProductSource.PRINTIFY,
      basePrice: "8.75",
      suggestedPrice: "19.99",
      tags: ["mug", "pet", "gift"],
      variants: [
        { title: "11oz", sku: "PMUG-11OZ", color: "White", size: "11oz", price: "19.99", costPrice: "8.75" },
        { title: "15oz", sku: "PMUG-15OZ", color: "White", size: "15oz", price: "22.99", costPrice: "10.50" }
      ]
    }
  ];

  for (const item of products) {
    let product = await prisma.product.findFirst({
      where: {
        storeId: store.id,
        title: item.title
      }
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          storeId: store.id,
          title: item.title,
          description: item.description,
          status: ProductStatus.ACTIVE,
          source: item.source,
          category: item.category,
          tags: item.tags,
          etsyTags: item.tags,
          seoKeywords: item.tags,
          imageUrls: [],
          basePrice: item.basePrice,
          suggestedPrice: item.suggestedPrice
        }
      });
    }

    for (const variant of item.variants) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId: product.id,
          sku: variant.sku
        }
      });

      if (!existingVariant) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            title: variant.title,
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
            price: variant.price,
            costPrice: variant.costPrice
          }
        });
      }
    }
  }

  const customer = await prisma.customer.upsert({
    where: {
      storeId_email: {
        storeId: store.id,
        email: "customer@example.com"
      }
    },
    update: {
      name: "Taylor Customer",
      phone: "+1-555-0100",
      tags: ["seed", "vip"]
    },
    create: {
      storeId: store.id,
      email: "customer@example.com",
      name: "Taylor Customer",
      phone: "+1-555-0100",
      tags: ["seed", "vip"],
      address: {
        city: "Austin",
        country: "US",
        line1: "123 Demo Street",
        postalCode: "78701"
      }
    }
  });

  const firstProduct = await prisma.product.findFirstOrThrow({
    where: { storeId: store.id },
    include: { variants: true }
  });
  const firstVariant = firstProduct.variants[0];

  if (!firstVariant) {
    throw new Error("Seed variant missing for sample order creation.");
  }

  const existingOrder = await prisma.order.findUnique({
    where: {
      storeId_orderNumber: {
        storeId: store.id,
        orderNumber: "AD-1001"
      }
    }
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        storeId: store.id,
        customerId: customer.id,
        orderNumber: "AD-1001",
        subtotal: "29.00",
        taxAmount: "2.32",
        shippingAmount: "4.99",
        discountAmount: "0.00",
        totalAmount: "36.31",
        shippingAddress: {
          city: "Austin",
          country: "US",
          line1: "123 Demo Street",
          postalCode: "78701"
        },
        billingAddress: {
          city: "Austin",
          country: "US",
          line1: "123 Demo Street",
          postalCode: "78701"
        },
        items: {
          create: {
            title: firstProduct.title,
            variantTitle: firstVariant.title,
            quantity: 1,
            unitPrice: "29.00",
            totalPrice: "29.00",
            costPrice: firstVariant.costPrice,
            sku: firstVariant.sku,
            productId: firstProduct.id,
            variantId: firstVariant.id
          }
        }
      }
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
