-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailId" TEXT NOT NULL,
    "subject" TEXT,
    "snippet" TEXT,
    "detectedStatus" "ApplicationStatus",
    "detectedCompany" TEXT,
    "detectedPosition" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailEvent_gmailId_key" ON "EmailEvent"("gmailId");

-- CreateIndex
CREATE INDEX "EmailEvent_userId_idx" ON "EmailEvent"("userId");

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
