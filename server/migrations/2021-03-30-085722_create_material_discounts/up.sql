CREATE TABLE material_discounts (
  "material_id" INTEGER NOT NULL,
  "discount_id" INTEGER NOT NULL,
  PRIMARY KEY ("material_id", "discount_id"),
  FOREIGN KEY ("material_id")
    REFERENCES materials ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("discount_id")
    REFERENCES discounts ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
