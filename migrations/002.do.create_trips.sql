CREATE TABLE trips (
	id SERIAL PRIMARY KEY,
	trip_name TEXT NOT NULL,
	start_date TIMESTAMP NOT NULL,
	end_date TIMESTAMP NOT NULL,
	description TEXT,
	user_id INTEGER
		REFERENCES users(id) ON DELETE CASCADE NOT NULL,
	date_created TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
	date_modified TIMESTAMP
);

CREATE TABLE trip_dest_cities (
	id SERIAL PRIMARY KEY,
	city_name TEXT NOT NULL,
	city_place_id TEXT NOT NULL,
	utc_offset_minutes INTEGER NOT NULL,
	ne_lat NUMERIC (10, 7),
	ne_lng NUMERIC (10, 7),
	sw_lat NUMERIC (10, 7),
	sw_lng NUMERIC (10, 7),
	trip_id INTEGER
		REFERENCES trips(id) ON DELETE CASCADE NOT NULL
);