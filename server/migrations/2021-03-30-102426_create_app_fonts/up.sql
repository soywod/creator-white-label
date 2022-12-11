CREATE TABLE app_fonts (
  "app_id" INTEGER NOT NULL,
  "font_id" INTEGER NOT NULL,
  PRIMARY KEY ("app_id", "font_id"),
  FOREIGN KEY ("app_id")
    REFERENCES apps ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("font_id")
    REFERENCES fonts ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
