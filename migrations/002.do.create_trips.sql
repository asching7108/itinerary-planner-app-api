CREATE TABLE trips (
	id SERIAL PRIMARY KEY,
	trip_name TEXT NOT NULL,
	start_date TIMESTAMP NOT NULL,
	end_date TIMESTAMP NOT NULL,
	description TEXT,
	user_id INTEGER
		REFERENCES users(id) ON DELETE CASCADE NOT NULL,
	date_created TIMESTAMP NOT NULL DEFAULT now(),
	date_modified TIMESTAMP
);

CREATE TABLE trip_dest_cities (
	id SERIAL PRIMARY KEY,
	city_name TEXT NOT NULL,
	city_place_id TEXT NOT NULL,
	trip_id INTEGER
		REFERENCES trips(id) ON DELETE CASCADE NOT NULL
);