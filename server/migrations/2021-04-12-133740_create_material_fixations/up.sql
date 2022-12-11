CREATE TABLE material_fixations (
  "material_id" INTEGER NOT NULL,
  "fixation_id" INTEGER NOT NULL,
  PRIMARY KEY ("material_id", "fixation_id"),
  FOREIGN KEY ("material_id")
    REFERENCES materials ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("fixation_id")
    REFERENCES fixations ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
