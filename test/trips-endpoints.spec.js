const knex = require('knex');
const moment = require('moment');
const app = require('../src/App');
const helpers = require('./test-helpers');

describe('Trips Endpoints', () => {
	let db;

	const {
		testUsers,
		testTrips,
		testDestCities,
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

	describe(`GET /api/trips/:user_id`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it('responds with 200 and an empty list', () => {
				return supertest(app)
					.get(`/api/trips/${testUser.id}`)
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
					testDestCities
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
					.get(`/api/trips/${testUser.id}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200, expectedTrips);
			})
		})
	})

	describe(`GET /api/trips/:user_id/:trip_id`, () => {
		context(`Given no trips`, () => {
			beforeEach('insert users', () => helpers.seedUsers(db, testUsers))

			it('responds with 404', () => {
				const tripId = 123456;
				return supertest(app)
					.get(`/api/trips/${testUser}/${tripId}`)
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
					testDestCities
				)
			)

			it('responds with 200 and the specified trip', () => {
				const tripId = 2;				
				const expectedTrip = helpers.makeExpectedTrip(
					testTrips[tripId - 1],
					testDestCities,
				)

				return supertest(app)
					.get(`/api/trips/${testUser}/${tripId}`)
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.expect(200, expectedTrip);
			})
		})
	})

	describe(`POST /api/trips`, () => {
		beforeEach('insert trips', () => 
			helpers.seedTripsTables(
				db,
				testUsers,
				testTrips,
				testDestCities
			)
		)

		const requiredFields = ['trip_name', 'start_date', 'end_date', 'dest_cities'];

    requiredFields.forEach(field => {
      const newTrip = {
				trip_name: 'Test New Trip',
				dest_cities: [
					{
						city_name: 'New York',
						city_place_id: ''
					},
					{
						city_name: 'Philadelphia',
						city_place_id: ''
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

		const requiredFieldsDestCities = ['city_name', 'city_place_id'];

    requiredFieldsDestCities.forEach(field => {
      const newTrip = {
				trip_name: 'Test New Trip',
				dest_cities: [
					{
						city_name: 'New York',
						city_place_id: '123'
					},
					{
						city_name: 'Philadelphia',
						city_place_id: '321'
					}
				],
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z'
      };

      it(`responds with 400 error when '${field}' of any 'dest_cities' item is missing`, () => {
				const testIdx = 1;
				delete newTrip.dest_cities[testIdx][field];				

        return supertest(app)
          .post('/api/trips')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newTrip)
          .expect(400, {
            error: `Missing '${field}' of 'dest_cities[${testIdx}]' in request body`,
          })
			})
		})

		it('creates a trip, responding with 201 and the new trip', () => {
			const newTrip = {
				trip_name: 'Test New Trip',
				dest_cities: [
					{
						city_name: 'New York',
						city_place_id: '123'
					},
					{
						city_name: 'Philadelphia',
						city_place_id: '321'
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
					expect(res.headers.location).to.eql(`/api/trips/${testUser.id}/${res.body.id}`);
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
})
