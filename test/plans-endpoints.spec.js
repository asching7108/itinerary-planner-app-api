const knex = require('knex');
const app = require('../src/App');
const helpers = require('./test-helpers');

describe('Plans Endpoints', () => {
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

	describe(`POST /api/plans`, () => {
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
			'trip_id', 
			'trip_dest_city_id'
		];

		requiredFields.forEach(field => {
			const newPlan = {
				plan_type: 'Activity',
				plan_name: 'Test New Plan',
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z',
				trip_id: 1,
				trip_dest_city_id: 1
			};

			it(`responds with 400 error when the '${field}' is missing`, () => {
				delete newPlan[field];

				return supertest(app)
					.post('/api/plans')
					.set('Authorization', helpers.makeAuthHeader(testUser))
					.send(newPlan)
					.expect(400, {
						error: `Missing '${field}' in request body`,
					})
			})
		})

		it('creates a plan, responding with 201 and the new plan', () => {
			const newPlan = {
				plan_type: 'Activity',
				plan_name: 'Test New Plan',
				start_date: '2020-07-01T00:00:00.000Z',
				end_date: '2020-07-03T00:00:00.000Z',
				description: 'blah blah',
				trip_id: 1,
				trip_dest_city_id: 1
			};

			return supertest(app)
				.post('/api/plans')
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
					expect(res.body.trip_id).to.eql(newPlan.trip_id);
					expect(res.body.trip_dest_city_id).to.eql(newPlan.trip_dest_city_id);
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
							expect(row.trip_id).to.eql(newPlan.trip_id);
							expect(row.trip_dest_city_id).to.eql(newPlan.trip_dest_city_id);
							const expectDate = new Date().toLocaleString();
							const actualDate = new Date(row.date_created).toLocaleString();
							expect(actualDate).to.eql(expectDate);
						})
				})
		})
	})
})