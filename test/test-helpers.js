const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
	return [
		{
			id: 1,
			email: 'test-user-1@test.com',
			user_name: 'test-user-1',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z'
		},
		{
			id: 2,
			email: 'test-user-2@test.com',
			user_name: 'test-user-2',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z'
		},
		{
			id: 3,
			email: 'test-user-3@test.com',
			user_name: 'test-user-3',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z'
		},
		{
			id: 4,
			email: 'test-user-4@test.com',
			user_name: 'test-user-4',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z'
		}
	];
}

function makeTripsArray() {
	return [
		{
			id: 1,
			trip_name: 'Sunny Mediterranean',
			dest_cities: [
				{
					city_name: 'Barcelona',
					city_place_id: '123',
					utc_offset_minutes: 180,
					viewport: {
						ne_lat: 41.4695761,
						ne_lng: 2.2280099,
						sw_lat: 41.3200040,
						sw_lng: 2.0695258
					}
				},
				{
					city_name: 'Florence',
					city_place_id: '456',
					utc_offset_minutes: 180,
					viewport: {}
				},
				{
					city_name: 'Rome',
					city_place_id: '789',
					utc_offset_minutes: 180, 
					viewport: {}
				}
			],
			start_date: '2019-04-01T00:00:00.000Z',
			end_date: '2019-04-14T00:00:00.000Z',
			description: '',
			user_id: 1,
			date_created: '2020-01-22T16:28:32.615Z'
		},
		{
			id: 2,
			trip_name: 'Family Trip 2020',
			dest_cities: [
				{
					city_name: 'Tokyo',
					city_place_id: '321',
					utc_offset_minutes: 720,
					viewport: {}
				}
			],
			start_date: '2019-04-30T00:00:00.000Z',
			end_date: '2019-05-05T00:00:00.000Z',
			description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
			user_id: 1,
			date_created: '2020-01-22T16:28:32.615Z'
		},
		{
			id: 3,
			trip_name: 'Test Trip 2020',
			dest_cities: [
				{
					city_name: 'New York',
					city_place_id: '123456',
					utc_offset_minutes: -240,
					viewport: {}
				}
			],
			start_date: '2019-04-30T00:00:00.000Z',
			end_date: '2019-05-05T00:00:00.000Z',
			description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
			user_id: 2,
			date_created: '2020-01-22T16:28:32.615Z'
		}
	];
}

function makeDestCitiesArray() {
	return [
		{
			id: 1,
			city_name: 'Barcelona',
			city_place_id: '123',
			utc_offset_minutes: 180,
			trip_id: 1,
			viewport: {
				ne_lat: 41.4695761,
				ne_lng: 2.2280099,
				sw_lat: 41.3200040,
				sw_lng: 2.0695258
			}
		},
		{
			id: 2,
			city_name: 'Florence',
			city_place_id: '456',
			utc_offset_minutes: 180,
			trip_id: 1,
			viewport: {}
		},
		{
			id: 3,
			city_name: 'Rome',
			city_place_id: '789',
			utc_offset_minutes: 180,
			trip_id: 1,
			viewport: {}
		},
		{
			id: 4,
			city_name: 'Tokyo',
			city_place_id: '321',
			utc_offset_minutes: 720,
			trip_id: 2,
			viewport: {}
		},
		{
			id: 5,
			city_name: 'New York',
			city_place_id: '123456',
			utc_offset_minutes: -240,
			trip_id: 3,
			viewport: {}
		}
	]
}

function makePlansArray() {
	return [
		{
			id: 1,
			plan_type: 'Flight',
			plan_name: 'BR772',
			plan_place_id: '',
			start_date: '2019-04-01T01:40:00.000Z',
			end_date: '2019-04-01T11:00:00.000Z',
			description: '',
			trip_id: 1,
			city_name: 'Barcelona',
			utc_offset_minutes: 180,
			formatted_address: '',
			international_phone_number: '',
			website: '',
			plan_details: [{
				from_name: 'TPE',
				to_name: 'BCN'
			}]
		},
		{
			id: 2,
			plan_type: 'Lodging',
			plan_name: 'H10 Metropolitan Hotel',
			start_date: '2019-04-01T13:00:00.000Z',
			end_date: '2019-04-06T00:00:00.000Z',
			description: '',
			trip_id: 1,
			city_name: 'Barcelona',
			utc_offset_minutes: 180,
			formatted_address: 'Rambla de Catalunya, 7, 08007 Barcelona, Spain',
			international_phone_number: '+34 932 14 07 20',
			website: 'https://www.h10hotels.com/en/barcelona-hotels/h10-metropolitan?utm_source=Google%20My%20Business&utm_medium=Boton%20sitio%20web&utm_campaign=HME',
			plan_details: [
				{ plan_subtype: 'Check in' },
				{ plan_subtype: 'Check out' }
			]
		},
		{
			id: 3,
			plan_type: 'Activity',
			plan_name: 'La Sagrada Familia',
			plan_place_id: '',
			start_date: '2019-04-05T14:00:00.000Z',
			end_date: '2019-04-05T18:00:00.000Z',
			description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
			trip_id: 1,
			city_name: 'Barcelona',
			utc_offset_minutes: 180,
			formatted_address: '',
			international_phone_number: '',
			website: ''
		},
		{
			id: 4,
			plan_type: 'Car Rental',
			plan_name: 'Autoeuropa',
			plan_place_id: '',
			start_date: '2019-04-05T12:00:00.000Z',
			end_date: '2019-04-08T20:00:00.000Z',
			description: '',
			trip_id: 1,
			city_name: 'Florence',
			utc_offset_minutes: 180,
		}
	];
}

function makePlanDetailsArray() {
	return [
		{
			id: 1,
			from_name: 'TPE',
			to_name: 'BCN',
			plan_id: 1
		},
		{
			id: 2,
			plan_subtype: 'Check in',
			plan_id: 2
		},
		{
			id: 3,
			plan_subtype: 'Check out',
			plan_id: 2
		},
		{
			id: 4,
			plan_subtype: 'Pick up',
			plan_id: 4,
			from_name: 'Sicily By Car - AutoEuropa',
			from_place_id: 'ChIJCwTjKaxWKhMRoWTZJO1xK3Y',
			from_utc_offset_minutes: 120,
			from_formatted_address: 'R, Borgo Ognissanti, 100, 50123 Firenze FI, Italy',
			from_international_phone_number: '+39 055 213333',
			from_website: 'http://www.sbc.it/'
		},
		{
			id: 5,
			plan_subtype: 'Drop off',
			plan_id: 4,
			to_name: 'Sicily By Car - AutoEuropa',
			to_place_id: 'ChIJCwTjKaxWKhMRoWTZJO1xK3Y',
			to_utc_offset_minutes: 120,
			to_formatted_address: 'R, Borgo Ognissanti, 100, 50123 Firenze FI, Italy',
			to_international_phone_number: '+39 055 213333',
			to_website: 'http://www.sbc.it/'

		}
	];
}

function makeExpectedTrips(trips, destCities) {
	return trips.map(t => makeExpectedTrip(t, destCities));
}

function makeExpectedTrip(trip, destCities) {
	const destCitiesForTrip = destCities
		.filter(dc => dc.trip_id === trip.id);

	const expectedTrip = {
		dest_cities: destCitiesForTrip,
		...trip
	};
	delete expectedTrip.date_created;
	return expectedTrip;
}

function makeExpectedPlans(plans, planDetails) {
	const expectedPlans = [];
	plans.forEach(plan => {
		const plansById = makeExpectedPlan(plan, planDetails);
		plansById.forEach(p => {
			expectedPlans.push(p);
		})
	})

	expectedPlans.sort(function(a, b) {
		return new Date(a.comparable_date) - new Date(b.comparable_date);
	});

	return expectedPlans;
}

function makeExpectedPlan(plan, planDetails) {
	delete plan.plan_details;
	const planDetailsForPlan = planDetails
		.filter(pd => pd.plan_id === plan.id);

	const expectedPlans = [];

	if (planDetailsForPlan.length) {
		planDetailsForPlan.forEach(pd => {
			const comparable_date = (
				pd.plan_subtype === 'Check out' || 
				pd.plan_subtype === 'Drop off'
			)
				? plan.end_date
				: plan.start_date;

			const expectedPlan = {
				plan_detail_id: pd.id,
				...pd,
				...plan,
				comparable_date
			};

			delete expectedPlan.plan_id;

			expectedPlans.push(expectedPlan);
		})
	}
	else {
		expectedPlans.push({
			...plan,
			comparable_date: plan.start_date
		});
	}

	return expectedPlans;
}

function makeTripsFixtures() {
	const testUsers = makeUsersArray();
	const testTrips = makeTripsArray();
	const testDestCities = makeDestCitiesArray();
	const testPlans = makePlansArray();
	const testPlanDetails = makePlanDetailsArray();
	return { testUsers, testTrips, testDestCities, testPlans, testPlanDetails };
}

function cleanTables(db) {
	return db.raw(
		`TRUNCATE
			users,
			trips,
			trip_dest_cities,
			trip_plans,
			plan_details
			RESTART IDENTITY CASCADE`
	);
}

function seedUsers(db, users) {
	const preppedUsers = users.map(user => ({
		...user,
		password: bcrypt.hashSync(user.password, 1)
	}));

	return db.into('users').insert(preppedUsers)
		.then(() => 
			// update the auto sequence to match the forced id values
			db.raw(
				`SELECT setval('users_id_seq', ?)`,
				[users[users.length - 1].id]
			)
		);
}

function seedTripsTables(db, users, trips, destCities, plans, planDetails) {
	trips = trips.map(trip => {
		delete trip.dest_cities;
		return trip;
	});
	destCities = destCities.map(dc => {
		dc = { ...dc.viewport, ...dc };
		delete dc.viewport;
		return dc;
	});
	plans = plans.map(plan => {
		delete plan.plan_details;
		return plan;
	});

	return db.transaction(async trx => {		
		await seedUsers(db, users);
		await trx.into('trips').insert(trips)
			.then(() => 
				trx.raw(
					`SELECT setval('trips_id_seq', ?)`,
					[trips[trips.length - 1].id]
				)
			);
		await trx.into('trip_dest_cities').insert(destCities)
			.then(() => 
				trx.raw(
					`SELECT setval('trip_dest_cities_id_seq', ?)`,
					[destCities[destCities.length - 1].id]
				)
			);
		await trx.into('trip_plans').insert(plans)
			.then(() => 
				trx.raw(
					`SELECT setval('trip_plans_id_seq', ?)`,
					[plans[plans.length - 1].id]
				)
			);
		await trx.into('plan_details').insert(planDetails)
			.then(() => 
				trx.raw(
					`SELECT setval('plan_details_id_seq', ?)`,
					[planDetails[planDetails.length - 1].id]
				)
			);
	});
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
	const token = jwt.sign({ user_id: user.id }, secret, {
		subject: user.email,
		algorithm: 'HS256'
	});
	return `Bearer ${token}`;
}

module.exports = {
	makeUsersArray,
	makeTripsArray,
	makeDestCitiesArray,
	makePlansArray,
	makePlanDetailsArray,
	makeExpectedTrips,
	makeExpectedTrip,
	makeExpectedPlans,
	makeExpectedPlan,
	makeTripsFixtures,
	cleanTables,
	seedUsers,
	seedTripsTables,
	makeAuthHeader
};