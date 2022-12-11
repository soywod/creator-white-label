CREATE TABLE material_shapes (
  "material_id" INTEGER NOT NULL,
  "shape_id" INTEGER NOT NULL,
  PRIMARY KEY ("material_id", "shape_id"),
  FOREIGN KEY ("material_id")
    REFERENCES materials ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("shape_id")
    REFERENCES shapes ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
