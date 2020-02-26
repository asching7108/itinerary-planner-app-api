CREATE TYPE PLAN_TYPE AS ENUM (
	'Flight',
	'Lodging',
	'Car Rental',
	'Restaurant',
	'Activity'
);

CREATE TYPE PLAN_SUB_TYPE AS ENUM (
	'Departure',
	'Arrival',
	'Checkin',
	'Checkout'
);

CREATE TABLE trip_plans (
	id SERIAL PRIMARY KEY,
	plan_type PLAN_TYPE NOT NULL,
	plan_sub_type PLAN_SUB_TYPE,
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
