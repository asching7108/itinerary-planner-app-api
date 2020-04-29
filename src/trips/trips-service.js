const xss = require('xss');
const Treeize = require('treeize');
const moment = require('moment');

const TripsService = {
	getAllTrips(db) {
		return db
			.from('trips AS t')
			.select(
				't.id',
				't.trip_name',
				't.start_date',
				't.end_date',
				't.description',
				't.user_id'
			)
			.innerJoin(
				'users AS u',
				't.user_id',
				'u.id'
			)
			.orderBy(['t.start_date', 't.end_date']);
	},

	getTripById(db, trip_id) {
		return this.getAllTrips(db)
			.where('t.id', trip_id)
			.first();
	},

	getAllDestCities(db) {
		return db
			.from('trips AS t')
			.select(
				'dc.id',
				'dc.city_name',
				'dc.city_place_id',
				'dc.utc_offset_minutes',
				'dc.ne_lat',
				'dc.ne_lng',
				'dc.sw_lat',
				'dc.sw_lng',
				't.id AS trip_id'
			)
			.innerJoin(
				'users AS u',
				't.user_id',
				'u.id'
			)
			.innerJoin(
				'trip_dest_cities as dc',
				't.id',
				'dc.trip_id'
			);
	},

	getDestCitiesByTrip(db, trip_id) {
		return this.getAllDestCities(db)
			.where('t.id', trip_id);
	},

	getTripsByUser(db, user_id) {
		const resTrips = this.getAllTrips(db)
			.where('u.id', user_id);

		const resDestCities = this.getAllDestCities(db)
			.where('u.id', user_id);

		return Promise.all([resTrips, resDestCities]);
	},

	async insertTrip(db, newTrip, destCities) {
		const resTrip = db
			.into('trips')
			.insert(newTrip)
			.returning('*')
			.then(([trip]) => trip);
		
		const resDestCities = await resTrip
			.then(trip => {
				const newDestCities = destCities.map(dc => {
					dc = {
						trip_id: trip.id,
						...dc.viewport,
						...dc
					};
					delete dc.viewport;
					return dc;
				});

				return this.insertDestCities(db, newDestCities);
			});

		return Promise.all([resTrip, resDestCities]);
	},

	async deleteTripById(db, trip_id) {
		const resDestCities = db
			.from('trip_dest_cities')
			.delete()
			.where('trip_id', trip_id);

		const resTrip = await resDestCities
			.then(() => 
				db
					.from('trips')
					.delete()
					.where('id', trip_id)
			);

		return Promise.all([resTrip, resDestCities]);
	},

	insertDestCities(db, newDestCities) {
		return db
		.into('trip_dest_cities')
		.insert(newDestCities)
		.returning('*')
		.then(destCities => destCities);
	},

	deleteDestCitiesByTrip(db, trip_id) {
		return db
			.from('trip_dest_cities')
			.delete()
			.where('trip_id', trip_id);
	},

	updateTripById(db, trip_id, updateTrip) {
		const { dest_cities } = updateTrip;

		let resDestCities;
		if (dest_cities) {
			delete updateTrip['dest_cities'];
			resDestCities = this.deleteDestCitiesByTrip(db, trip_id)
				.then(() => {
					const destCities = dest_cities.map(dc => {
						dc = {
							...dc,
							trip_id,
							...dc.viewport
						};
						delete dc.viewport;
						return dc;
					})
					
					return this.insertDestCities(db, destCities);
				});
		}

		const resTrip = db
			.from('trips')
			.update(updateTrip)
			.where('id', trip_id)
			.then(() => 
				db.raw(`UPDATE trips SET date_modified = now() AT TIME ZONE 'UTC' WHERE id = ${trip_id}`)
					.then(() => this.getTripById(db, trip_id))
			);

		return Promise.all([resTrip, resDestCities]);
	},

	mapDestCities(destCities) {
		const destCitiesMap = new Map();

		destCities.map(dc => {
			if (destCitiesMap.has(dc.trip_id)) {
				const dcArr = destCitiesMap.get(dc.trip_id);
				dcArr[dcArr.length] = dc;
				destCitiesMap.set(dc.trip_id, dcArr);
			}
			else {
				destCitiesMap.set(dc.trip_id, [dc]);
			}
		});
		
		return destCitiesMap;
	},

	serializeTrips(trips, destCitiesMap) {
		const allTrips = trips.map(trip => {
			const destCities = destCitiesMap.get(trip.id);
			return this.serializeTrip(trip, destCities);
		});
		
		const upcomingTrips = allTrips.filter(trip => 
			moment(trip.end_date).diff(moment().startOf('day')) >= 0
		);
		const pastTrips = allTrips.filter(trip => 
			moment(trip.end_date).diff(moment().startOf('day')) < 0
		);
		return { upcomingTrips, pastTrips: pastTrips.reverse() };
	},

	serializeTrip(trip, destCities) {		
		const tripTree = new Treeize();
		const destCitiesTree = new Treeize();

		const tripData = tripTree.grow([ trip ]).getData()[0];
		const destCitiesData = destCitiesTree.grow(destCities).getData();
		
		const dest_cities = destCitiesData.map(dc => {
			const viewport = {};
			['ne_lat', 'ne_lng', 'sw_lat', 'sw_lng'].forEach(ele => {
				if (dc[ele]) { viewport[ele] = Number(dc[ele]) };
				delete dc[ele];
			})
			return { ...dc, viewport };
		});
		
		return {
			id: tripData.id,
			trip_name: xss(tripData.trip_name),
			start_date: tripData.start_date,
			end_date: tripData.end_date,
			description: xss(tripData.description),
			user_id: tripData.user_id,
			dest_cities
		};
	}
}

module.exports = TripsService;