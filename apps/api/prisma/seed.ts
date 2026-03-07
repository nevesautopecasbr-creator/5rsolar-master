import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  "iam.read",
  "iam.write",
  "cadastros.read",
  "cadastros.write",
  "leads.read",
  "leads.write",
  "projetos.read",
  "projetos.write",
  "contratos.read",
  "contratos.write",
  "compras.read",
  "compras.write",
  "obras.read",
  "obras.write",
  "financeiro.read",
  "financeiro.write",
  "precificacao.read",
  "precificacao.write",
  "posproposta.read",
  "posproposta.write",
  "posvenda.read",
  "posvenda.write",
];

async function main() {
  const companyName = process.env.SEED_COMPANY_NAME ?? "Empresa Demo";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@erp.local";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";

  let company = await prisma.company.findFirst({
    where: { name: companyName },
  });

  if (!company) {
    company = await prisma.company.create({
      data: { name: companyName, isActive: true },
    });
  }

  const adminPasswordHash = await hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      isActive: true,
    },
  });

  await prisma.companyMembership.upsert({
    where: { companyId_userId: { companyId: company.id, userId: adminUser.id } },
    update: { isActive: true },
    create: {
      companyId: company.id,
      userId: adminUser.id,
      isActive: true,
    },
  });

  const role = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Admin" } },
    update: { isActive: true },
    create: {
      companyId: company.id,
      name: "Admin",
      description: "Acesso total",
      isActive: true,
    },
  });

  const permissionRecords = await Promise.all(
    permissions.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: { resource: name.split(".")[0], action: name.split(".")[1] },
        create: {
          name,
          resource: name.split(".")[0],
          action: name.split(".")[1],
          companyId: company.id,
        },
      }),
    ),
  );

  await prisma.rolePermission.createMany({
    data: permissionRecords.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: role.id } },
    update: {},
    create: { userId: adminUser.id, roleId: role.id, companyId: company.id },
  });

  await prisma.pricingSettings.upsert({
    where: { companyId: company.id },
    update: { desiredProfitPct: 0.2 },
    create: {
      companyId: company.id,
      desiredProfitPct: 0.2,
    },
  });

  await prisma.fixedExpense.deleteMany({ where: { companyId: company.id } });
  await prisma.fixedExpense.createMany({
    data: [
      { companyId: company.id, description: "Equipe administrativa", monthlyValue: 12000 },
      { companyId: company.id, description: "Aluguel e utilidades", monthlyValue: 4500 },
      { companyId: company.id, description: "Ferramentas e software", monthlyValue: 1800 },
    ],
  });

  await prisma.variableExpense.deleteMany({ where: { companyId: company.id } });
  await prisma.variableExpense.createMany({
    data: [
      { companyId: company.id, description: "Impostos", pct: 0.08 },
      { companyId: company.id, description: "Comissões", pct: 0.05 },
      { companyId: company.id, description: "Marketing", pct: 0.03 },
    ],
  });

  const year = new Date().getFullYear();
  await prisma.revenueBaseMonthly.deleteMany({
    where: { companyId: company.id, year },
  });
  await prisma.revenueBaseMonthly.createMany({
    data: Array.from({ length: 12 }, (_, index) => ({
      companyId: company.id,
      year,
      month: index + 1,
      revenueValue: index < 6 ? 120000 : 0,
    })),
  });

  await prisma.pricingItem.deleteMany({ where: { companyId: company.id } });
  await prisma.pricingItem.createMany({
    data: [
      {
        companyId: company.id,
        type: "PROJECT",
        name: "Projeto residencial 5kWp",
        costValue: 18000,
        currentPrice: 28000,
      },
      {
        companyId: company.id,
        type: "KIT",
        name: "Kit 3kWp",
        costValue: 9500,
        currentPrice: 14500,
      },
      {
        companyId: company.id,
        type: "CREDIT",
        name: "Crédito 500 kWh",
        costValue: 0,
        currentPrice: 750,
      },
    ],
  });

  // Produtos de energia solar (módulos, inversores, microinversores) – referência 2025/2026
  const solarProducts = [
    // Módulos fotovoltaicos
    { name: "JA Solar JAM72S30 550W MR", sku: "JAS-550", unit: "un", cost: 650, price: 780 },
    { name: "Trina Solar Vertex S TSM-DE09 425W", sku: "TRN-425", unit: "un", cost: 500, price: 595 },
    { name: "Canadian Solar HiKu6 CS6W-550MS 550W", sku: "CSA-550", unit: "un", cost: 680, price: 825 },
    { name: "BYD Double Glass 450W", sku: "BYD-450", unit: "un", cost: 520, price: 720 },
    { name: "Longi Hi-MO 6 580W", sku: "LNG-580", unit: "un", cost: 720, price: 870 },
    { name: "JinkoSolar Tiger Neo 585W", sku: "JKS-585", unit: "un", cost: 700, price: 850 },
    { name: "Risen RSM132-8-550BNDG 550W", sku: "RSN-550", unit: "un", cost: 620, price: 750 },
    { name: "Phono Solar PS-M54-460 460W", sku: "PHO-460", unit: "un", cost: 480, price: 600 },
    // Inversores solares (string)
    { name: "Growatt MID 3KTL3-X 3kW", sku: "GRW-3K", unit: "un", cost: 1800, price: 2400 },
    { name: "Growatt MID 5KTL3-X 5kW", sku: "GRW-5K", unit: "un", cost: 2600, price: 3400 },
    { name: "Growatt MID 8KTL3-X 8kW", sku: "GRW-8K", unit: "un", cost: 3800, price: 4900 },
    { name: "Growatt MID 10KTL3-X 10kW", sku: "GRW-10K", unit: "un", cost: 4500, price: 5800 },
    { name: "Growatt MID 25KTL3-X 25kW", sku: "GRW-25K", unit: "un", cost: 10000, price: 12590 },
    { name: "Sungrow SG3K6-S 3.6kW", sku: "SUN-3K6", unit: "un", cost: 2200, price: 2900 },
    { name: "Sungrow SG6K-S 6kW", sku: "SUN-6K", unit: "un", cost: 3200, price: 4200 },
    { name: "Sungrow SG10K-S 10kW", sku: "SUN-10K", unit: "un", cost: 5000, price: 6500 },
    { name: "Sungrow SG75CX-LV 75kW", sku: "SUN-75K", unit: "un", cost: 26000, price: 31399 },
    { name: "Huawei SUN2000-5KTL-M1 5kW", sku: "HUA-5K", unit: "un", cost: 3200, price: 4200 },
    { name: "Huawei SUN2000-10KTL-M1 10kW", sku: "HUA-10K", unit: "un", cost: 5200, price: 6800 },
    { name: "Solis RHI-5K-48ES-5G 5kW", sku: "SOL-5K", unit: "un", cost: 2500, price: 3300 },
    { name: "Solis RHI-10K-48ES-5G 10kW", sku: "SOL-10K", unit: "un", cost: 4200, price: 5500 },
    { name: "SAJ R5 5kW", sku: "SAJ-5K", unit: "un", cost: 2400, price: 3100 },
    { name: "SAJ R8 8kW", sku: "SAJ-8K", unit: "un", cost: 3600, price: 4700 },
    // Microinversores
    { name: "Enphase IQ7+ Microinversor (até 440W)", sku: "ENP-IQ7+", unit: "un", cost: 950, price: 1250 },
    { name: "Enphase IQ7A Microinversor (até 465W)", sku: "ENP-IQ7A", unit: "un", cost: 1050, price: 1380 },
    { name: "Enphase IQ8H Microinversor 384VA", sku: "ENP-IQ8H", unit: "un", cost: 1200, price: 1580 },
    { name: "Enphase IQ8HC Microinversor 72 células", sku: "ENP-IQ8HC", unit: "un", cost: 1150, price: 1520 },
    { name: "Enphase IQ8AC Microinversor", sku: "ENP-IQ8AC", unit: "un", cost: 1100, price: 1450 },
    { name: "Huawei SUN2000-450W-P Optimizer", sku: "HUA-OPT-450", unit: "un", cost: 380, price: 520 },
  ];

  await prisma.product.deleteMany({ where: { companyId: company.id } });
  await prisma.product.createMany({
    data: solarProducts.map((p) => ({
      companyId: company.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      cost: p.cost,
      price: p.price,
      isActive: true,
    })),
  });

  const template = await prisma.contractTemplate.create({
    data: {
      companyId: company.id,
      name: "Contrato padrão",
      content:
        "<h2>Contrato de Prestação</h2><p>Cliente: {{customerName}}</p><p>Documento: {{customerDocument}}</p><p>Projeto: {{projectName}}</p><p>Assinante: {{signedName}}</p>",
      isActive: true,
    },
  });

  const checklistTemplate = await prisma.implementationChecklistTemplate.create({
    data: {
      companyId: company.id,
      name: "Implantação padrão",
      isDefault: true,
    },
  });

  await prisma.implementationChecklistTemplateItem.createMany({
    data: [
      {
        templateId: checklistTemplate.id,
        title: "Conferir dados do cliente",
        department: "CONTRACTS",
        isRequired: true,
        defaultDueDays: 1,
        orderIndex: 1,
      },
      {
        templateId: checklistTemplate.id,
        title: "Validar documentação",
        department: "CONTRACTS",
        isRequired: true,
        defaultDueDays: 2,
        orderIndex: 2,
      },
      {
        templateId: checklistTemplate.id,
        title: "Vincular usina/crédito",
        department: "OPERATIONS",
        isRequired: true,
        defaultDueDays: 3,
        orderIndex: 3,
      },
      {
        templateId: checklistTemplate.id,
        title: "Configurar cobrança recorrente",
        department: "FINANCE",
        isRequired: true,
        defaultDueDays: 4,
        orderIndex: 4,
      },
      {
        templateId: checklistTemplate.id,
        title: "Confirmar data início e comunicação ao cliente",
        department: "COMMERCIAL",
        isRequired: true,
        defaultDueDays: 5,
        orderIndex: 5,
      },
      {
        templateId: checklistTemplate.id,
        title: "Registrar evidências",
        department: "OPERATIONS",
        isRequired: false,
        defaultDueDays: 6,
        orderIndex: 6,
      },
    ],
  });

  console.log("Seed concluído:", {
    company: company.name,
    adminEmail: adminUser.email,
  });
}

main()
  .catch((error) => {
    console.error("Seed falhou:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
