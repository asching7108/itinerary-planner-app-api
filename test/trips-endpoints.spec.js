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
					res.body.dest_cities.forEach((dc, idx) => {
						expect(dc).to.have.property('id');
						expect(dc).to.have.property('trip_id');
						expect(dc.city_name).to.eql(newTrip.dest_cities[idx].city_name);
						expect(dc.city_place_id).to.eql(newTrip.dest_cities[idx].city_place_id);
						expect(dc.utc_offset_minutes).to.eql(newTrip.dest_cities[idx].utc_offset_minutes);
					})
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
				.expect(res => {
					db
						.from('trip_dest_cities')
						.select('*')
						.where({ trip_id: res.body.id })
						.then(rows => {
							rows.forEach((row, idx) => {
								expect(row.city_name).to.eql(newTrip.dest_cities[idx].city_name);
								expect(row.city_place_id).to.eql(newTrip.dest_cities[idx].city_place_id);
								expect(row.utc_offset_minutes).to.eql(newTrip.dest_cities[idx].utc_offset_minutes);
							})
						})
				});
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

	describe(`PATCH /api/trips/:trip_id`, () => {
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

			it('updates the specified trip, responding with 200 and the updated trip', () => {
				const tripId = 2;				
				const updateTrip = {
					trip_name: 'Test Update Trip',
					dest_cities: [
						{
							city_name: 'Taipei',
							city_place_id: '654321',
							utc_offset_minutes: 480
						}
					],
					start_date: '2021-07-01T00:00:00.000Z',
					end_date: '2021-07-03T00:00:00.000Z',
					description: 'test update description blah blah'
				};
				const expectedTrip = updateTrip;
				expectedTrip.id = tripId;
				expectedTrip.user_id = testUser.id;

				return supertest(app)
					.patch(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(updateTrip)
					.expect(200)
					.expect(res => {
						expect(res.body).to.have.property('id');
						expect(res.body.trip_name).to.eql(updateTrip.trip_name);
						expect(res.body.start_date).to.eql(updateTrip.start_date);
						expect(res.body.end_date).to.eql(updateTrip.end_date);
						expect(res.body.description).to.eql(updateTrip.description);
						expect(res.body.user_id).to.eql(testUser.id);
						res.body.dest_cities.forEach((dc, idx) => {
							expect(dc).to.have.property('id');
							expect(dc.trip_id).to.eql(tripId);
							expect(dc.city_name).to.eql(updateTrip.dest_cities[idx].city_name);
							expect(dc.city_place_id).to.eql(updateTrip.dest_cities[idx].city_place_id);
							expect(dc.utc_offset_minutes).to.eql(updateTrip.dest_cities[idx].utc_offset_minutes);
						})
					})
					.expect(res => {
						db
							.from('trips')
							.select('*')
							.where({ id: tripId })
							.first()
							.then(row => {
								expect(row.trip_name).to.eql(updateTrip.trip_name);
								expect(new Date(row.start_date).toISOString()).to.eql(updateTrip.start_date);
								expect(new Date(row.end_date).toISOString()).to.eql(updateTrip.end_date);
								expect(row.description).to.eql(updateTrip.description);
								expect(row.user_id).to.eql(testUser.id);
								const expectDate = new Date().toLocaleString();
								const actualDate = new Date(row.date_modified).toLocaleString();
								expect(actualDate).to.eql(expectDate);
							})
					})
					.expect(res => {
						db
							.from('trip_dest_cities')
							.select('*')
							.where({ trip_id: tripId })
							.then(rows => {
								rows.forEach((row, idx) => {
									expect(row.city_name).to.eql(updateTrip.dest_cities[idx].city_name);
									expect(row.city_place_id).to.eql(updateTrip.dest_cities[idx].city_place_id);
									expect(row.utc_offset_minutes).to.eql(updateTrip.dest_cities[idx].utc_offset_minutes);
								})
							})
					});
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
				const expectedPlans = testPlans.filter(p => p.trip_id === tripId);

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

				return supertest(app)
				.get(`/api/trips/${testPlan.trip_id}/plans/${testPlan.id}`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.expect(200, testPlan);
			})
		})
	})

	describe(`POST /api/trips/:trip_id/plans`, () => {
		beforeEach('insert plans', () => 
			helpers.seedTripsTables(
				db,
				testUsers,
				testTrips,
				testDestCities,
				testPlans
			)
		)

		const requiredFields = [
			'plan_type', 
			'plan_name', 
			'start_date',  
			'city_name',
			'utc_offset_minutes'
		];

		requiredFields.forEach(field => {
			const tripId = 1;
			const newPlan = {
				plan_type: 'Activity',
				plan_name: 'Test New Plan',
				start_date: '2020-07-01T00:00:00.000Z',
				city_name: 'Taipei',
				utc_offset_minutes: 480
			};

			it(`responds with 400 error when the '${field}' is missing`, () => {
				delete newPlan[field];

				return supertest(app)
					.post(`/api/trips/${tripId}/plans`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(newPlan)
					.expect(400, {
						error: `Missing '${field}' in request body`,
					})
			})
		})

		it('creates a plan, responding with 201 and the new plan', () => {
			const tripId = 1;
			const newPlan = {
				plan_type: 'Activity',
				plan_name: 'Test New Plan',
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z',
				description: 'blah blah',
				plan_place_id: '11078', 
				city_name: 'Taipei',
				utc_offset_minutes: 480
			};

			return supertest(app)
				.post(`/api/trips/${tripId}/plans`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.send(newPlan)
				.expect(201)
				.expect(res => {
					expect(res.body).to.have.property('id');
					expect(res.body.plan_type).to.eql(newPlan.plan_type);
					expect(res.body.plan_name).to.eql(newPlan	.plan_name);
					expect(res.body.start_date).to.eql(newPlan.start_date);
					expect(res.body.end_date).to.eql(newPlan.end_date);
					expect(res.body.description).to.eql(newPlan.description);
					expect(res.body.plan_place_id).to.eql(newPlan.plan_place_id);
					expect(res.body.city_name).to.eql(newPlan.city_name);
					expect(res.body.utc_offset_minutes).to.eql(newPlan.utc_offset_minutes);
					expect(res.body.trip_id).to.eql(tripId);
					expect(res.headers.location).to.eql(`/api/trips/${res.body.trip_id}/plans/${res.body.id}`);
				})
				.expect(res => {
					db
						.from('trip_plans')
						.select('*')
						.where({ id: res.body.id })
						.first()
						.then(row => {
							expect(row.plan_type).to.eql(newPlan.plan_type);
							expect(row.plan_name).to.eql(newPlan.plan_name);
							expect(new Date(row.start_date).toISOString()).to.eql(newPlan.start_date);
							expect(new Date(row.end_date).toISOString()).to.eql(newPlan.end_date);
							expect(row.description).to.eql(newPlan.description);
							expect(row.plan_place_id).to.eql(newPlan.plan_place_id);
							expect(row.city_name).to.eql(newPlan.city_name);
							expect(row.utc_offset_minutes).to.eql(newPlan.utc_offset_minutes);
							expect(row.trip_id).to.eql(tripId);
							const expectDate = new Date().toLocaleString();
							const actualDate = new Date(row.date_created).toLocaleString();
							expect(actualDate).to.eql(expectDate);
						})
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
				const expectedPlans = testPlans
					.filter(p => p.trip_id === testPlan.trip_id && p.id !== testPlan.id);

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

			it('updates the specified plan, responding with 200 and the updated plan', () => {
				const tripId = 1;
				const planId = 1;
				const updatePlan = {
					plan_type: 'Car Rental',
					plan_name: 'Hertz Newtown Square', 
					start_date: '2019-04-05T20:00:00.000Z', 
					end_date: '2019-04-05T21:00:00.000Z', 
					description: 'test blah blah', 
					plan_place_id: '19073', 
					city_name: 'New City',
					utc_offset_minutes: 240
				};

				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(updatePlan)
					.expect(200)
					.expect(res => {
						expect(res.body.id).to.eql(planId);
						expect(res.body.trip_id).to.eql(tripId);
						expect(res.body.plan_type).to.eql(updatePlan.plan_type);
						expect(res.body.plan_name).to.eql(updatePlan.plan_name);
						expect(res.body.start_date).to.eql(updatePlan.start_date);
						expect(res.body.end_date).to.eql(updatePlan.end_date);
						expect(res.body.description).to.eql(updatePlan.description);
						expect(res.body.plan_place_id).to.eql(updatePlan.plan_place_id);
						expect(res.body.city_name).to.eql(updatePlan.city_name);
						expect(res.body.utc_offset_minutes).to.eql(updatePlan.utc_offset_minutes);
					})
					.expect(res => {
						db
							.from('trip_plans')
							.select('*')
							.where({ id: planId })
							.first()
							.then(row => {
								expect(row.plan_type).to.eql(updatePlan.plan_type);
								expect(row.plan_name).to.eql(updatePlan.plan_name);
								expect(new Date(row.start_date).toISOString()).to.eql(updatePlan.start_date);
								expect(new Date(row.end_date).toISOString()).to.eql(updatePlan.end_date);
								expect(row.description).to.eql(updatePlan.description);
								expect(row.plan_place_id).to.eql(updatePlan.plan_place_id);
								expect(row.city_name).to.eql(updatePlan.city_name);
								expect(row.utc_offset_minutes).to.eql(updatePlan.utc_offset_minutes);
								expect(row.trip_id).to.eql(tripId);
								const expectDate = new Date().toLocaleString();
								const actualDate = new Date(row.date_modified).toLocaleString();
								expect(actualDate).to.eql(expectDate);
							})
					});
			})
		})
	})
})
