CREATE TYPE PLAN_TYPE AS ENUM (
	'Flight',
	'Lodging',
	'Car Rental',
	'Restaurant',
	'Activity',
	'Sightseeing',
	'Meeting',
	'Transportation'
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
	end_date TIMESTAMP NOT NULL,
	description TEXT,
	trip_id INTEGER
		REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
	city_name TEXT NOT NULL,
	utc_offset_minutes INTEGER NOT NULL,
	formatted_address TEXT,
	international_phone_number TEXT,
	website TEXT,
	date_created TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
	date_modified TIMESTAMP
);

CREATE TABLE plan_details (
	id SERIAL PRIMARY KEY,
	plan_subtype PLAN_SUBTYPE,
	from_name TEXT,
	from_place_id TEXT,
	from_utc_offset_minutes INTEGER,
	from_formatted_address TEXT,
	from_international_phone_number TEXT,
	from_website TEXT,
	from_terminal TEXT,
	from_gate TEXT,
	to_name TEXT,
	to_place_id TEXT,
	to_utc_offset_minutes INTEGER,
	to_formatted_address TEXT,
	to_international_phone_number TEXT,
	to_website TEXT,
	to_terminal TEXT,
	to_gate TEXT,
	plan_id INTEGER
		REFERENCES trip_plans(id) ON DELETE CASCADE NOT NULL
);
