import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ────────────────────────────────────────────────────────────────
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

  await prisma.role.upsert({
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

  // ─── Payment Methods (stable reference data — upsert) ─────────────────────
  await prisma.paymentMethod.upsert({
    where: { methodName: 'Cash' },
    update: {},
    create: { methodName: 'Cash', provider: 'In-Person', isActive: true, requiresVerification: false, settlementDays: 0 },
  });
  await prisma.paymentMethod.upsert({
    where: { methodName: 'GCash' },
    update: {},
    create: { methodName: 'GCash', provider: 'PayMongo', isActive: true, requiresVerification: true, maxTransactionAmount: 100000, minTransactionAmount: 1, settlementDays: 1, transactionFeePercent: 1.5 },
  });
  await prisma.paymentMethod.upsert({
    where: { methodName: 'Maya' },
    update: {},
    create: { methodName: 'Maya', provider: 'PayMongo', isActive: true, requiresVerification: true, maxTransactionAmount: 100000, minTransactionAmount: 1, settlementDays: 1, transactionFeePercent: 1.5 },
  });

  // ─── Cleanup: Remove all fee-related and department data before re-seeding ─
  console.log('🧹 Cleaning up existing fee/department data...');
  await prisma.officialReceipt.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.penalty.deleteMany({});
  await prisma.penaltyRule.deleteMany({});
  await prisma.billItem.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.feeCategory.deleteMany({});
  await prisma.department.updateMany({ data: { departmentHeadId: null } });
  await prisma.user.updateMany({ data: { departmentId: null } });
  await prisma.department.deleteMany({});

  // ─── Departments ──────────────────────────────────────────────────────────
  console.log('🏢 Creating departments...');

  const mwd = await prisma.department.create({
    data: { departmentName: 'Municipal Waterworks District (MWD)', contactEmail: 'mwd@majayjay.gov.ph', contactPhone: '(049) 501-0001', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const lageco = await prisma.department.create({
    data: { departmentName: 'LAGECO / Electric Cooperative', contactEmail: 'lageco@majayjay.gov.ph', contactPhone: '(049) 501-0002', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const mto = await prisma.department.create({
    data: { departmentName: "Municipal Treasurer's Office (MTO)", contactEmail: 'treasurer@majayjay.gov.ph', contactPhone: '(049) 501-0003', officeLocation: 'Ground Floor, Municipal Hall, Majayjay, Laguna' },
  });
  const bplo = await prisma.department.create({
    data: { departmentName: 'Business Permits and Licensing Office (BPLO)', contactEmail: 'bplo@majayjay.gov.ph', contactPhone: '(049) 501-0004', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const engMpdo = await prisma.department.create({
    data: { departmentName: 'Municipal Engineering Office / MPDO', contactEmail: 'engineering@majayjay.gov.ph', contactPhone: '(049) 501-0005', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const lcro = await prisma.department.create({
    data: { departmentName: 'Local Civil Registry Office (LCRO)', contactEmail: 'lcro@majayjay.gov.ph', contactPhone: '(049) 501-0006', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const tourism = await prisma.department.create({
    data: { departmentName: 'Municipal Tourism Office', contactEmail: 'tourism@majayjay.gov.ph', contactPhone: '(049) 501-0007', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const mayorsOffice = await prisma.department.create({
    data: { departmentName: "Mayor's Office", contactEmail: 'mayor@majayjay.gov.ph', contactPhone: '(049) 501-0008', officeLocation: '2nd Floor, Municipal Hall, Majayjay, Laguna' },
  });
  const barangayHalls = await prisma.department.create({
    data: { departmentName: 'Barangay Halls (40 Barangays of Majayjay)', contactEmail: 'barangay@majayjay.gov.ph', contactPhone: '(049) 501-0009', officeLocation: 'Various Barangay Halls, Majayjay, Laguna' },
  });
  const mswd = await prisma.department.create({
    data: { departmentName: 'Schools Division / MSWD', contactEmail: 'mswd@majayjay.gov.ph', contactPhone: '(049) 501-0010', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const mho = await prisma.department.create({
    data: { departmentName: 'Municipal Health Office (MHO)', contactEmail: 'health@majayjay.gov.ph', contactPhone: '(049) 501-0011', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const marketAdmin = await prisma.department.create({
    data: { departmentName: 'Municipal Market Administration', contactEmail: 'market@majayjay.gov.ph', contactPhone: '(049) 501-0012', officeLocation: 'Majayjay Public Market, Majayjay, Laguna' },
  });
  const menro = await prisma.department.create({
    data: { departmentName: 'Municipal Environment and Natural Resources Office (MENRO)', contactEmail: 'menro@majayjay.gov.ph', contactPhone: '(049) 501-0013', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const agriculturist = await prisma.department.create({
    data: { departmentName: 'Municipal Agriculturist Office', contactEmail: 'agriculture@majayjay.gov.ph', contactPhone: '(049) 501-0014', officeLocation: 'Municipal Hall, Majayjay, Laguna' },
  });
  const impoundingArea = await prisma.department.create({
    data: { departmentName: 'Municipal Impounding Area', contactEmail: 'impound@majayjay.gov.ph', contactPhone: '(049) 501-0015', officeLocation: 'Majayjay Impounding Area, Majayjay, Laguna' },
  });

  // All departments used — no suppression needed

  console.log('  ✓ 15 departments created');

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@majayjay.gov.ph' },
    update: { departmentId: mto.id },
    create: {
      email: 'admin@majayjay.gov.ph',
      passwordHash: await bcrypt.hash('Admin@12345', 10),
      firstName: 'System',
      lastName: 'Administrator',
      contactNumber: '09000000001',
      roleId: adminRole.id,
      departmentId: mto.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cashier@majayjay.gov.ph' },
    update: { departmentId: mto.id },
    create: {
      email: 'cashier@majayjay.gov.ph',
      passwordHash: await bcrypt.hash('Cashier@12345', 10),
      firstName: 'Maria',
      lastName: 'Santos',
      contactNumber: '09000000002',
      roleId: cashierRole.id,
      departmentId: mto.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
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

  // ─── Fee Categories ───────────────────────────────────────────────────────
  console.log('🗂️  Creating fee categories...');

  const catWater        = await prisma.feeCategory.create({ data: { categoryName: 'Water Services',                         description: 'Municipal Waterworks District (MWD/MWSS) — water bills, connections, and related fees',                                displayOrder: 1,  departmentId: mwd.id         } });
  const catElectric     = await prisma.feeCategory.create({ data: { categoryName: 'Electric Services',                      description: 'DLPC / LAGECO Electric Cooperative — service connections, deposits, and electric fees',                              displayOrder: 2,  departmentId: lageco.id      } });
  const catRPT          = await prisma.feeCategory.create({ data: { categoryName: 'Real Property Tax (RPT)',                 description: "Municipal Treasurer's Office — annual real property tax and related charges",                                        displayOrder: 3,  departmentId: mto.id         } });
  const catCedula       = await prisma.feeCategory.create({ data: { categoryName: 'Community Tax Certificate (Cedula)',      description: "Municipal Treasurer's Office — annual community tax certificate for individuals and corporations",                   displayOrder: 4,  departmentId: mto.id         } });
  const catBusiness     = await prisma.feeCategory.create({ data: { categoryName: "Business / Mayor's Permit",              description: 'BPLO — annual business permit, local business tax, and related fees',                                               displayOrder: 5,  departmentId: bplo.id        } });
  const catBuilding     = await prisma.feeCategory.create({ data: { categoryName: 'Building & Construction Permits',        description: 'Municipal Engineering Office / MPDO — building, electrical, plumbing, and occupancy permits',                       displayOrder: 6,  departmentId: engMpdo.id     } });
  const catCivilReg     = await prisma.feeCategory.create({ data: { categoryName: 'Civil Registry Services',                description: 'Local Civil Registry Office (LCRO) — civil documents, certificates, and licenses',                                  displayOrder: 7,  departmentId: lcro.id        } });
  const catTransport    = await prisma.feeCategory.create({ data: { categoryName: 'Transportation & Franchise Fees',        description: 'TODA / Municipal Treasurer — tricycle and transport franchise permits',                                             displayOrder: 8,  departmentId: mto.id         } });
  const catParking      = await prisma.feeCategory.create({ data: { categoryName: 'Parking & Road Use Fees',                description: "Municipal Engineer's Office — public parking, road permits, and clearances",                                        displayOrder: 9,  departmentId: engMpdo.id     } });
  const catTourism      = await prisma.feeCategory.create({ data: { categoryName: 'Tourism & Recreation Fees',              description: 'Municipal Tourism Office — Taytay Falls and tourist site entrance/camping fees',                                    displayOrder: 10, departmentId: tourism.id     } });
  const catVenues       = await prisma.feeCategory.create({ data: { categoryName: 'Venues & Events Fees',                   description: "Mayor's Office — rental of municipal facilities and event/film permits",                                           displayOrder: 11, departmentId: mayorsOffice.id } });
  const catBarangay     = await prisma.feeCategory.create({ data: { categoryName: 'Barangay Services',                      description: '40 Barangay Halls of Majayjay — clearances, certifications, and mediation fees',                                    displayOrder: 12, departmentId: barangayHalls.id } });
  const catBarangayTax  = await prisma.feeCategory.create({ data: { categoryName: 'Barangay Tax',                           description: 'Barangay Treasurers — barangay business tax and annual registration fees',                                          displayOrder: 13, departmentId: barangayHalls.id } });
  const catEducation    = await prisma.feeCategory.create({ data: { categoryName: 'Education & Social Services',            description: 'Schools Division / MSWD — school clearances, ID applications, and scholarship fees',                                 displayOrder: 14, departmentId: mswd.id         } });
  const catHealth       = await prisma.feeCategory.create({ data: { categoryName: 'Health & Sanitation Fees',               description: 'Municipal Health Office — health certificates, sanitary permits, and burial/exhumation fees',                       displayOrder: 15, departmentId: mho.id          } });
  const catMarket       = await prisma.feeCategory.create({ data: { categoryName: 'Public Market Fees',                     description: 'Municipal Market Administration — stall rentals, vendor permits, and stall transfer fees',                          displayOrder: 16, departmentId: marketAdmin.id  } });
  const catEnvironment  = await prisma.feeCategory.create({ data: { categoryName: 'Environmental Services',                 description: 'MENRO — garbage collection, tree-cutting permits, dog registration, and cemetery lots',                             displayOrder: 17, departmentId: menro.id        } });
  const catRecords      = await prisma.feeCategory.create({ data: { categoryName: 'Records & Administrative Fees',          description: 'Various Offices — photocopying, certified copies, notarial fees, and filing fees',                                  displayOrder: 18, departmentId: mto.id          } });
  const catAgriculture  = await prisma.feeCategory.create({ data: { categoryName: 'Agriculture & Fishery Fees',             description: 'Municipal Agriculturist Office — fishpond permits, livestock registration, and slaughter permits',                   displayOrder: 19, departmentId: agriculturist.id } });
  const catEnvViol      = await prisma.feeCategory.create({ data: { categoryName: 'Environmental Ordinance Violations',     description: 'MENRO — fines for environmental violations such as illegal tree cutting, quarrying, and pollution',                 displayOrder: 20, departmentId: menro.id        } });
  const catBizViol      = await prisma.feeCategory.create({ data: { categoryName: 'Business Ordinance Violations',          description: 'BPLO / Municipal Treasurer — fines for business regulation violations',                                            displayOrder: 21, departmentId: bplo.id         } });
  const catImpound      = await prisma.feeCategory.create({ data: { categoryName: 'Impoundment Fees',                       description: 'Municipal Impounding Area — vehicle impoundment and release processing fees',                                       displayOrder: 22, departmentId: impoundingArea.id } });

  console.log('  ✓ 22 fee categories created');

  // ─── Fees ─────────────────────────────────────────────────────────────────
  console.log('💰 Creating fees...');

  // ══ WATER SERVICES (MWD) ══════════════════════════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Water Bill - Residential Minimum Charge (0–15 cu.m.)',    description: 'Municipal Waterworks District | Minimum monthly charge covering first 0–15 cu.m. (₱40.00/mo)',                    categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 40,   applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Water Bill - Residential Excess Charge (per cu.m.)',      description: 'Municipal Waterworks District | Per cu.m. charge above 15 cu.m. (₱15–₱25/cu.m.)',                               categoryId: catWater.id, feeType: 'VARIABLE',   unitName: 'Cubic Meter',  unitRate: 15,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Water Bill - Commercial Minimum Charge',                  description: 'Municipal Waterworks District | Minimum monthly charge for commercial connections (₱300–₱500/mo)',               categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 300,  applicableTo: 'BUSINESS',   createdById: adminUser.id },
      { feeName: 'Water Bill - Commercial Excess Charge (per cu.m.)',       description: 'Municipal Waterworks District | Per cu.m. excess charge for commercial connections (₱20–₱40/cu.m.)',             categoryId: catWater.id, feeType: 'VARIABLE',   unitName: 'Cubic Meter',  unitRate: 20,  applicableTo: 'BUSINESS',   createdById: adminUser.id },
      { feeName: 'Water Bill - Institutional / Government Base Charge',     description: 'Municipal Waterworks District | Monthly base charge for institutional/government connections (₱200–₱400/mo)',    categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 200,  applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Water Connection / Installation Fee (New)',               description: 'Municipal Waterworks District | One-time fee for new water service connection (₱2,000–₱5,000)',                   categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 2000, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Water Meter Deposit (Refundable)',                        description: 'Municipal Waterworks District | Refundable security deposit for water meter (₱500–₱1,000)',                      categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 500,  applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Water Reconnection Fee',                                  description: 'Municipal Waterworks District | Fee for reconnection of disconnected water service (₱300–₱500)',                 categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 300,  applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Water Disconnection Fee',                                 description: 'Municipal Waterworks District | Fee for voluntary disconnection of water service (₱200–₱300)',                   categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 200,  applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Water Late Payment Surcharge',                            description: 'Municipal Waterworks District | 10% surcharge on unpaid water bill amount',                                      categoryId: catWater.id, feeType: 'PERCENTAGE', percentageRate: 10, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Water Meter Transfer / Relocation',                       description: 'Municipal Waterworks District | Fee for transferring or relocating a water meter (₱500–₱1,500)',                categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 500,  applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Water Potability Test Fee',                               description: 'Municipal Waterworks District | Fee for water quality and potability testing (₱200–₱500)',                      categoryId: catWater.id, feeType: 'FIXED',      baseAmount: 200,  applicableTo: 'BOTH',       createdById: adminUser.id },
    ],
  });

  // ══ ELECTRIC SERVICES (LAGECO) ════════════════════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Electric Service Connection Application',    description: 'DLPC / LAGECO | Application fee for new electric service connection (₱500–₱2,000)',                         categoryId: catElectric.id, feeType: 'FIXED',      baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Electric Meter Deposit (New Service)',       description: 'DLPC / LAGECO | Refundable security deposit for new electric service meter (₱1,000–₱3,000)',               categoryId: catElectric.id, feeType: 'FIXED',      baseAmount: 1000, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Electric Reconnection Fee (Regular Hours)', description: 'DLPC / LAGECO | Reconnection fee during regular business hours (₱300–₱500)',                                categoryId: catElectric.id, feeType: 'FIXED',      baseAmount: 300,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Electric Reconnection Fee (After Hours)',   description: 'DLPC / LAGECO | Reconnection fee outside regular business hours (₱500–₱1,000)',                            categoryId: catElectric.id, feeType: 'FIXED',      baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Transformer Installation Fee',              description: 'DLPC / LAGECO | Transformer installation for new or upgraded electric service (₱5,000–₱20,000)',            categoryId: catElectric.id, feeType: 'FIXED',      baseAmount: 5000, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Electric Service Entrance Inspection',      description: 'DLPC / LAGECO | Inspection fee for electric service entrance (₱200–₱500)',                                 categoryId: catElectric.id, feeType: 'FIXED',      baseAmount: 200,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Electric Late Payment Penalty',             description: 'DLPC / LAGECO | 3–5% of bill amount for late electric bill payment',                                       categoryId: catElectric.id, feeType: 'PERCENTAGE', percentageRate: 3, applicableTo: 'BOTH', createdById: adminUser.id },
    ],
  });

  // ══ REAL PROPERTY TAX (Municipal Treasurer's Office) ══════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Basic Real Property Tax (RPT)',    description: "Municipal Treasurer's Office | 1% of assessed value annually (Basic RPT rate)",                                                  categoryId: catRPT.id, feeType: 'PERCENTAGE', percentageRate: 1,   applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Special Education Fund (SEF) Tax', description: "Municipal Treasurer's Office | 1% of assessed value annually for Special Education Fund",                                       categoryId: catRPT.id, feeType: 'PERCENTAGE', percentageRate: 1,   applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'RPT Idle Land Surcharge',          description: "Municipal Treasurer's Office | 5% additional surcharge on assessed value for idle or unimproved land",                          categoryId: catRPT.id, feeType: 'PERCENTAGE', percentageRate: 5,   applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'RPT Late Payment Penalty',         description: "Municipal Treasurer's Office | 2% per month penalty on unpaid Real Property Tax",                                               categoryId: catRPT.id, feeType: 'PERCENTAGE', percentageRate: 2,   applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Tax Clearance Certificate',        description: "Municipal Treasurer's Office | Certificate of tax compliance (₱50–₱100)",                                                       categoryId: catRPT.id, feeType: 'FIXED',      baseAmount: 50,      applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Transfer Tax (Sale of Property)',  description: "Municipal Treasurer's Office | 0.5% of sale price for property transfer tax",                                                   categoryId: catRPT.id, feeType: 'PERCENTAGE', percentageRate: 0.5, applicableTo: 'BOTH', createdById: adminUser.id },
    ],
  });

  // ══ COMMUNITY TAX CERTIFICATE / CEDULA (Municipal Treasurer's Office) ═════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Cedula - Individual Basic Fee',                              description: "Municipal Treasurer's Office | Basic annual community tax for individuals (₱5.00)",                                                    categoryId: catCedula.id, feeType: 'FIXED',    baseAmount: 5,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Cedula - Individual Additional (per ₱1,000 Income)',         description: "Municipal Treasurer's Office | ₱1.00 per every ₱1,000 of annual income; maximum ₱5,000 total",                                        categoryId: catCedula.id, feeType: 'VARIABLE', unitName: '₱1,000 Income Bracket',        unitRate: 1, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Cedula - Corporation Basic Fee',                             description: "Municipal Treasurer's Office | Basic annual community tax for corporations (₱500.00)",                                                 categoryId: catCedula.id, feeType: 'FIXED',    baseAmount: 500, applicableTo: 'BUSINESS',  createdById: adminUser.id },
      { feeName: 'Cedula - Corporation Additional (per ₱5,000 Gross Receipts)', description: "Municipal Treasurer's Office | ₱2.00 per every ₱5,000 of gross receipts or earnings; maximum ₱10,000 total",                       categoryId: catCedula.id, feeType: 'VARIABLE', unitName: '₱5,000 Gross Receipts Bracket', unitRate: 2, applicableTo: 'BUSINESS',  createdById: adminUser.id },
    ],
  });

  // ══ BUSINESS / MAYOR'S PERMIT (BPLO) ══════════════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: "Business / Mayor's Permit Processing Fee", description: 'BPLO | Annual business permit processing and issuance fee (₱500–₱1,000)',                              categoryId: catBusiness.id, feeType: 'FIXED',      baseAmount: 500, applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Local Business Tax (LBT)',                 description: 'BPLO | Annual local business tax — percentage of gross receipts (rate varies by business type)',      categoryId: catBusiness.id, feeType: 'PERCENTAGE', percentageRate: 1, applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Sanitary Inspection Fee (Business)',       description: 'BPLO | Annual sanitary inspection fee for business establishments (₱200–₱500)',                       categoryId: catBusiness.id, feeType: 'FIXED',      baseAmount: 200, applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Garbage Collection Fee (Business Permit)', description: 'BPLO | Annual garbage collection fee for businesses (₱200–₱1,000)',                                  categoryId: catBusiness.id, feeType: 'FIXED',      baseAmount: 200, applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Zoning Clearance',                         description: 'BPLO | Zoning compliance clearance for business location (₱300–₱500)',                               categoryId: catBusiness.id, feeType: 'FIXED',      baseAmount: 300, applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Fire Safety Inspection Certificate',       description: 'BPLO | Fire safety inspection certificate — 10–15% of total business permit fees',                   categoryId: catBusiness.id, feeType: 'PERCENTAGE', percentageRate: 10, applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Business Permit Late Renewal Surcharge',   description: 'BPLO | 25% surcharge for business permit renewal submitted after January 20',                        categoryId: catBusiness.id, feeType: 'PERCENTAGE', percentageRate: 25, applicableTo: 'BUSINESS', createdById: adminUser.id },
    ],
  });

  // ══ BUILDING & CONSTRUCTION PERMITS (Engineering / MPDO) ═════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Building Permit',         description: 'Municipal Engineering Office / MPDO | ₱1–₱6 per square meter of total floor area',             categoryId: catBuilding.id, feeType: 'VARIABLE', unitName: 'Square Meter', unitRate: 1, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Electrical Permit',       description: 'Municipal Engineering Office / MPDO | Permit for electrical installation work (₱500–₱2,000)',   categoryId: catBuilding.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Plumbing Permit',         description: 'Municipal Engineering Office / MPDO | Permit for plumbing installation work (₱300–₱1,500)',     categoryId: catBuilding.id, feeType: 'FIXED', baseAmount: 300,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Fencing Permit',          description: 'Municipal Engineering Office / MPDO | Permit for fence construction (₱200–₱500)',               categoryId: catBuilding.id, feeType: 'FIXED', baseAmount: 200,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Demolition Permit',       description: 'Municipal Engineering Office / MPDO | Permit for building demolition (₱500–₱1,000)',            categoryId: catBuilding.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Certificate of Occupancy', description: 'Municipal Engineering Office / MPDO | Occupancy certificate for completed buildings (₱1,000–₱3,000)', categoryId: catBuilding.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'BOTH', createdById: adminUser.id },
    ],
  });

  // ══ CIVIL REGISTRY SERVICES (LCRO) ════════════════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Birth Certificate (Certified Copy)',   description: 'LCRO | Certified copy of birth certificate (₱150–₱200)',                                                          categoryId: catCivilReg.id, feeType: 'FIXED', baseAmount: 150,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Marriage Certificate',                 description: 'LCRO | Certified copy of marriage certificate (₱150–₱200)',                                                       categoryId: catCivilReg.id, feeType: 'FIXED', baseAmount: 150,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Death Certificate',                    description: 'LCRO | Certified copy of death certificate (₱150–₱200)',                                                          categoryId: catCivilReg.id, feeType: 'FIXED', baseAmount: 150,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Marriage License',                     description: 'LCRO | Marriage license application fee (₱500–₱750)',                                                             categoryId: catCivilReg.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Correction of Entries (RA 9048)',      description: 'LCRO | Administrative correction of civil registry entries under Republic Act 9048 (₱1,000–₱3,000)',            categoryId: catCivilReg.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Change of First Name',                 description: 'LCRO | Administrative change of first name in civil registry (₱3,000)',                                          categoryId: catCivilReg.id, feeType: 'FIXED', baseAmount: 3000, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: "Mayor's / Municipal Clearance",        description: 'LCRO | Municipal clearance certificate (₱100–₱200)',                                                             categoryId: catCivilReg.id, feeType: 'FIXED', baseAmount: 100,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ TRANSPORTATION & FRANCHISE FEES (TODA / Municipal Treasurer) ══════════
  await prisma.fee.createMany({
    data: [
      { feeName: "Tricycle Operator's Permit (TOP)",       description: "TODA / Municipal Treasurer | Annual tricycle operator's permit (₱500–₱1,000/yr)",             categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: "Tricycle Driver's Permit (TDP)",         description: "TODA / Municipal Treasurer | Annual tricycle driver's permit (₱200–₱500/yr)",                 categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 200,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Tricycle Franchise Fee (New Application)', description: 'TODA / Municipal Treasurer | New tricycle franchise application fee (₱1,000–₱2,000)',      categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Tricycle Franchise Renewal',             description: 'TODA / Municipal Treasurer | Annual tricycle franchise renewal fee (₱500–₱1,000/yr)',         categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Body Number Sticker Fee',                description: 'TODA / Municipal Treasurer | Body number sticker issuance for tricycles (₱50–₱100)',          categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 50,   applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Change of Unit (Franchise Replacement)', description: 'TODA / Municipal Treasurer | Fee for replacing unit under existing franchise (₱500–₱1,000)', categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Transfer of Franchise',                  description: 'TODA / Municipal Treasurer | Tricycle franchise transfer fee (₱1,000–₱2,000)',               categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Terminal Fee (Per Trip)',                 description: 'TODA / Municipal Treasurer | Per trip terminal fee at designated terminals (₱2–₱5)',          categoryId: catTransport.id, feeType: 'FIXED', baseAmount: 2,    applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ PARKING & ROAD USE FEES (Municipal Engineer's Office) ════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Parking Fee (Public Lots)',              description: "Municipal Engineer's Office | Hourly parking fee at municipal public lots (₱10–₱30/hr)",                 categoryId: catParking.id, feeType: 'VARIABLE', unitName: 'Hour', unitRate: 10, applicableTo: 'BOTH',     createdById: adminUser.id },
      { feeName: 'Road Right-of-Way Permit',               description: "Municipal Engineer's Office | Permit for use of road right-of-way (₱500–₱2,000)",                      categoryId: catParking.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH',     createdById: adminUser.id },
      { feeName: 'Road Excavation Permit',                 description: "Municipal Engineer's Office | Permit for road excavation or digging works (₱1,000–₱5,000)",            categoryId: catParking.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'BOTH',     createdById: adminUser.id },
      { feeName: 'Heavy Equipment Road Use Permit',        description: "Municipal Engineer's Office | Permit for heavy equipment road use or transport (₱500–₱2,000)",         categoryId: catParking.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH',     createdById: adminUser.id },
      { feeName: 'Loading / Unloading Zone Clearance',     description: "Municipal Engineer's Office | Clearance for designated loading/unloading zone (₱300–₱500)",            categoryId: catParking.id, feeType: 'FIXED', baseAmount: 300,  applicableTo: 'BUSINESS', createdById: adminUser.id },
    ],
  });

  // ══ TOURISM & RECREATION FEES (Municipal Tourism Office) ══════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Entrance Fee - Local Tourist (Taytay Falls)',   description: 'Municipal Tourism Office | Entrance fee for local tourists at Taytay Falls and tourist sites (₱20–₱50/person)',  categoryId: catTourism.id, feeType: 'FIXED', baseAmount: 20,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Entrance Fee - Foreign Tourist (Taytay Falls)', description: 'Municipal Tourism Office | Entrance fee for foreign tourists at Taytay Falls and tourist sites (₱50–₱100/person)', categoryId: catTourism.id, feeType: 'FIXED', baseAmount: 50,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Tourist Site Parking Fee',                      description: 'Municipal Tourism Office | Parking fee for tourist vehicles at municipal tourist sites (₱20–₱50/vehicle)',         categoryId: catTourism.id, feeType: 'FIXED', baseAmount: 20,  applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Camping Permit',                                description: 'Municipal Tourism Office | Camping permit at Taytay Falls or other tourism sites (₱100–₱300/person)',             categoryId: catTourism.id, feeType: 'FIXED', baseAmount: 100, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ VENUES & EVENTS FEES (Mayor's Office / MTO) ════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Use of Municipal Covered Court',  description: "Mayor's Office / MTO | Daily rental fee for the municipal covered court (₱500–₱2,000/day)",              categoryId: catVenues.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Use of Municipal Plaza / Park',   description: "Mayor's Office / MTO | Event fee for use of the municipal plaza or park (₱500–₱3,000/event)",           categoryId: catVenues.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Use of Municipal Function Hall',  description: "Mayor's Office / MTO | Daily rental fee for the municipal function hall (₱1,000–₱5,000/day)",           categoryId: catVenues.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Special Events Permit',           description: "Mayor's Office / MTO | Permit for holding special events in the municipality (₱500–₱1,000)",            categoryId: catVenues.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Fiesta / Parade Permit',          description: "Mayor's Office / MTO | Permit for holding fiestas or parades (₱200–₱500)",                             categoryId: catVenues.id, feeType: 'FIXED', baseAmount: 200,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Film / Photography Permit',       description: "Mayor's Office / MTO | Daily permit for commercial film or photography productions (₱500–₱3,000/day)", categoryId: catVenues.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
    ],
  });

  // ══ BARANGAY SERVICES (40 Barangay Halls of Majayjay) ═════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Barangay Clearance',               description: '40 Barangay Halls of Majayjay | General barangay clearance certificate (₱50–₱200)',                          categoryId: catBarangay.id, feeType: 'FIXED', baseAmount: 50,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Barangay Indigency Certificate',   description: '40 Barangay Halls of Majayjay | Certificate of indigency for qualified residents (Free–₱50)',               categoryId: catBarangay.id, feeType: 'FIXED', baseAmount: 0,   applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Barangay Residency Certificate',   description: '40 Barangay Halls of Majayjay | Certificate of barangay residency (₱50–₱100)',                              categoryId: catBarangay.id, feeType: 'FIXED', baseAmount: 50,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Barangay Business Clearance',      description: '40 Barangay Halls of Majayjay | Business clearance issued by the barangay (₱200–₱500)',                     categoryId: catBarangay.id, feeType: 'FIXED', baseAmount: 200, applicableTo: 'BUSINESS',   createdById: adminUser.id },
      { feeName: 'Barangay Certification (General)', description: '40 Barangay Halls of Majayjay | General purpose barangay certification (₱50–₱100)',                         categoryId: catBarangay.id, feeType: 'FIXED', baseAmount: 50,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Barangay Blotter Certification',   description: '40 Barangay Halls of Majayjay | Certification of a barangay blotter entry (₱50–₱100)',                     categoryId: catBarangay.id, feeType: 'FIXED', baseAmount: 50,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Lupon / Mediation Fee',            description: '40 Barangay Halls of Majayjay | Fee for Lupon Tagapamayapa mediation proceedings (₱50–₱200)',              categoryId: catBarangay.id, feeType: 'FIXED', baseAmount: 50,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ BARANGAY TAX (Barangay Treasurers) ════════════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Barangay Tax on Businesses',                       description: 'Barangay Treasurers | 1% of gross receipts; maximum of ₱500 per year',                                     categoryId: catBarangayTax.id, feeType: 'PERCENTAGE', percentageRate: 1, applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Barangay Annual Registration Fee (Small Business)', description: 'Barangay Treasurers | Annual small business registration fee in the barangay (₱50–₱200)',                 categoryId: catBarangayTax.id, feeType: 'FIXED', baseAmount: 50,   applicableTo: 'BUSINESS', createdById: adminUser.id },
      { feeName: 'Barangay Community Service Fund',                   description: 'Barangay Treasurers | Community service fund contribution (varies per barangay)',                          categoryId: catBarangayTax.id, feeType: 'FIXED', baseAmount: 0,    applicableTo: 'BOTH',     createdById: adminUser.id },
    ],
  });

  // ══ EDUCATION & SOCIAL SERVICES (Schools Division / MSWD) ════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Good Moral Certificate (School)',  description: 'Schools Division / MSWD | Certificate of good moral character from school (₱50–₱100)',                     categoryId: catEducation.id, feeType: 'FIXED', baseAmount: 50, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Form 137 / SF10 Request',          description: 'Schools Division | School form 137 or SF10 permanent record request fee (₱50–₱100)',                       categoryId: catEducation.id, feeType: 'FIXED', baseAmount: 50, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Scholarship Application Fee',      description: 'Schools Division / MSWD | Municipal scholarship program application (Free–₱100)',                          categoryId: catEducation.id, feeType: 'FIXED', baseAmount: 0,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Solo Parent ID Application',       description: 'MSWD | Solo parent ID application and issuance under RA 8972 (Free)',                                     categoryId: catEducation.id, feeType: 'FIXED', baseAmount: 0,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'PWD ID Application',               description: 'MSWD | Person with Disability (PWD) ID application and issuance (Free)',                                  categoryId: catEducation.id, feeType: 'FIXED', baseAmount: 0,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Senior Citizen ID Application',    description: 'MSWD | Senior citizen ID application and issuance (Free)',                                                 categoryId: catEducation.id, feeType: 'FIXED', baseAmount: 0,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ HEALTH & SANITATION (Municipal Health Office) ═════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Health Certificate (Individual)',         description: 'Municipal Health Office | Annual health certificate for individuals/workers (₱100–₱200)',               categoryId: catHealth.id, feeType: 'FIXED',    baseAmount: 100, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: "Food Handler's Certificate",              description: "Municipal Health Office | Annual certificate for food handlers and food service workers (₱150–₱300)",  categoryId: catHealth.id, feeType: 'FIXED',    baseAmount: 150, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Sanitary Permit (Food Establishment)',   description: 'Municipal Health Office | Annual sanitary permit for food establishments and eateries (₱300–₱500)',    categoryId: catHealth.id, feeType: 'FIXED',    baseAmount: 300, applicableTo: 'BUSINESS',   createdById: adminUser.id },
      { feeName: 'Burial Permit',                          description: 'Municipal Health Office | Permit authorizing interment (₱100–₱200)',                                   categoryId: catHealth.id, feeType: 'FIXED',    baseAmount: 100, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Exhumation Permit',                      description: 'Municipal Health Office | Permit for exhumation of remains (₱500)',                                    categoryId: catHealth.id, feeType: 'FIXED',    baseAmount: 500, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Slaughterhouse Inspection Fee',          description: 'Municipal Health Office | Per head livestock inspection fee at the slaughterhouse (₱50–₱200/head)',   categoryId: catHealth.id, feeType: 'VARIABLE', unitName: 'Head', unitRate: 50, applicableTo: 'BOTH', createdById: adminUser.id },
    ],
  });

  // ══ PUBLIC MARKET FEES (Municipal Market Administration) ══════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Market Stall Rental (Daily)',       description: 'Municipal Market Administration | Daily stall rental rate per square meter (₱15–₱50/sq.m.)',                 categoryId: catMarket.id, feeType: 'VARIABLE', unitName: 'Square Meter', unitRate: 15, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Market Stall Rental (Monthly)',     description: 'Municipal Market Administration | Monthly market stall rental fee (₱300–₱1,000/mo)',                         categoryId: catMarket.id, feeType: 'FIXED',    baseAmount: 300,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: "Market Vendor's Permit",            description: "Municipal Market Administration | Annual market vendor's permit (₱200–₱500/yr)",                             categoryId: catMarket.id, feeType: 'FIXED',    baseAmount: 200,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Transfer of Market Stall Rights',  description: 'Municipal Market Administration | Fee for transferring market stall rights to another vendor (₱1,000–₱3,000)', categoryId: catMarket.id, feeType: 'FIXED',  baseAmount: 1000, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ ENVIRONMENTAL SERVICES (MENRO) ════════════════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Garbage Collection Fee (Residential)', description: 'MENRO | Monthly residential garbage collection fee (₱50–₱150/mo)',                                   categoryId: catEnvironment.id, feeType: 'FIXED', baseAmount: 50,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Garbage Collection Fee (Commercial)',  description: 'MENRO | Monthly commercial garbage collection fee (₱200–₱1,000/mo)',                                 categoryId: catEnvironment.id, feeType: 'FIXED', baseAmount: 200, applicableTo: 'BUSINESS',   createdById: adminUser.id },
      { feeName: 'Tree-Cutting Permit',                  description: 'MENRO | Permit for legal cutting of trees within the municipality (₱500–₱2,000)',                   categoryId: catEnvironment.id, feeType: 'FIXED', baseAmount: 500, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Dog Registration',                     description: 'MENRO | Annual dog registration and anti-rabies tag issuance (₱100–₱200)',                          categoryId: catEnvironment.id, feeType: 'FIXED', baseAmount: 100, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Cemetery Lot Fee',                     description: 'MENRO | Municipal cemetery lot purchase/usage fee (₱500–₱2,000)',                                   categoryId: catEnvironment.id, feeType: 'FIXED', baseAmount: 500, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ RECORDS & ADMINISTRATIVE FEES (Various Offices) ════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Photocopying Service (Per Page)',    description: 'Various Offices | Photocopying fee per page (₱2–₱5/page)',                                               categoryId: catRecords.id, feeType: 'VARIABLE', unitName: 'Page', unitRate: 2,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Certified True Copy (Per Page)',     description: 'Various Offices | Certified true copy of official government documents (₱20–₱50/page)',                 categoryId: catRecords.id, feeType: 'VARIABLE', unitName: 'Page', unitRate: 20, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Fax Service - Outgoing (Per Page)',  description: 'Various Offices | Outgoing fax transmission fee per page (₱20–₱50/page)',                              categoryId: catRecords.id, feeType: 'VARIABLE', unitName: 'Page', unitRate: 20, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Notarial / Authentication Fee',      description: 'Various Offices | Notarial service or document authentication fee (₱50–₱200)',                         categoryId: catRecords.id, feeType: 'FIXED',    baseAmount: 50,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Filing Fee (Petitions)',             description: 'Various Offices | Filing fee for formal petitions and administrative requests (₱200–₱500)',             categoryId: catRecords.id, feeType: 'FIXED',    baseAmount: 200, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Publication Fee (Ordinances)',       description: 'Various Offices | Publication fee for ordinances and official notices (actual cost)',                   categoryId: catRecords.id, feeType: 'FIXED',    baseAmount: 0,   applicableTo: 'BOTH', createdById: adminUser.id },
    ],
  });

  // ══ AGRICULTURE & FISHERY FEES (Municipal Agriculturist Office) ═══════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Fishpond / Aquaculture Permit',         description: 'Municipal Agriculturist Office | Annual permit for fishpond or aquaculture operations (₱500–₱2,000/yr)',                   categoryId: catAgriculture.id, feeType: 'FIXED',    baseAmount: 500,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Animal Transport Permit',               description: 'Municipal Agriculturist Office | Permit for transporting livestock or animals out of the municipality (₱100–₱500)',        categoryId: catAgriculture.id, feeType: 'FIXED',    baseAmount: 100,  applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Livestock Registration',                description: 'Municipal Agriculturist Office | Per head livestock registration fee (₱50–₱200/head)',                                     categoryId: catAgriculture.id, feeType: 'VARIABLE', unitName: 'Head', unitRate: 50, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Slaughter Permit',                      description: 'Municipal Agriculturist Office | Per head permit for livestock slaughter (₱50–₱150/head)',                                 categoryId: catAgriculture.id, feeType: 'VARIABLE', unitName: 'Head', unitRate: 50, applicableTo: 'BOTH', createdById: adminUser.id },
      { feeName: 'Fertilizer / Pesticide Dealer Permit',  description: 'Municipal Agriculturist Office | Annual permit for fertilizer or pesticide dealers (₱500–₱1,000)',                        categoryId: catAgriculture.id, feeType: 'FIXED',    baseAmount: 500,  applicableTo: 'BUSINESS', createdById: adminUser.id },
    ],
  });

  // ══ ENVIRONMENTAL ORDINANCE VIOLATIONS (MENRO) ════════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Violation: Cutting Trees Without Permit',      description: 'MENRO | Fine for illegal cutting of trees without a permit (₱2,000–₱10,000)',         categoryId: catEnvViol.id, feeType: 'FIXED', baseAmount: 2000, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Violation: Quarrying Without Permit',          description: 'MENRO | Fine for unauthorized quarrying operations (₱5,000–₱20,000)',                 categoryId: catEnvViol.id, feeType: 'FIXED', baseAmount: 5000, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Violation: Burning Without Clearance',         description: 'MENRO | Fine for open burning without proper clearance (₱1,000–₱5,000)',              categoryId: catEnvViol.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Violation: Pollution of Water Source',         description: 'MENRO | Fine for pollution or contamination of water sources (₱5,000–₱20,000)',       categoryId: catEnvViol.id, feeType: 'FIXED', baseAmount: 5000, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Violation: Stray Animals Causing Obstruction', description: 'MENRO | Fine for stray animals causing road or public obstruction (₱500–₱1,000)',     categoryId: catEnvViol.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Violation: Unregistered Dog (No Anti-Rabies Tag)', description: 'MENRO | Fine for keeping an unregistered dog without anti-rabies tag (₱200–₱500)', categoryId: catEnvViol.id, feeType: 'FIXED', baseAmount: 200, applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
    ],
  });

  // ══ BUSINESS ORDINANCE VIOLATIONS (BPLO / Municipal Treasurer) ═══════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Violation: Operating Without Business Permit',         description: 'BPLO / Municipal Treasurer | Fine for operating without permit — possible closure (₱1,000–₱5,000)',        categoryId: catBizViol.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'BUSINESS',   createdById: adminUser.id },
      { feeName: 'Violation: Expired Business Permit (Still Operating)', description: 'BPLO / Municipal Treasurer | Fine for operating with an expired business permit (₱500–₱2,000)',           categoryId: catBizViol.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BUSINESS',   createdById: adminUser.id },
      { feeName: 'Violation: Selling Outside Designated Area',           description: 'BPLO / Municipal Treasurer | Fine for selling goods outside designated selling area (₱300–₱1,000)',       categoryId: catBizViol.id, feeType: 'FIXED', baseAmount: 300,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Violation: Vending on Sidewalk / Road',                description: 'BPLO / Municipal Treasurer | Fine for sidewalk or road vending blocking public thoroughfare (₱300–₱500)', categoryId: catBizViol.id, feeType: 'FIXED', baseAmount: 300,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Violation: Selling Without Health Certificate',        description: 'BPLO / Municipal Treasurer | Fine for selling food without a valid health certificate (₱500–₱1,000)',     categoryId: catBizViol.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Violation: Selling Expired / Adulterated Goods',       description: 'BPLO / Municipal Treasurer | Fine for selling expired or adulterated products (₱1,000–₱5,000)',          categoryId: catBizViol.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Violation: Operating Beyond Allowed Hours',            description: 'BPLO / Municipal Treasurer | Fine for operating a business beyond permitted hours (₱500–₱1,000)',        categoryId: catBizViol.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'BUSINESS',   createdById: adminUser.id },
    ],
  });

  // ══ IMPOUNDMENT FEES (Municipal Impounding Area) ════════════════════════
  await prisma.fee.createMany({
    data: [
      { feeName: 'Impoundment Fee (Motorcycle / Tricycle)', description: 'Municipal Impounding Area | Impoundment fee for motorcycles or tricycles (₱500–₱1,000)',          categoryId: catImpound.id, feeType: 'FIXED', baseAmount: 500,  applicableTo: 'INDIVIDUAL', createdById: adminUser.id },
      { feeName: 'Impoundment Fee (4-Wheel Vehicle)',       description: 'Municipal Impounding Area | Impoundment fee for 4-wheel vehicles (₱1,000–₱3,000)',               categoryId: catImpound.id, feeType: 'FIXED', baseAmount: 1000, applicableTo: 'BOTH',       createdById: adminUser.id },
      { feeName: 'Impound Release Processing Fee',          description: 'Municipal Impounding Area | Processing fee for releasing an impounded vehicle (₱200–₱500)',      categoryId: catImpound.id, feeType: 'FIXED', baseAmount: 200,  applicableTo: 'BOTH',       createdById: adminUser.id },
    ],
  });

  const feeCount = await prisma.fee.count();
  console.log(`  ✓ ${feeCount} fees created`);

  // ─── Penalty Rules ─────────────────────────────────────────────────────────
  console.log('⚠️  Creating penalty rules...');

  const rptBaseFee      = await prisma.fee.findFirst({ where: { feeName: 'Basic Real Property Tax (RPT)' } });
  const sefFee      = await prisma.fee.findFirst({ where: { feeName: 'Special Education Fund (SEF) Tax' } });
  const waterResFee = await prisma.fee.findFirst({ where: { feeName: 'Water Bill - Residential Minimum Charge (0–15 cu.m.)' } });
  const waterComFee = await prisma.fee.findFirst({ where: { feeName: 'Water Bill - Commercial Minimum Charge' } });
  const bpFee       = await prisma.fee.findFirst({ where: { feeName: "Business / Mayor's Permit Processing Fee" } });
  const lbtFee      = await prisma.fee.findFirst({ where: { feeName: 'Local Business Tax (LBT)' } });

  if (rptBaseFee) {
    await prisma.penaltyRule.create({
      data: { feeId: rptBaseFee.id, penaltyType: 'INTEREST', calculationMethod: 'PERCENTAGE', amountOrRate: 2.0, gracePeriodDays: 0, applyMonthly: true, maxPenaltyAmount: 72, createdById: adminUser.id },
    });
  }
  if (sefFee) {
    await prisma.penaltyRule.create({
      data: { feeId: sefFee.id, penaltyType: 'INTEREST', calculationMethod: 'PERCENTAGE', amountOrRate: 2.0, gracePeriodDays: 0, applyMonthly: true, maxPenaltyAmount: 72, createdById: adminUser.id },
    });
  }
  if (waterResFee) {
    await prisma.penaltyRule.create({
      data: { feeId: waterResFee.id, penaltyType: 'SURCHARGE', calculationMethod: 'PERCENTAGE', amountOrRate: 10.0, gracePeriodDays: 0, maxPenaltyAmount: 500, createdById: adminUser.id },
    });
  }
  if (waterComFee) {
    await prisma.penaltyRule.create({
      data: { feeId: waterComFee.id, penaltyType: 'SURCHARGE', calculationMethod: 'PERCENTAGE', amountOrRate: 10.0, gracePeriodDays: 0, maxPenaltyAmount: 2000, createdById: adminUser.id },
    });
  }
  if (bpFee) {
    await prisma.penaltyRule.create({
      data: { feeId: bpFee.id, penaltyType: 'SURCHARGE', calculationMethod: 'PERCENTAGE', amountOrRate: 25.0, gracePeriodDays: 20, maxPenaltyAmount: 5000, createdById: adminUser.id },
    });
  }
  if (lbtFee) {
    await prisma.penaltyRule.create({
      data: { feeId: lbtFee.id, penaltyType: 'SURCHARGE', calculationMethod: 'PERCENTAGE', amountOrRate: 25.0, gracePeriodDays: 20, maxPenaltyAmount: 10000, createdById: adminUser.id },
    });
  }

  const penaltyCount = await prisma.penaltyRule.count();
  console.log(`  ✓ ${penaltyCount} penalty rules created`);

  // ─── Extra Demo Residents ──────────────────────────────────────────────────
  console.log('👥 Creating demo resident users...');
  const hashedPw = await bcrypt.hash('Resident@12345', 10);

  const r1 = await prisma.user.upsert({
    where: { email: 'pedro.reyes@example.com' },
    update: {},
    create: { email: 'pedro.reyes@example.com', passwordHash: hashedPw, firstName: 'Pedro', lastName: 'Reyes', contactNumber: '09100000101', roleId: residentRole.id, status: 'ACTIVE', emailVerified: true },
  });
  const r2 = await prisma.user.upsert({
    where: { email: 'maria.garcia@example.com' },
    update: {},
    create: { email: 'maria.garcia@example.com', passwordHash: hashedPw, firstName: 'Maria', lastName: 'Garcia', contactNumber: '09100000102', roleId: residentRole.id, status: 'ACTIVE', emailVerified: true },
  });
  const r3 = await prisma.user.upsert({
    where: { email: 'jose.santos@example.com' },
    update: {},
    create: { email: 'jose.santos@example.com', passwordHash: hashedPw, firstName: 'Jose', lastName: 'Santos', contactNumber: '09100000103', roleId: residentRole.id, status: 'ACTIVE', emailVerified: true },
  });
  const r4 = await prisma.user.upsert({
    where: { email: 'ana.flores@example.com' },
    update: {},
    create: { email: 'ana.flores@example.com', passwordHash: hashedPw, firstName: 'Ana', lastName: 'Flores', contactNumber: '09100000104', roleId: residentRole.id, status: 'ACTIVE', emailVerified: true },
  });
  const r5 = await prisma.user.upsert({
    where: { email: 'carlos.mendoza@example.com' },
    update: {},
    create: { email: 'carlos.mendoza@example.com', passwordHash: hashedPw, firstName: 'Carlos', lastName: 'Mendoza', contactNumber: '09100000105', roleId: residentRole.id, status: 'ACTIVE', emailVerified: true },
  });

  const cashierUser = await prisma.user.findFirst({ where: { email: 'cashier@majayjay.gov.ph' } });
  const juanUser    = await prisma.user.findFirst({ where: { email: 'resident@example.com' } });

  const cashMethod = await prisma.paymentMethod.findFirst({ where: { methodName: 'Cash' } });
  const gcashMethod = await prisma.paymentMethod.findFirst({ where: { methodName: 'GCash' } });
  const mayaMethod  = await prisma.paymentMethod.findFirst({ where: { methodName: 'Maya' } });

  // Look up fees to use in bill items (reuse already-declared or fetch new)
  const waterResFee2   = await prisma.fee.findFirst({ where: { feeName: 'Water Bill - Residential Minimum Charge (0–15 cu.m.)' } });
  // rptBaseFee, sefFee, bpFee, lbtFee already declared above in penalty rules section
  const cedulaFee      = await prisma.fee.findFirst({ where: { feeName: 'Cedula - Individual Basic Fee' } });
  const healthCertFee  = await prisma.fee.findFirst({ where: { feeName: 'Health Certificate (Individual)' } });
  const barangayClear  = await prisma.fee.findFirst({ where: { feeName: 'Barangay Clearance' } });
  const birthCertFee   = await prisma.fee.findFirst({ where: { feeName: 'Birth Certificate (Certified Copy)' } });
  const buildingPermit = await prisma.fee.findFirst({ where: { feeName: 'Building Permit' } });
  const marketStall    = await prisma.fee.findFirst({ where: { feeName: 'Stall Rental (Daily)' } });
  const garbageFee     = await prisma.fee.findFirst({ where: { feeName: 'Garbage Collection Fee (Residential)' } });
  const entranceFee    = await prisma.fee.findFirst({ where: { feeName: 'Entrance Fee - Local Tourist (Taytay Falls)' } });

  console.log('  ✓ 5 demo resident users created');

  // ─── Bills, Payments & Receipts ────────────────────────────────────────────
  console.log('🧾 Creating demo bills, payments, and receipts...');

  type BillSeed = {
    billNumber: string;
    payerId: number;
    billDate: Date;
    dueDate: Date;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'ISSUED';
    notes?: string;
    items: { fee: { id: number; feeName: string } | null; fallbackName: string; amount: number }[];
  };

  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

  const billSeeds: BillSeed[] = [
    // ── PAID bills ──────────────────────────────────────────────────────────
    {
      billNumber: 'BILL-2026-000001', payerId: juanUser!.id,
      billDate: d(2025, 11, 1), dueDate: d(2025, 11, 30),
      totalAmount: 40, paidAmount: 40, balanceAmount: 0, status: 'PAID',
      notes: 'November 2025 water bill',
      items: [{ fee: waterResFee2, fallbackName: 'Water Bill - Residential', amount: 40 }],
    },
    {
      billNumber: 'BILL-2026-000002', payerId: juanUser!.id,
      billDate: d(2025, 12, 1), dueDate: d(2025, 12, 31),
      totalAmount: 40, paidAmount: 40, balanceAmount: 0, status: 'PAID',
      notes: 'December 2025 water bill',
      items: [{ fee: waterResFee2, fallbackName: 'Water Bill - Residential', amount: 40 }],
    },
    {
      billNumber: 'BILL-2026-000003', payerId: juanUser!.id,
      billDate: d(2026, 1, 5), dueDate: d(2026, 1, 31),
      totalAmount: 150, paidAmount: 150, balanceAmount: 0, status: 'PAID',
      notes: 'Annual cedula and barangay clearance',
      items: [
        { fee: cedulaFee, fallbackName: 'Cedula - Individual Basic Fee', amount: 5 },
        { fee: barangayClear, fallbackName: 'Barangay Clearance', amount: 50 },
        { fee: birthCertFee, fallbackName: 'Birth Certificate', amount: 150 },
      ],
    },
    {
      billNumber: 'BILL-2026-000004', payerId: r1.id,
      billDate: d(2025, 10, 15), dueDate: d(2025, 11, 15),
      totalAmount: 500, paidAmount: 500, balanceAmount: 0, status: 'PAID',
      notes: 'Annual RPT — 2025',
      items: [
        { fee: rptBaseFee, fallbackName: 'Basic Real Property Tax (RPT)', amount: 350 },
        { fee: sefFee, fallbackName: 'Special Education Fund (SEF)', amount: 150 },
      ],
    },
    {
      billNumber: 'BILL-2026-000005', payerId: r2.id,
      billDate: d(2026, 1, 10), dueDate: d(2026, 1, 20),
      totalAmount: 1700, paidAmount: 1700, balanceAmount: 0, status: 'PAID',
      notes: "Business permit 2026 — renewal",
      items: [
        { fee: bpFee, fallbackName: "Business / Mayor's Permit", amount: 500 },
        { fee: lbtFee, fallbackName: 'Local Business Tax (LBT)', amount: 1200 },
      ],
    },
    {
      billNumber: 'BILL-2026-000006', payerId: r3.id,
      billDate: d(2026, 2, 5), dueDate: d(2026, 2, 28),
      totalAmount: 40, paidAmount: 40, balanceAmount: 0, status: 'PAID',
      notes: 'February 2026 water bill',
      items: [{ fee: waterResFee2, fallbackName: 'Water Bill - Residential', amount: 40 }],
    },
    {
      billNumber: 'BILL-2026-000007', payerId: r4.id,
      billDate: d(2026, 3, 1), dueDate: d(2026, 3, 31),
      totalAmount: 200, paidAmount: 200, balanceAmount: 0, status: 'PAID',
      notes: 'Health certificate and sanitary inspection',
      items: [
        { fee: healthCertFee, fallbackName: 'Health Certificate (Individual)', amount: 100 },
        { fee: barangayClear, fallbackName: 'Barangay Clearance', amount: 100 },
      ],
    },
    {
      billNumber: 'BILL-2026-000008', payerId: r5.id,
      billDate: d(2026, 3, 15), dueDate: d(2026, 4, 15),
      totalAmount: 80, paidAmount: 80, balanceAmount: 0, status: 'PAID',
      notes: 'Taytay Falls entrance fee — group of 4',
      items: [{ fee: entranceFee, fallbackName: 'Entrance Fee - Local Tourist', amount: 80 }],
    },
    // ── PARTIALLY PAID ───────────────────────────────────────────────────────
    {
      billNumber: 'BILL-2026-000009', payerId: juanUser!.id,
      billDate: d(2026, 4, 1), dueDate: d(2026, 4, 30),
      totalAmount: 500, paidAmount: 200, balanceAmount: 300, status: 'PARTIALLY_PAID',
      notes: 'Annual RPT 2026 — partial payment',
      items: [
        { fee: rptBaseFee, fallbackName: 'Basic Real Property Tax (RPT)', amount: 350 },
        { fee: sefFee, fallbackName: 'Special Education Fund (SEF)', amount: 150 },
      ],
    },
    {
      billNumber: 'BILL-2026-000010', payerId: r1.id,
      billDate: d(2026, 4, 5), dueDate: d(2026, 5, 5),
      totalAmount: 1200, paidAmount: 600, balanceAmount: 600, status: 'PARTIALLY_PAID',
      notes: 'Market stall rental — 6 months partial',
      items: [{ fee: marketStall, fallbackName: 'Stall Rental (Daily)', amount: 1200 }],
    },
    // ── UNPAID ───────────────────────────────────────────────────────────────
    {
      billNumber: 'BILL-2026-000011', payerId: r2.id,
      billDate: d(2026, 4, 1), dueDate: d(2026, 4, 30),
      totalAmount: 40, paidAmount: 0, balanceAmount: 40, status: 'UNPAID',
      notes: 'April 2026 water bill',
      items: [{ fee: waterResFee2, fallbackName: 'Water Bill - Residential', amount: 40 }],
    },
    {
      billNumber: 'BILL-2026-000012', payerId: r3.id,
      billDate: d(2026, 4, 10), dueDate: d(2026, 5, 10),
      totalAmount: 5, paidAmount: 0, balanceAmount: 5, status: 'UNPAID',
      notes: 'Annual cedula 2026',
      items: [{ fee: cedulaFee, fallbackName: 'Cedula - Individual Basic Fee', amount: 5 }],
    },
    {
      billNumber: 'BILL-2026-000013', payerId: r4.id,
      billDate: d(2026, 4, 15), dueDate: d(2026, 5, 15),
      totalAmount: 300, paidAmount: 0, balanceAmount: 300, status: 'UNPAID',
      notes: 'Garbage collection fee',
      items: [{ fee: garbageFee, fallbackName: 'Garbage Collection Fee', amount: 300 }],
    },
    // ── OVERDUE ──────────────────────────────────────────────────────────────
    {
      billNumber: 'BILL-2026-000014', payerId: r5.id,
      billDate: d(2025, 9, 1), dueDate: d(2025, 9, 30),
      totalAmount: 40, paidAmount: 0, balanceAmount: 40, status: 'OVERDUE',
      notes: 'September 2025 water bill — overdue',
      items: [{ fee: waterResFee2, fallbackName: 'Water Bill - Residential', amount: 40 }],
    },
    {
      billNumber: 'BILL-2026-000015', payerId: r1.id,
      billDate: d(2025, 8, 1), dueDate: d(2025, 8, 31),
      totalAmount: 500, paidAmount: 0, balanceAmount: 500, status: 'OVERDUE',
      notes: 'RPT 2025 — OVERDUE (unpaid)',
      items: [
        { fee: rptBaseFee, fallbackName: 'Basic Real Property Tax (RPT)', amount: 350 },
        { fee: sefFee, fallbackName: 'Special Education Fund (SEF)', amount: 150 },
      ],
    },
    {
      billNumber: 'BILL-2026-000016', payerId: r2.id,
      billDate: d(2025, 7, 15), dueDate: d(2025, 8, 15),
      totalAmount: 3500, paidAmount: 0, balanceAmount: 3500, status: 'OVERDUE',
      notes: 'Building permit — overdue, construction started',
      items: [{ fee: buildingPermit, fallbackName: 'Building Permit', amount: 3500 }],
    },
    {
      billNumber: 'BILL-2026-000017', payerId: juanUser!.id,
      billDate: d(2026, 5, 1), dueDate: d(2026, 5, 31),
      totalAmount: 40, paidAmount: 0, balanceAmount: 40, status: 'ISSUED',
      notes: 'May 2026 water bill',
      items: [{ fee: waterResFee2, fallbackName: 'Water Bill - Residential', amount: 40 }],
    },
  ];

  let billsCreated = 0;
  let paymentsCreated = 0;
  let receiptsCreated = 0;
  let orCounter = 1;

  const paymentMethods = [cashMethod, gcashMethod, mayaMethod].filter(Boolean);

  for (const bs of billSeeds) {
    // Create the bill
    const bill = await prisma.bill.create({
      data: {
        billNumber: bs.billNumber,
        payerId: bs.payerId,
        billDate: bs.billDate,
        dueDate: bs.dueDate,
        totalAmount: bs.totalAmount,
        paidAmount: bs.paidAmount,
        balanceAmount: bs.balanceAmount,
        status: bs.status,
        notes: bs.notes,
        createdById: adminUser.id,
        items: {
          create: bs.items
            .filter(item => item.fee !== null)
            .map(item => ({
              feeId: item.fee!.id,
              feeName: item.fee!.feeName,
              amount: item.amount,
              unitCount: 1,
              unitPrice: item.amount,
            })),
        },
      },
    });
    billsCreated++;

    // Create payment + receipt for PAID bills
    if (bs.status === 'PAID' && cashierUser) {
      const method = paymentMethods[billsCreated % paymentMethods.length]!;
      const txnDate = new Date(bs.dueDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before due
      const txnId = `TXN-${txnDate.getFullYear()}${String(txnDate.getMonth()+1).padStart(2,'0')}${String(txnDate.getDate()).padStart(2,'0')}-${String(paymentsCreated+1).padStart(6,'0')}`;

      const payment = await prisma.payment.create({
        data: {
          transactionId: txnId,
          billId: bill.id,
          payerId: bs.payerId,
          amount: bs.totalAmount,
          paymentMethodId: method.id,
          status: 'PAID',
          cashierId: cashierUser.id,
          paymentDate: txnDate,
          verifiedAt: txnDate,
          verifiedById: cashierUser.id,
        },
      });
      paymentsCreated++;

      const orNumber = `OR-2026-${String(orCounter++).padStart(6, '0')}`;
      await prisma.officialReceipt.create({
        data: {
          orNumber,
          paymentId: payment.id,
          billId: bill.id,
          amountPaid: bs.totalAmount,
          paymentMethod: method.methodName,
          cashierId: cashierUser.id,
          payerName: `Resident #${bs.payerId}`,
          status: 'PRINTED',
        },
      });
      receiptsCreated++;
    }

    // Create partial payment for PARTIALLY_PAID bills
    if (bs.status === 'PARTIALLY_PAID' && cashierUser) {
      const method = cashMethod!;
      const txnDate = new Date(bs.billDate.getTime() + 5 * 24 * 60 * 60 * 1000);
      const txnId = `TXN-${txnDate.getFullYear()}${String(txnDate.getMonth()+1).padStart(2,'0')}${String(txnDate.getDate()).padStart(2,'0')}-${String(paymentsCreated+1).padStart(6,'0')}`;

      const payment = await prisma.payment.create({
        data: {
          transactionId: txnId,
          billId: bill.id,
          payerId: bs.payerId,
          amount: bs.paidAmount,
          paymentMethodId: method.id,
          status: 'PAID',
          cashierId: cashierUser.id,
          paymentDate: txnDate,
          verifiedAt: txnDate,
          verifiedById: cashierUser.id,
        },
      });
      paymentsCreated++;

      const orNumber = `OR-2026-${String(orCounter++).padStart(6, '0')}`;
      await prisma.officialReceipt.create({
        data: {
          orNumber,
          paymentId: payment.id,
          billId: bill.id,
          amountPaid: bs.paidAmount,
          paymentMethod: method.methodName,
          cashierId: cashierUser.id,
          payerName: `Resident #${bs.payerId}`,
          status: 'GENERATED',
        },
      });
      receiptsCreated++;
    }
  }

  console.log(`  ✓ ${billsCreated} bills created`);
  console.log(`  ✓ ${paymentsCreated} payments created`);
  console.log(`  ✓ ${receiptsCreated} official receipts created`);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📊 Seeded data summary:');
  console.log('   4  roles');
  console.log('  15  departments');
  console.log('   8  users (3 default + 5 demo residents)');
  console.log('   3  payment methods');
  console.log('  22  fee categories');
  console.log(`  ${feeCount}  fees`);
  console.log(`   ${penaltyCount}  penalty rules`);
  console.log('  17  demo bills');
  console.log('  10  demo payments');
  console.log('  10  demo official receipts');
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
