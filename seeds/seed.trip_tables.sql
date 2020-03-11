BEGIN;

TRUNCATE
	users,
	trips,
	trip_dest_cities,
	trip_plans,
	plan_details
	RESTART IDENTITY CASCADE;

/* 
 * unhashed password: P@ssw0rd 
 * bcrypt salt iteration count: 12
 */
INSERT INTO users (email, user_name, password)
VALUES
	('asching7108@gmail.com', 'Esther Lin', '$2a$12$y2olsPjdjW9z.JtJq0np1.gPQrF4/OifnFSOLXqkJ9DXviyzbFbIe'),
	('demo@demo.com', 'Blair Waldorf', '$2a$12$y2olsPjdjW9z.JtJq0np1.gPQrF4/OifnFSOLXqkJ9DXviyzbFbIe');

INSERT INTO trips (trip_name, start_date, end_date, description, user_id)
VALUES
	('Sunny Mediterranean', '2019-04-01T00:00:00.000Z', '2019-04-12T00:00:00.000Z', NULL, 1),
	('Family Trip 2020', '2019-04-30T00:00:00.000Z', '2019-05-05T00:00:00.000Z', NULL, 1);

INSERT INTO trip_dest_cities (city_name, city_place_id, utc_offset_minutes, trip_id)
VALUES
	('Barcelona', '123', 180, 1),
	('Florence', '456', 180, 1),
	('Rome', '789', 180, 1),
	('Tokyo', '321', 720, 2);

INSERT INTO trip_plans (plan_type, plan_name, plan_place_id, start_date, end_date, description, trip_id, city_name, utc_offset_minutes)
VALUES
	('Flight', 'BR772', NULL, '2019-04-01T04:05:00.000Z', '2019-04-01T10:50:00.000Z', NULL, 1, 'Barcelona', 180),
	('Lodging', 'H10 Metropolitan Hotel', NULL, '2019-04-01T13:00:00.000Z', '2019-04-05T09:00:00.000Z', NULL, 1, 'Barcelona', 180),
	('Car Rental', 'Hertz', NULL, '2019-04-02T09:00:00.000Z', '2019-04-05T12:00:00.000Z', NULL, 1, 'Barcelona', 180),
	('Activity', 'La Sagrada Familia', NULL, '2019-04-02T10:00:00.000Z', '2019-04-02T14:00:00.000Z', 'Gaudis masterpiece', 1, 'Barcelona', 180),
	('Restaurant', 'Lily Afternoon Tea', NULL, '2019-04-02T15:00:00.000Z', NULL, NULL, 1, 'Barcelona', 180),
	('Restaurant', 'The Good Food', NULL, '2019-04-02T20:00:00.000Z', NULL, NULL, 1, 'Barcelona', 180);

INSERT INTO plan_details (plan_subtype, from_name, from_place_id, from_utc_offset_minutes, to_name, to_place_id, to_utc_offset_minutes, plan_id)
VALUES
	(NULL, 'TPE', 'Taipei', 640, 'BCN', 'Barcelona', 180, 1),
	('Check in', NULL, NULL, NULL, NULL, NULL, NULL, 2),
	('Check out', NULL, NULL, NULL, NULL, NULL, NULL, 2),
	('Pick up', 'Hertz ABC store', '123', 180, NULL, NULL, NULL, 3),
	('Drop off', NULL, NULL, NULL, 'Hertz DEF store', '456', 180, 3);

COMMIT;