CREATE TABLE templates (
  "id" SERIAL PRIMARY KEY,
  "folder_id" INTEGER,
  "name" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "preview_url" TEXT NULL DEFAULT NULL,
  "config" TEXT NULL DEFAULT NULL,
  FOREIGN KEY ("folder_id")
    REFERENCES folders ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
