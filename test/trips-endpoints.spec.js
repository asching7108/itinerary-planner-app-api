const knex = require('knex');
const app = require('../src/App');
const helpers = require('./test-helpers');

describe('Trips Endpoints', () => {
	let db;

	const {
		testUsers,
		testTrips,
		testDestCities,
		testPlans,
		testPlanDetails
	} = helpers.makeTripsFixtures();
	const testUser = testUsers[0];

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DATABASE_URL,
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
					testPlans,
					testPlanDetails
				)
			)

			it('responds with 200 and all of the trips of the given user_id', () => {
				const expectedTrips = helpers.makeExpectedTrips(
					testTrips.filter(trip => trip.user_id === testUser.id),
					testDestCities
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
					testPlans,
					testPlanDetails
				)
			)

			it(`responds with 404 when trip id is not valid`, () => {
				const tripId = 'not-valid';
				return supertest(app)
					.get(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid trip id` });
			})

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
						utc_offset_minutes: -240,
						viewport: {
							ne_lat: 41.4695761,
							ne_lng: 2.2280099,
							sw_lat: 41.3200040,
							sw_lng: 2.0695258
						}
					},
					{
						city_name: 'Philadelphia',
						city_place_id: '654321',
						utc_offset_minutes: -240,
						viewport: {}
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
						expect(dc.viewport.ne_lat).to.eql(newTrip.dest_cities[idx].viewport.ne_lat);
						expect(dc.viewport.ne_lng).to.eql(newTrip.dest_cities[idx].viewport.ne_lng);
						expect(dc.viewport.sw_lat).to.eql(newTrip.dest_cities[idx].viewport.sw_lat);
						expect(dc.viewport.sw_lng).to.eql(newTrip.dest_cities[idx].viewport.sw_lng);
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
								expect(Number(row.ne_lat)).to.eql(newTrip.dest_cities[idx].viewport.ne_lat || 0);
								expect(Number(row.ne_lng)).to.eql(newTrip.dest_cities[idx].viewport.ne_lng || 0);
								expect(Number(row.sw_lat)).to.eql(newTrip.dest_cities[idx].viewport.sw_lat || 0);
								expect(Number(row.sw_lng)).to.eql(newTrip.dest_cities[idx].viewport.sw_lng || 0);
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
					testPlans,
					testPlanDetails
				)
			)

			it(`responds with 404 when trip id is not valid`, () => {
				const tripId = 'not-valid';
				return supertest(app)
					.delete(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid trip id` });
			})

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
					.patch(`/api/trips/${tripId}`)
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
					testPlans,
					testPlanDetails
				)
			)

			it(`responds with 404 when trip id is not valid`, () => {
				const tripId = 'not-valid';
				return supertest(app)
					.patch(`/api/trips/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid trip id` });
			})

			it('updates the specified trip, responding with 200 and the updated trip', () => {
				const tripId = 2;				
				const updateTrip = {
					trip_name: 'Test Update Trip',
					dest_cities: [
						{
							city_name: 'Taipei',
							city_place_id: '654321',
							utc_offset_minutes: 480,
							viewport: {
								ne_lat: 41.4695761,
								ne_lng: 2.2280099,
								sw_lat: 41.3200040,
								sw_lng: 2.0695258
							}
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
							expect(dc.viewport.ne_lat).to.eql(updateTrip.dest_cities[idx].viewport.ne_lat);
							expect(dc.viewport.ne_lng).to.eql(updateTrip.dest_cities[idx].viewport.ne_lng);
							expect(dc.viewport.sw_lat).to.eql(updateTrip.dest_cities[idx].viewport.sw_lat);
							expect(dc.viewport.sw_lng).to.eql(updateTrip.dest_cities[idx].viewport.sw_lng);
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
									expect(Number(row.ne_lat)).to.eql(updateTrip.dest_cities[idx].viewport.ne_lat || 0);
									expect(Number(row.ne_lng)).to.eql(updateTrip.dest_cities[idx].viewport.ne_lng || 0);
									expect(Number(row.sw_lat)).to.eql(updateTrip.dest_cities[idx].viewport.sw_lat || 0);
									expect(Number(row.sw_lng)).to.eql(updateTrip.dest_cities[idx].viewport.sw_lng || 0);
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
					testPlans,
					testPlanDetails
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
					testPlans,
					testPlanDetails
				)
			)

			it(`responds with 404 when trip id is not valid`, () => {
				const tripId = 'not-valid';
				return supertest(app)
					.get(`/api/trips/${tripId}/plans`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid trip id` });
			})

			it('responds with 200 and the specified plans', () => {
				const tripId = 1;
				const expectedPlans = helpers.makeExpectedPlans(
					testPlans.filter(p => p.trip_id === tripId),
					testPlanDetails
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
					testPlans,
					testPlanDetails
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
					testPlans,
					testPlanDetails
				)
			)
			
			it(`responds with 404 when trip id is not valid`, () => {
				const tripId = 'not-valid';
				const planId = 123456;
				return supertest(app)
					.get(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid trip id` });
			})

			it(`responds with 404 when plan id is not valid`, () => {
				const tripId = 1;
				const planId = 'not-valid';
				return supertest(app)
					.get(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid plan id` });
			})

			it('responds with 200 and the specified plan', () => {
				const testPlan = testPlans[0];
				const expectedPlan = helpers.makeExpectedPlan(
					testPlan,
					testPlanDetails
				);

				return supertest(app)
				.get(`/api/trips/${testPlan.trip_id}/plans/${testPlan.id}`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.expect(200, expectedPlan);
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
				testPlans,
				testPlanDetails
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

		it(`responds with 404 when trip doesn't exist`, () => {
			const tripId = 123456;
			return supertest(app)
				.get(`/api/trips/${tripId}/plans`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.expect(404, { error: `Trip doesn't exist` });
		})

		it(`responds with 404 when trip id is not valid`, () => {
			const tripId = 'not-valid';
			return supertest(app)
				.post(`/api/trips/${tripId}/plans`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.expect(404, { error: `Invalid trip id` });
		})

		it('creates a plan, responding with 201 and the new plan', () => {
			const tripId = 1;
			const newPlan = {
				plan_type: 'Car Rental',
				plan_name: 'Test New Plan',
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z',
				description: 'blah blah',
				plan_place_id: '11078', 
				city_name: 'Taipei',
				utc_offset_minutes: 480,
				formatted_address: 'Rambla de Catalunya, 7, 08007 Barcelona, Spain',
				international_phone_number: '+34 932 14 07 20',
				website: 'https://test.com',
				plan_details: [
					{
						plan_subtype: 'Pick up',
						from_name: 'ABC Store',
						from_place_id: '123',
						from_utc_offset_minutes: 480,
						from_formatted_address: 'R, Borgo Ognissanti, 100, 50123 Firenze FI, Italy',
						from_international_phone_number: '+39 055 213333',
						from_website: 'http://www.sbc.it/'
					},
					{
						plan_subtype: 'Drop off',
						to_name: 'DEF Store',
						to_place_id: '321',
						to_utc_offset_minutes: 480,to_formatted_address: 'R, Borgo Ognissanti, 100, 50123 Firenze FI, Italy',
						to_international_phone_number: '+39 055 213333',
						to_website: 'http://www.sbc.it/'
					}
				]
			};

			return supertest(app)
				.post(`/api/trips/${tripId}/plans`)
				.set('Authorization', helpers.makeAuthHeader(testUser))
				.send(newPlan)
				.expect(201)
				.expect(res => {
					res.body.forEach(p => {
						expect(p).to.have.property('id');
						expect(p).to.have.property('plan_detail_id');
						expect(p.plan_type).to.eql(newPlan.plan_type);
						expect(p.plan_name).to.eql(newPlan.plan_name);
						expect(p.start_date).to.eql(newPlan.start_date);
						expect(p.end_date).to.eql(newPlan.end_date);
						expect(p.description).to.eql(newPlan.description);
						expect(p.plan_place_id).to.eql(newPlan.plan_place_id);
						expect(p.city_name).to.eql(newPlan.city_name);
						expect(p.utc_offset_minutes).to.eql(newPlan.utc_offset_minutes);
						expect(p.formatted_address).to.eql(newPlan.formatted_address);
						expect(p.international_phone_number).to.eql(newPlan.international_phone_number);
						expect(p.website).to.eql(newPlan.website);
						expect(p.trip_id).to.eql(tripId);
					})
					expect(res.body[0].plan_subtype).to.eql(newPlan.plan_details[0].plan_subtype);
					expect(res.body[0].from_name).to.eql(newPlan.plan_details[0].from_name);
					expect(res.body[0].from_place_id).to.eql(newPlan.plan_details[0].from_place_id);
					expect(res.body[0].from_utc_offset_minutes).to.eql(newPlan.plan_details[0].from_utc_offset_minutes);
					expect(res.body[0].from_formatted_address).to.eql(newPlan.plan_details[0].from_formatted_address);
					expect(res.body[0].from_international_phone_number).to.eql(newPlan.plan_details[0].from_international_phone_number);
					expect(res.body[0].from_website).to.eql(newPlan.plan_details[0].from_website);
					expect(res.body[1].plan_subtype).to.eql(newPlan.plan_details[1].plan_subtype);
					expect(res.body[1].to_name).to.eql(newPlan.plan_details[1].to_name);
					expect(res.body[1].to_place_id).to.eql(newPlan.plan_details[1].to_place_id);
					expect(res.body[1].to_utc_offset_minutes).to.eql(newPlan.plan_details[1].to_utc_offset_minutes);
					expect(res.body[1].to_formatted_address).to.eql(newPlan.plan_details[1].to_formatted_address);
					expect(res.body[1].to_international_phone_number).to.eql(newPlan.plan_details[1].to_international_phone_number);
					expect(res.body[1].to_website).to.eql(newPlan.plan_details[1].to_website);
					expect(res.headers.location).to.eql(`/api/trips/${res.body[0].trip_id}/plans/${res.body[0].id}`);
				})
				.expect(res => {
					db
						.from('trip_plans')
						.select('*')
						.where({ id: res.body[0].id })
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
							expect(row.formatted_address).to.eql(newPlan.formatted_address);
							expect(row.international_phone_number).to.eql(newPlan.international_phone_number);
							expect(row.website).to.eql(newPlan.website);
							expect(row.trip_id).to.eql(tripId);
							const expectDate = new Date().toLocaleString();
							const actualDate = new Date(row.date_created).toLocaleString();
							expect(actualDate).to.eql(expectDate);
						});
				})
				.expect(res => {
					db
						.from('plan_details')
						.select('*')
						.where({ plan_id: res.body[0].id })
						.then(rows => {
							expect(rows[0].plan_subtype).to.eql(newPlan.plan_details[0].plan_subtype);
							expect(rows[0].from_name).to.eql(newPlan.plan_details[0].from_name);
							expect(rows[0].from_place_id).to.eql(newPlan.plan_details[0].from_place_id);
							expect(rows[0].from_utc_offset_minutes).to.eql(newPlan.plan_details[0].from_utc_offset_minutes);
							expect(rows[0].from_formatted_address).to.eql(newPlan.plan_details[0].from_formatted_address);
							expect(rows[0].from_international_phone_number).to.eql(newPlan.plan_details[0].from_international_phone_number);
							expect(rows[0].from_website).to.eql(newPlan.plan_details[0].from_website);
							expect(rows[1].plan_subtype).to.eql(newPlan.plan_details[1].plan_subtype);
							expect(rows[1].to_name).to.eql(newPlan.plan_details[1].to_name);
							expect(rows[1].to_place_id).to.eql(newPlan.plan_details[1].to_place_id);
							expect(rows[1].to_utc_offset_minutes).to.eql(newPlan.plan_details[1].to_utc_offset_minutes);
							expect(rows[1].to_formatted_address).to.eql(newPlan.plan_details[1].to_formatted_address);
							expect(rows[1].to_international_phone_number).to.eql(newPlan.plan_details[1].to_international_phone_number);
							expect(rows[1].to_website).to.eql(newPlan.plan_details[1].to_website);
						});
				});
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
					testPlans,
					testPlanDetails
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
					testPlans,
					testPlanDetails
				)
			)

			it(`responds with 404 when trip id is not valid`, () => {
				const tripId = 'not-valid';
				const planId = 123456;
				return supertest(app)
					.delete(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid trip id` });
			})

			it(`responds with 404 when plan id is not valid`, () => {
				const tripId = 1;
				const planId = 'not-valid';
				return supertest(app)
					.delete(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid plan id` });
			})

			it('deletes the specified plan, responding with 204', () => {
				const testPlan = testPlans[0];
				const expectedPlans = helpers.makeExpectedPlans(
					testPlans.filter(p => p.trip_id === testPlan.trip_id && p.id !== testPlan.id),
					testPlanDetails
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
					testPlans,
					testPlanDetails
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
					testPlans,
					testPlanDetails
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

			it(`responds with 404 when trip id is not valid`, () => {
				const tripId = 'not-valid';
				const planId = 123456;
				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid trip id` });
			})

			it(`responds with 404 when plan id is not valid`, () => {
				const tripId = 1;
				const planId = 'not-valid';
				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(404, { error: `Invalid plan id` });
			})

			it('updates the specified plan, responding with 200 and the updated plan', () => {
				const tripId = 1;
				const planId = 1;
				const updatePlan = {
					plan_type: 'Car Rental',
					plan_name: 'Test New Plan',
					start_date: '2020-07-01T00:00:00.000Z',
					end_date: '2020-07-03T00:00:00.000Z',
					description: 'blah blah',
					plan_place_id: '11078', 
					city_name: 'Taipei',
					utc_offset_minutes: 480,
					formatted_address: 'Rambla de Catalunya, 7, 08007 Barcelona, Spain',
					international_phone_number: '+34 932 14 07 20',
					website: 'https://test.com',
					plan_details: [
						{
							plan_subtype: 'Pick up',
							from_name: 'ABC Store',
							from_place_id: '123',
							from_utc_offset_minutes: 480,
							from_formatted_address: 'R, Borgo Ognissanti, 100, 50123 Firenze FI, Italy',
							from_international_phone_number: '+39 055 213333',
							from_website: 'http://www.sbc.it/'
						},
						{
							plan_subtype: 'Drop off',
							to_name: 'DEF Store',
							to_place_id: '321',
							to_utc_offset_minutes: 480,to_formatted_address: 'R, Borgo Ognissanti, 100, 50123 Firenze FI, Italy',
							to_international_phone_number: '+39 055 213333',
							to_website: 'http://www.sbc.it/'
						}
					]
				};

				return supertest(app)
					.patch(`/api/trips/${tripId}/plans/${planId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(updatePlan)
					.expect(200)
					.expect(res => {
						res.body.forEach(p => {
							expect(p.id).to.eql(planId);
							expect(p).to.have.property('plan_detail_id');
							expect(p.plan_type).to.eql(updatePlan.plan_type);
							expect(p.plan_name).to.eql(updatePlan.plan_name);
							expect(p.start_date).to.eql(updatePlan.start_date);
							expect(p.end_date).to.eql(updatePlan.end_date);
							expect(p.description).to.eql(updatePlan.description);
							expect(p.plan_place_id).to.eql(updatePlan.plan_place_id);
							expect(p.city_name).to.eql(updatePlan.city_name);
							expect(p.utc_offset_minutes).to.eql(updatePlan.utc_offset_minutes);
							expect(p.formatted_address).to.eql(updatePlan.formatted_address);
							expect(p.international_phone_number).to.eql(updatePlan.international_phone_number);
							expect(p.website).to.eql(updatePlan.website);
							expect(p.trip_id).to.eql(tripId);
						})
						expect(res.body[0].plan_subtype).to.eql(updatePlan.plan_details[0].plan_subtype);
						expect(res.body[0].from_name).to.eql(updatePlan.plan_details[0].from_name);
						expect(res.body[0].from_place_id).to.eql(updatePlan.plan_details[0].from_place_id);
						expect(res.body[0].from_utc_offset_minutes).to.eql(updatePlan.plan_details[0].from_utc_offset_minutes);
						expect(res.body[0].from_formatted_address).to.eql(updatePlan.plan_details[0].from_formatted_address);
						expect(res.body[0].from_international_phone_number).to.eql(updatePlan.plan_details[0].from_international_phone_number);
						expect(res.body[0].from_website).to.eql(updatePlan.plan_details[0].from_website);
						expect(res.body[1].plan_subtype).to.eql(updatePlan.plan_details[1].plan_subtype);
						expect(res.body[1].to_name).to.eql(updatePlan.plan_details[1].to_name);
						expect(res.body[1].to_place_id).to.eql(updatePlan.plan_details[1].to_place_id);
						expect(res.body[1].to_utc_offset_minutes).to.eql(updatePlan.plan_details[1].to_utc_offset_minutes);
						expect(res.body[1].to_formatted_address).to.eql(updatePlan.plan_details[1].to_formatted_address);
						expect(res.body[1].to_international_phone_number).to.eql(updatePlan.plan_details[1].to_international_phone_number);
						expect(res.body[1].to_website).to.eql(updatePlan.plan_details[1].to_website);
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
								expect(row.formatted_address).to.eql(updatePlan.formatted_address);
								expect(row.international_phone_number).to.eql(updatePlan.international_phone_number);
								expect(row.website).to.eql(updatePlan.website);
								expect(row.trip_id).to.eql(tripId);
								const expectDate = new Date().toLocaleString();
								const actualDate = new Date(row.date_modified).toLocaleString();
								expect(actualDate).to.eql(expectDate);
							});
					})
					.expect(res => {
						db
							.from('plan_details')
							.select('*')
							.where({ plan_id: planId })
							.then(rows => {
								expect(rows[0].plan_subtype).to.eql(updatePlan.plan_details[0].plan_subtype);
								expect(rows[0].from_name).to.eql(updatePlan.plan_details[0].from_name);
								expect(rows[0].from_place_id).to.eql(updatePlan.plan_details[0].from_place_id);
								expect(rows[0].from_utc_offset_minutes).to.eql(updatePlan.plan_details[0].from_utc_offset_minutes);
								expect(rows[0].from_formatted_address).to.eql(updatePlan.plan_details[0].from_formatted_address);
								expect(rows[0].from_international_phone_number).to.eql(updatePlan.plan_details[0].from_international_phone_number);
								expect(rows[0].from_website).to.eql(updatePlan.plan_details[0].from_website);
								expect(rows[1].plan_subtype).to.eql(updatePlan.plan_details[1].plan_subtype);
								expect(rows[1].to_name).to.eql(updatePlan.plan_details[1].to_name);
								expect(rows[1].to_place_id).to.eql(updatePlan.plan_details[1].to_place_id);
								expect(rows[1].to_utc_offset_minutes).to.eql(updatePlan.plan_details[1].to_utc_offset_minutes);
								expect(rows[1].to_formatted_address).to.eql(updatePlan.plan_details[1].to_formatted_address);
								expect(rows[1].to_international_phone_number).to.eql(updatePlan.plan_details[1].to_international_phone_number);
								expect(rows[1].to_website).to.eql(updatePlan.plan_details[1].to_website);
							});
					});
			})
		})
	})
})
