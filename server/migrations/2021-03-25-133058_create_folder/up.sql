CREATE TABLE folders (
  "id" SERIAL PRIMARY KEY,
  "parent_id" INTEGER DEFAULT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  FOREIGN KEY ("parent_id")
    REFERENCES folders ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
