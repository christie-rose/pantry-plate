-- A menu now covers a range: rename the single date to startDate and add endDate.
ALTER TABLE "Menu" RENAME COLUMN "date" TO "startDate";
ALTER TABLE "Menu" ADD COLUMN "endDate" TIMESTAMP(3);
