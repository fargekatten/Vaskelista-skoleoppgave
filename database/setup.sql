-- Run once in the Neon SQL Editor for the Vaskelista database.
-- CREATE IF NOT EXISTS keeps existing data. Standard tasks are added on first app load.
BEGIN;
CREATE TABLE IF NOT EXISTS tasks (
 id integer PRIMARY KEY, name text NOT NULL, frequency text NOT NULL,
 points double precision NOT NULL CHECK(points > 0), dog integer NOT NULL,
 active integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS entries (
 id text PRIMARY KEY, task integer NOT NULL REFERENCES tasks(id),
 person integer NOT NULL CHECK(person BETWEEN 0 AND 3),
 points double precision NOT NULL, dog integer NOT NULL,
 date text NOT NULL, created text NOT NULL
);
CREATE INDEX IF NOT EXISTS entries_date ON entries(date);
CREATE TABLE IF NOT EXISTS settings (month text PRIMARY KEY, value text NOT NULL);
CREATE TABLE IF NOT EXISTS absences (
 id text PRIMARY KEY, person integer NOT NULL CHECK(person BETWEEN 0 AND 3),
 start text NOT NULL, "end" text NOT NULL,
 dogs_away integer NOT NULL DEFAULT 1, CHECK(start <= "end")
);
COMMIT;
