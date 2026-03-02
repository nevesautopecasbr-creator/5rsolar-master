import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  "iam.read",
  "iam.write",
  "cadastros.read",
  "cadastros.write",
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
