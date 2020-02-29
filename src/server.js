const knex = require('knex');
const app = require('./App');
const { PORT, DB_URL } = require('./config');

const db = knex({
	client: 'pg',
	connection: DB_URL,
	pool: {
		afterCreate: function(connection, callback) {
			connection.query(`SET TIME ZONE 'PST8PDT'`, function(err) {
				callback(err, connection);
			});
		}
	}
});

app.set('db', db);

app.listen(PORT, () => {
	console.log(`Server listening at http://localhost:${PORT}`);
});