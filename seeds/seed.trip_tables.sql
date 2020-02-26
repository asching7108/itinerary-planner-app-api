BEGIN;

TRUNCATE
	users,
	trips,
	trip_dest_cities,
	trip_plans
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

INSERT INTO trip_dest_cities (city_name, city_place_id, trip_id)
VALUES
	('Barcelona', '', 1),
	('Florence', '', 1),
	('Rome', '', 1),
	('Tokyo', '', 2);

INSERT INTO trip_plans (plan_type, plan_name, plan_place_id, start_date, end_date, description, trip_id, trip_dest_city_id)
VALUES
	('Flight', 'BR772', '', '2019-04-01T04:05:00.000+08:00', '2019-04-01T10:50:00.000+03:00', NULL, 1, NULL),
	('Lodging', 'H10 Metropolitan Hotel', '', '2019-04-01T13:00:00.000+03:00', '2019-04-05T09:00:00.000+03:00', NULL, 1, 1),
	('Activity', 'La Sagrada Familia', '', '2019-04-02T10:00:00.000+03:00', '2019-04-02T14:00:00.000+03:00', 'Gaudis masterpiece', 1, 1),
	('Restaurant', 'Lily Afternoon Tea', '', '2019-04-02T15:00:00.000+03:00', NULL, NULL, 1, 1),
	('Restaurant', 'The Good Food', '', '2019-04-02T20:00:00.000+03:00', NULL, NULL, 1, 1);

COMMIT;