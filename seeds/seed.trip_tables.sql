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
	('demo@gmail.com', 'Blair Waldorf', '$2a$12$y2olsPjdjW9z.JtJq0np1.gPQrF4/OifnFSOLXqkJ9DXviyzbFbIe'),
	('test@gmail.com', 'Esther Lin', '$2a$12$y2olsPjdjW9z.JtJq0np1.gPQrF4/OifnFSOLXqkJ9DXviyzbFbIe');

INSERT INTO trips (trip_name, start_date, end_date, description, user_id)
VALUES
	('Sunny Mediterranean', '2021-04-01T00:00:00.000Z', '2021-04-12T00:00:00.000Z', NULL, 1),
	('Family Trip', '2021-04-30T00:00:00.000Z', '2021-05-05T00:00:00.000Z', NULL, 1),
	('Home', '2019-12-18T00:00:00.000Z', '2020-01-04T00:00:00.000Z', NULL, 1),
	('The Big Apple', '2021-08-21T00:00:00.000Z', '2021-08-23T00:00:00.000Z', NULL, 1);

INSERT INTO trip_dest_cities (city_name, city_place_id, utc_offset_minutes, trip_id, ne_lat, ne_lng, sw_lat, sw_lng)
VALUES
	('Barcelona', 'ChIJ5TCOcRaYpBIRCmZHTz37sEQ', 120, 1, 41.4695761, 2.2280099, 41.3200040, 2.0695258),
	('Florence', 'ChIJrdbSgKZWKhMRAyrH7xd51ZM', 120, 1, 43.8329368, 11.3278993, 43.7269795, 11.1540365),
	('Rome', 'ChIJu46S-ZZhLxMROG5lkwZ3D7k', 120, 1, 42.0505462, 12.7302888, 41.7695960, 12.3417070),
	('Tokyo', 'ChIJXSModoWLGGARILWiCfeu2M0', 540, 2, 35.8174453, 139.9188743, 35.5190420, 139.5628611),
	('San Diego', 'ChIJSx6SrQ9T2YARed8V_f0hOg0', -420, 3, 33.114249, -116.90816, 32.534856, -117.3097969),
	('New York', 'ChIJOwg_06VPwokRYv534QaPC8g', -240, 4, 40.9175771, -73.7002721, 40.4773991, -74.2590899);

INSERT INTO trip_plans (plan_type, plan_name, plan_place_id, start_date, end_date, description, trip_id, city_name, utc_offset_minutes, formatted_address, international_phone_number, website)
VALUES
	('Flight', 'VY6001', NULL, '2021-04-06T16:15:00.000Z', '2021-04-06T13:20:00.000Z', NULL, 1, 'Barcelona', 120, NULL, NULL, NULL),
	('Lodging', 'H10 Metropolitan', 'ChIJ50bnpfOipBIRAM4u3aFkS3E', '2021-04-01T13:00:00.000Z', '2021-04-05T09:00:00.000Z', NULL, 1, 'Barcelona', 120, 'Rambla de Catalunya, 7, 08007 Barcelona, Spain', '+34 932 14 07 20', 'https://www.h10hotels.com/en/barcelona-hotels/h10-metropolitan?utm_source=Google%20My%20Business&utm_medium=Boton%20sitio%20web&utm_campaign=HME'),
	('Car Rental', 'Hertz', NULL, '2021-04-08T12:00:00.000Z', '2021-04-10T20:00:00.000Z', NULL, 1, 'Barcelona', 120, NULL, NULL, NULL),
	('Activity', 'La Sagrada Familia', 'ChIJk_s92NyipBIRUMnDG8Kq2Js', '2021-04-02T10:00:00.000Z', '2021-04-02T14:00:00.000Z', 'Gaudis masterpiece', 1, 'Barcelona', 120, 'Carrer de Mallorca, 401, 08013 Barcelona, Spain', '+34 932 08 04 14', 'http://www.sagradafamilia.org/'),
	('Restaurant', 'Pinotxo Bar', 'ChIJ-QmOyfeipBIREHQngnjkAVE', '2021-04-02T19:00:00.000Z', '2021-04-02T21:00:00.000Z', NULL, 1, 'Barcelona', 120, '465- 470 Mercat de la Boqueria, 08002 Barcelona, Spain', '+34 933 17 17 31', 'http://pinotxobar.com/');

INSERT INTO plan_details (plan_id, plan_subtype, from_name, from_place_id, from_utc_offset_minutes, from_formatted_address, from_international_phone_number, from_website, from_terminal, from_gate, to_name, to_place_id, to_utc_offset_minutes, to_formatted_address, to_international_phone_number, to_website, to_terminal, to_gate)
VALUES
	(1, NULL, 'BCN', 'ChIJpY58hGSepBIR15tv-0LpK_M', 120, '08820 El Prat de Llobregat, Barcelona, Spain', '+34 913 21 10 00', 'http://www.aena.es/es/aeropuerto-barcelona/index.html', 'T1', '451-514', 'FLR', 'ChIJV8LI2QBXKhMRsibZbXbkEvI', 120, 'Via del Termine, 11, 50127 Firenze FI, Italy', '+39 055 30615', 'http://www.aeroporto.firenze.it/', 'MAIN', NULL),
	(2, 'Check in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(2, 'Check out', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(3, 'Pick up', 'Sicily By Car - AutoEuropa', 'ChIJCwTjKaxWKhMRoWTZJO1xK3Y', 120, 'R, Borgo Ognissanti, 100, 50123 Firenze FI, Italy', '+39 055 213333', 'http://www.sbc.it/', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(3, 'Drop off', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AutoEuropa', 'ChIJEzAkGphhLxMRdJmxDU5IQJA', 120, 'Piazza dei Cinquecento, 26, 00185 Roma RM, Italy', '+39 06 488 1287', 'http://www.autoeuropa.it/', NULL, NULL);

COMMIT;