CREATE TYPE PLAN_TYPE AS ENUM (
	'Flight',
	'Transportation',
	'Lodging',
	'Car Rental',
	'Restaurant',
	'Activity'
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
	trip_dest_city_id INTEGER
		REFERENCES trip_dest_cities(id) ON DELETE CASCADE,
	date_created TIMESTAMP NOT NULL DEFAULT now(),
	date_modified TIMESTAMP
);

CREATE TABLE plan_trans_details (
	id SERIAL PRIMARY KEY,
	from_name TEXT NOT NULL,
	from_place_id TEXT,
	from_utc_offset_minutes INTEGER NOT NULL,
	to_name TEXT NOT NULL,
	to_place_id TEXT,
	to_utc_offset_minutes INTEGER NOT NULL,
	plan_id INTEGER
		REFERENCES trip_plans(id) ON DELETE CASCADE NOT NULL,
	date_created TIMESTAMP NOT NULL DEFAULT now(),
	date_modified TIMESTAMP
);
