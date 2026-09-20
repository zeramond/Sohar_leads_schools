-- Initial SQLite schema. Applied only to the local SQLite database.
CREATE TABLE "sohar_leads" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "company_name" TEXT NOT NULL,
  "category" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "last_contacted" DATETIME,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "sohar_leads_phone_key" ON "sohar_leads"("phone");
CREATE INDEX "sohar_leads_status_created_at_idx" ON "sohar_leads"("status", "created_at");
