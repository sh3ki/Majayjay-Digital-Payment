import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { roleName: 'admin' },
    update: {},
    create: {
      roleName: 'admin',
      description: 'Full system access',
      permissions: ['users.*', 'fees.*', 'bills.*', 'payments.*', 'reports.*', 'settings.*', 'audit_logs.*'],
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { roleName: 'cashier' },
    update: {},
    create: {
      roleName: 'cashier',
      description: 'Payment recording and QR generation',
      permissions: ['payments.create', 'payments.read', 'bills.read', 'qr_codes.create', 'receipts.generate'],
    },
  });

  const deptViewerRole = await prisma.role.upsert({
    where: { roleName: 'department_viewer' },
    update: {},
    create: {
      roleName: 'department_viewer',
      description: 'Department-specific reports only',
      permissions: ['reports.read', 'bills.read', 'payments.read', 'analytics.read'],
    },
  });

  const residentRole = await prisma.role.upsert({
    where: { roleName: 'resident' },
    update: {},
    create: {
      roleName: 'resident',
      description: 'Self-service payments and bill viewing',
      permissions: ['bills.read.own', 'payments.create.own', 'payments.read.own', 'profile.read', 'profile.update'],
    },
  });

  // Departments
  const financeDept = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: {
      departmentName: 'Finance Department',
      contactEmail: 'finance@majayjay.gov.ph',
      contactPhone: '(049) 000-0001',
      officeLocation: 'Ground Floor, Municipal Hall',
    },
  });

  const assessorDept = await prisma.department.upsert({
    where: { id: 2 },
    update: {},
    create: {
      departmentName: "Assessor's Office",
      contactEmail: 'assessor@majayjay.gov.ph',
      contactPhone: '(049) 000-0002',
      officeLocation: '2nd Floor, Municipal Hall',
    },
  });

  const treasurerDept = await prisma.department.upsert({
    where: { id: 3 },
    update: {},
    create: {
      departmentName: "City Treasurer's Office",
      contactEmail: 'treasurer@majayjay.gov.ph',
      contactPhone: '(049) 000-0003',
      officeLocation: 'Ground Floor, Municipal Hall',
    },
  });

  // Admin user
  const hashedPassword = await bcrypt.hash('Admin@12345', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@majayjay.gov.ph' },
    update: {},
    create: {
      email: 'admin@majayjay.gov.ph',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      contactNumber: '09000000001',
      roleId: adminRole.id,
      departmentId: financeDept.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@majayjay.gov.ph' },
    update: {},
    create: {
      email: 'cashier@majayjay.gov.ph',
      passwordHash: await bcrypt.hash('Cashier@12345', 10),
      firstName: 'Maria',
      lastName: 'Santos',
      contactNumber: '09000000002',
      roleId: cashierRole.id,
      departmentId: financeDept.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const residentUser = await prisma.user.upsert({
    where: { email: 'resident@example.com' },
    update: {},
    create: {
      email: 'resident@example.com',
      passwordHash: await bcrypt.hash('Resident@12345', 10),
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      contactNumber: '09000000003',
      roleId: residentRole.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Fee categories
  const rptCategory = await prisma.feeCategory.upsert({
    where: { id: 1 },
    update: {},
    create: { categoryName: 'Real Property Tax', description: 'Annual real property tax', displayOrder: 1 },
  });

  const cedulaCategory = await prisma.feeCategory.upsert({
    where: { id: 2 },
    update: {},
    create: { categoryName: 'Cedula', description: 'Community Tax Certificate', displayOrder: 2 },
  });

  const businessTaxCategory = await prisma.feeCategory.upsert({
    where: { id: 3 },
    update: {},
    create: { categoryName: 'Business Tax', description: 'Annual business tax', displayOrder: 3 },
  });

  const utilityCategory = await prisma.feeCategory.upsert({
    where: { id: 4 },
    update: {},
    create: { categoryName: 'Utility Services', description: 'Water and electricity bills', displayOrder: 4 },
  });

  const permitsCategory = await prisma.feeCategory.upsert({
    where: { id: 5 },
    update: {},
    create: { categoryName: 'Permits & Licenses', description: 'Business permits and professional licenses', displayOrder: 5 },
  });

  const miscCategory = await prisma.feeCategory.upsert({
    where: { id: 6 },
    update: {},
    create: { categoryName: 'Miscellaneous Fees', description: 'Other government fees', displayOrder: 6 },
  });

  // Fees
  const rptFee = await prisma.fee.upsert({
    where: { id: 1 },
    update: {},
    create: {
      feeName: 'Real Property Tax (RPT)',
      description: 'Annual real property tax based on assessed value',
      categoryId: rptCategory.id,
      feeType: 'PERCENTAGE',
      percentageRate: 1.5,
      applicableTo: 'BOTH',
      createdById: adminUser.id,
    },
  });

  const cedulaFee = await prisma.fee.upsert({
    where: { id: 2 },
    update: {},
    create: {
      feeName: 'Community Tax Certificate (Cedula)',
      description: 'Annual community tax certificate',
      categoryId: cedulaCategory.id,
      feeType: 'FIXED',
      baseAmount: 500,
      applicableTo: 'INDIVIDUAL',
      createdById: adminUser.id,
    },
  });

  const businessTaxFee = await prisma.fee.upsert({
    where: { id: 3 },
    update: {},
    create: {
      feeName: 'Business Tax',
      description: 'Annual business tax based on gross receipts',
      categoryId: businessTaxCategory.id,
      feeType: 'PERCENTAGE',
      percentageRate: 2.0,
      applicableTo: 'BUSINESS',
      createdById: adminUser.id,
    },
  });

  const waterFee = await prisma.fee.upsert({
    where: { id: 4 },
    update: {},
    create: {
      feeName: 'Water Bill',
      description: 'Monthly water consumption bill',
      categoryId: utilityCategory.id,
      feeType: 'VARIABLE',
      baseAmount: 150,
      unitName: 'Cubic Meter',
      unitRate: 25,
      applicableTo: 'BOTH',
      createdById: adminUser.id,
    },
  });

  const businessPermitFee = await prisma.fee.upsert({
    where: { id: 5 },
    update: {},
    create: {
      feeName: 'Business Permit',
      description: 'Annual business permit fee',
      categoryId: permitsCategory.id,
      feeType: 'FIXED',
      baseAmount: 1500,
      applicableTo: 'BUSINESS',
      createdById: adminUser.id,
    },
  });

  // Penalty rules
  await prisma.penaltyRule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      feeId: rptFee.id,
      penaltyType: 'LATE',
      calculationMethod: 'PERCENTAGE',
      amountOrRate: 2.0,
      gracePeriodDays: 30,
      applyMonthly: true,
      createdById: adminUser.id,
    },
  });

  await prisma.penaltyRule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      feeId: businessTaxFee.id,
      penaltyType: 'SURCHARGE',
      calculationMethod: 'PERCENTAGE',
      amountOrRate: 25.0,
      gracePeriodDays: 60,
      maxPenaltyAmount: 5000,
      createdById: adminUser.id,
    },
  });

  // Payment methods
  await prisma.paymentMethod.upsert({
    where: { methodName: 'Cash' },
    update: {},
    create: {
      methodName: 'Cash',
      provider: 'In-Person',
      isActive: true,
      requiresVerification: false,
      settlementDays: 0,
    },
  });

  await prisma.paymentMethod.upsert({
    where: { methodName: 'GCash' },
    update: {},
    create: {
      methodName: 'GCash',
      provider: 'PayMongo',
      isActive: true,
      requiresVerification: true,
      maxTransactionAmount: 100000,
      minTransactionAmount: 1,
      settlementDays: 1,
      transactionFeePercent: 1.5,
    },
  });

  await prisma.paymentMethod.upsert({
    where: { methodName: 'Maya' },
    update: {},
    create: {
      methodName: 'Maya',
      provider: 'PayMongo',
      isActive: true,
      requiresVerification: true,
      maxTransactionAmount: 100000,
      minTransactionAmount: 1,
      settlementDays: 1,
      transactionFeePercent: 1.5,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('👤 Default accounts:');
  console.log('  Admin:    admin@majayjay.gov.ph    / Admin@12345');
  console.log('  Cashier:  cashier@majayjay.gov.ph  / Cashier@12345');
  console.log('  Resident: resident@example.com     / Resident@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
