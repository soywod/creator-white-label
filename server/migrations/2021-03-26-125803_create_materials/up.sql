CREATE TABLE materials (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "preview" TEXT NOT NULL,
  "background" TEXT NOT NULL,
  "min_width" INTEGER NOT NULL,
  "min_height" INTEGER NOT NULL,
  "max_width" INTEGER NOT NULL,
  "max_height" INTEGER NOT NULL,
  "weight" INTEGER NOT NULL,
  "fixed_price" REAL NOT NULL,
  "surface_price" REAL NOT NULL,
  "manufacturing_time" SMALLINT NOT NULL
);
