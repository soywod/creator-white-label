CREATE TABLE material_dimensions (
  "material_id" INTEGER NOT NULL,
  "dimension_id" INTEGER NOT NULL,
  PRIMARY KEY ("material_id", "dimension_id"),
  FOREIGN KEY ("material_id")
    REFERENCES materials ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("dimension_id")
    REFERENCES dimensions ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
