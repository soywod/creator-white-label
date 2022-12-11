CREATE TABLE users (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL DEFAULT '',
  "token" TEXT DEFAULT NULL,
  "is_admin" BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO users (username, password, token, is_admin) VALUES
('admin',	'$2b$12$D7qR7YNRVGeyAPYtrNrs/OBwrOI6r3FX54Y0ADeHXHDXCCAQb46g6',	NULL,	TRUE);
