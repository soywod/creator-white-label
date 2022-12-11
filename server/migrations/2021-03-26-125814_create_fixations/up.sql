CREATE TABLE fixations (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "preview_url" TEXT NOT NULL,
  "icon_url" TEXT NOT NULL,
  "video_url" TEXT DEFAULT NULL,
  "price" REAL NOT NULL,
  "diameter" INTEGER NOT NULL,
  "drill_diameter" INTEGER NOT NULL
);
