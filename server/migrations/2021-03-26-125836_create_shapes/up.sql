CREATE TABLE shapes (
  "id" SERIAL PRIMARY KEY,
  "folder_id" INTEGER,
  "tags" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  FOREIGN KEY ("folder_id")
    REFERENCES folders ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
