CREATE TABLE app_materials (
  "app_id" INTEGER NOT NULL,
  "material_id" INTEGER NOT NULL,
  PRIMARY KEY ("app_id", "material_id"),
  FOREIGN KEY ("app_id")
    REFERENCES apps ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("material_id")
    REFERENCES materials ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
