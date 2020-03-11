CREATE TYPE PLAN_TYPE AS ENUM (
	'Flight',
	'Transportation',
	'Lodging',
	'Car Rental',
	'Restaurant',
	'Activity'
);

CREATE TYPE PLAN_SUBTYPE AS ENUM (
	'Check in',
	'Check out',
	'Pick up',
	'Drop off'
);

CREATE TABLE trip_plans (
	id SERIAL PRIMARY KEY,
	plan_type PLAN_TYPE NOT NULL,
	plan_name TEXT NOT NULL,
	plan_place_id TEXT,
	start_date TIMESTAMP NOT NULL,
	end_date TIMESTAMP,
	description TEXT,
	trip_id INTEGER
		REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
	city_name TEXT NOT NULL,
	utc_offset_minutes INTEGER NOT NULL,
	date_created TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
	date_modified TIMESTAMP
);

CREATE TABLE plan_details (
	id SERIAL PRIMARY KEY,
	plan_subtype PLAN_SUBTYPE,
	from_name TEXT,
	from_place_id TEXT,
	from_utc_offset_minutes INTEGER,
	to_name TEXT,
	to_place_id TEXT,
	to_utc_offset_minutes INTEGER,
	plan_id INTEGER
		REFERENCES trip_plans(id) ON DELETE CASCADE NOT NULL
);
