CREATE TABLE app_users (
  "app_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  PRIMARY KEY ("app_id", "user_id"),
  FOREIGN KEY ("app_id")
    REFERENCES apps ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("user_id")
    REFERENCES users ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
