CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'Ukentlig',
  points INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO users (username, password) VALUES
  ('alice', 'alice123'),
  ('bob', 'bob123');

INSERT INTO chores (user_id, title, description, frequency, points, completed) VALUES
  (1, 'Vaske kjøkkenbenken', 'Tørk av benken etter matlaging.', 'Daglig', 1, FALSE),
  (1, 'Støvsuge stua', 'Ta også under sofabordet.', 'Ukentlig', 2, FALSE),
  (2, 'Tømme søppel', 'Sorter avfallet før du går ut.', 'Ukentlig', 1, FALSE),
  (2, 'Vaske badet', 'Vask servant, speil og dusj.', 'Ukentlig', 3, FALSE);
