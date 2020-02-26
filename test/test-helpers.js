const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
	return [
		{
			id: 1,
			email: 'test-user-1@test.com',
			user_name: 'test-user-1',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z',
		},
		{
			id: 2,
			email: 'test-user-2@test.com',
			user_name: 'test-user-2',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z',
		},
		{
			id: 3,
			email: 'test-user-3@test.com',
			user_name: 'test-user-3',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z',
		},
		{
			id: 4,
			email: 'test-user-4@test.com',
			user_name: 'test-user-4',
			password: 'P@ssw0rd',
			date_created: '2020-01-22T16:28:32.615Z',
		}
	];
}

function makeTripsArray(users) {
	return [
		{
			id: 1,
			name: 'Sunny Mediterranean',
			dest_city: [
				'Barcelona',
				'Florence',
				'Rome'
			],
			start_date: '2019-04-01T00:00:00.000Z',
			end_date: '2019-04-14T00:00:00.000Z',
			description: ''
		},
		{
			id: 2,
			name: 'Family Trip 2020',
			dest_city: [
				'Tokyo'
			],
			start_date: '2019-04-30T00:00:00.000Z',
			end_date: '2019-05-05T00:00:00.000Z',
			description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?'
		}
	];
}

function makeTripsFixtures() {
	const testUsers = makeUsersArray();
	const testTrips = makeTripsArray(testUsers);
	//const testReviews = makeReviewsArray(testUsers, testThings)
	return { testUsers, testTrips };
}

function cleanTables(db) {
	return db.raw(
		`TRUNCATE
			users,
			trips,
			trip_dest_cities,
			trip_plans
			RESTART IDENTITY CASCADE`
	);
}

function seedUsers(db, users) {
	const preppedUsers = users.map(user => ({
		...user,
		password: bcrypt.hashSync(user.password, 1)
	}));

	return db.into('users').insert(preppedUsers)
		.then(() => {
			// update the auto sequence to match the forced id values
			db.raw(
				`SELECT setval('users_id_req', ?)`,
				[users[users.length - 1].id]
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
	makeTripsFixtures,
	cleanTables,
	seedUsers,
	makeAuthHeader
};