-- AlterTable
ALTER TABLE "fee_categories" ADD COLUMN     "department_id" INTEGER;

-- AddForeignKey
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
