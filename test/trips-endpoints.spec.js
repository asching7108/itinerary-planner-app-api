const knex = require('knex');
const app = require('../src/App');
const helpers = require('./test-helpers');

describe('Trips Endpoints', () => {
	let db;

	const {
		testUsers,
		testTrips,
		testDestCities,
		testPlans
	} = helpers.makeTripsFixtures();
	const testUser = testUsers[0];

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DB_URL,
		});
		app.set('db', db);
	})

	after('disconnect from db', () => db.destroy())

	before('cleanup', () => helpers.cleanTables(db))

	afterEach('cleanup', () => helpers.cleanTables(db))

	describe(`GET /api/trips`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it('responds with 200 and an empty list', () => {
				return supertest(app)
					.get('/api/trips')
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200, []);
			})
		})

		context('Given there are trips in the database', () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('responds with 200 and all of the trips of the given user_id', () => {
				let expectedTrips = testTrips
					.filter(trip => trip.user_id === testUser.id);

				expectedTrips = expectedTrips.map(trip =>
					helpers.makeExpectedTrip(
						trip,
						testDestCities
					)
				);
				
				return supertest(app)
					.get(`/api/trips`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200, expectedTrips);
			})
		})
	})

	describe(`GET /api/trips/:trip_id`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it(`responds with 404 when trip doesn't exist`, () => {
				const tripId = 123456;
				return supertest(app)
					.get(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Trip doesn't exist` });
			})
		})

		context('Given there are trips in the database', () => {
			beforeEach('insert trips', () =>
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('responds with 200 and the specified trip', () => {
				const tripId = 2;				
				const expectedTrip = helpers.makeExpectedTrip(
					testTrips[tripId - 1],
					testDestCities,
				)

				return supertest(app)
					.get(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200, expectedTrip);
			})
		})
	})

	describe(`DELETE /api/trips/:trip_id`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it(`responds with 404 when trip doesn't exist`, () => {
				const tripId = 123456;
				return supertest(app)
					.delete(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Trip doesn't exist` });
			})
		})

		context('Given there are trips in the database', () => {
			beforeEach('insert trips', () =>
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('deletes the specified trip, responding with 204', () => {
				const tripId = 2;				
				const expectedTrips = helpers.makeExpectedTrips(
					testTrips.filter(t => t.user_id === testUser.id && t.id !== tripId),
					testDestCities,
				)

				return supertest(app)
					.delete(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(204)
					.then(() => {
						return supertest(app)
							.get(`/api/trips`)
							.set('Authorization', helpers.makeAuthHeader(testUser))
							.expect(200, expectedTrips);
						});
			})
		})
	})

	describe(`POST /api/trips`, () => {
		beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

		const requiredFields = ['trip_name', 'start_date', 'end_date', 'dest_cities'];

		requiredFields.forEach(field => {
			const newTrip = {
				trip_name: 'Test New Trip',
				dest_cities: [
					{
						city_name: 'New York',
						city_place_id: '123456',
						utc_offset_minutes: -240
					}
				],
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z'
			};

			it(`responds with 400 error when the '${field}' is missing`, () => {
				delete newTrip[field];

				return supertest(app)
					.post('/api/trips')
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(newTrip)
					.expect(400, {
						error: `Missing '${field}' in request body`,
					})
			})
		})

		const requiredFieldsDestCities = ['city_name', 'city_place_id', 'utc_offset_minutes'];

		requiredFieldsDestCities.forEach(field => {
			const newTrip = {
				trip_name: 'Test New Trip',
				dest_cities: [
					{
						city_name: 'New York',
						city_place_id: '123456',
						utc_offset_minutes: -240
					},
					{
						city_name: 'Philadelphia',
						city_place_id: '654321',
						utc_offset_minutes: -240
					}
				],
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z'
			};

			it(`responds with 400 error when '${field}' is missing`, () => {
				const testIdx = 1;
				delete newTrip.dest_cities[testIdx][field];

				return supertest(app)
					.post('/api/trips')
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(newTrip)
					.expect(400, {
						error: `Missing '${field}' in request body`,
					})
			})
		})

		it('creates a trip, responding with 201 and the new trip', () => {
			const newTrip = {
				trip_name: 'Test New Trip',
				dest_cities: [
					{
						city_name: 'New York',
						city_place_id: '123456',
						utc_offset_minutes: -240
					},
					{
						city_name: 'Philadelphia',
						city_place_id: '654321',
						utc_offset_minutes: -240
					}
				],
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z',
				description: 'test description blah blah'
			};

			return supertest(app)
				.post('/api/trips')
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.send(newTrip)
				.expect(201)
				.expect(res => {
					expect(res.body).to.have.property('id');
					expect(res.body.trip_name).to.eql(newTrip.trip_name);
					expect(res.body.start_date).to.eql(newTrip.start_date);
					expect(res.body.end_date).to.eql(newTrip.end_date);
					expect(res.body.description).to.eql(newTrip.description);
					expect(res.body.user_id).to.eql(testUser.id);
					expect(res.headers.location).to.eql(`/api/trips/${res.body.id}`);
				})
				.expect(res => {
					db
						.from('trips')
						.select('*')
						.where({ id: res.body.id })
						.first()
						.then(row => {
							expect(row.trip_name).to.eql(newTrip.trip_name);
							expect(new Date(row.start_date).toISOString()).to.eql(newTrip.start_date);
							expect(new Date(row.end_date).toISOString()).to.eql(newTrip.end_date);
							expect(row.description).to.eql(newTrip.description);
							expect(row.user_id).to.eql(testUser.id);
							const expectDate = new Date().toLocaleString();
							const actualDate = new Date(row.date_created).toLocaleString();
							expect(actualDate).to.eql(expectDate);
						})
				})
		})
	})

	describe(`GET /api/trips/:trip_id/plans`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it(`responds with 404 when trip doesn't exist`, () => {
				const tripId = 123456;
				return supertest(app)
					.get(`/api/trips/${tripId}/plans`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Trip doesn't exist` });
			})
		})

		context(`Given no plans for the trip`, () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('responds with 200 and an empty list', () => {
				const tripId = 2;
				return supertest(app)
					.get(`/api/trips/${tripId}/plans`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200, []);
			})
		})

		context('Given there are plans for the trip in the database', () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('responds with 200 and the specified plans', () => {
				const tripId = 1;
				const expectedPlans = helpers.makeExpectedPlans(
					testPlans.filter(p => p.trip_id === tripId),
					testDestCities
				);

				return supertest(app)
				.get(`/api/trips/${tripId}/plans`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.expect(200, expectedPlans);
			})
		})
	})

	describe(`GET /api/trips/:trip_id/plans/:plan_id`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it(`responds with 404 when trip doesn't exist`, () => {
				const tripId = 123456;
				const planId = 2;
				return supertest(app)
					.get(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Trip doesn't exist` });
			})
		})

		context(`Given no plans for the trip`, () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it(`responds with 404 when plan doesn't exist`, () => {
				const tripId = 1;
				const planId = 123456;
				return supertest(app)
					.get(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Plan doesn't exist` });
			})
		})

		context('Given there are plans for the trip in the database', () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('responds with 200 and the specified plan', () => {
				const testPlan = testPlans[0];
				const expectedPlan = helpers.makeExpectedPlan(
					testPlan, 
					testDestCities
				);

				return supertest(app)
				.get(`/api/trips/${testPlan.trip_id}/plans/${testPlan.id}`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.expect(200, expectedPlan);
			})
		})
	})

	describe(`DELETE /api/trips/:trip_id/plans/:plan_id`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it(`responds with 404 when trip doesn't exist`, () => {
				const tripId = 123456;
				const planId = 2;
				return supertest(app)
					.delete(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Trip doesn't exist` });
			})
		})

		context(`Given no plans for the trip`, () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it(`responds with 404 when plan doesn't exist`, () => {
				const tripId = 1;
				const planId = 123456;
				return supertest(app)
					.delete(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Plan doesn't exist` });
			})
		})

		context('Given there are plans for the trip in the database', () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('deletes the specified plan, responding with 204', () => {
				const testPlan = testPlans[0];
				const expectedPlans = helpers.makeExpectedPlans(
					testPlans.filter(p => p.trip_id === testPlan.trip_id && p.id !== testPlan.id),
					testDestCities
				);

				return supertest(app)
					.delete(`/api/trips/${testPlan.trip_id}/plans/${testPlan.id}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(204)
					.then(() => {
						return supertest(app)
							.get(`/api/trips/${testPlan.trip_id}/plans`)
							.set('Authorization', helpers.makeAuthHeader(testUser))
							.expect(200, expectedPlans);
						});
			})
		})
	})

	describe(`PATCH /api/trips/:trip_id/plans/:plan_id`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it(`responds with 404 when trip doesn't exist`, () => {
				const tripId = 123456;
				const planId = 2;
				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Trip doesn't exist` });
			})
		})

		context(`Given no plans for the trip`, () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it(`responds with 404 when plan doesn't exist`, () => {
				const tripId = 1;
				const planId = 123456;
				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Plan doesn't exist` });
			})
		})

		context('Given there are plans for the trip in the database', () => {
			beforeEach('insert trips', () => 
				helpers.seedTripsTables(
					db,
					testUsers,
					testTrips,
					testDestCities,
					testPlans
				)
			)

			it('responds with 400 when no required field is provided', () => {
				const tripId = 1;
				const planId = 1;
				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(400, {
						error: `Request body must contain at least one field to update`
					});
			})

			it('updates the specified plan, responding with 204', () => {
				const tripId = 1;
				const planId = 1;
				const updatePlan = {
					plan_type: 'Car Rental',
					plan_name: 'Hertz Newtown Square', 
					plan_place_id: '19073', 
					start_date: '2019-04-05T20:00:00.000Z', 
					end_date: '2019-04-05T21:00:00.000Z', 
					description: 'test blah blah', 
					trip_dest_city_id: 2
				};
				const expectedPlan = helpers.makeExpectedPlan(
					updatePlan,
					testDestCities
				);
				expectedPlan.id = planId;
				expectedPlan.trip_id = tripId;

				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(updatePlan)
					.expect(204)
					.then(() => {
						return supertest(app)
							.get(`/api/trips/${tripId}/plans/${planId}`)
							.set('Authorization', helpers.makeAuthHeader(testUser))
							.expect(200, expectedPlan);
						});
			})
		})
	})
})
