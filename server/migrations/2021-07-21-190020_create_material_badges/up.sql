CREATE TABLE material_badges (
  "material_id" INTEGER NOT NULL,
  "badge_id" INTEGER NOT NULL,
  PRIMARY KEY ("material_id", "badge_id"),
  FOREIGN KEY ("material_id")
    REFERENCES materials ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("badge_id")
    REFERENCES badges ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
