const express = require('express');
const path = require('path');
const TripsService = require('./trips-service');
const { requireAuth } = require('../middleware/jwt-auth');

const TripsRouter = express.Router();
const jsonBodyParser = express.json();

TripsRouter
	.route('/')
	.all(requireAuth)
	.post(jsonBodyParser, (req, res, next) => {
		const { trip_name, dest_cities, start_date, end_date, description } = req.body;
		const newTrip = { trip_name, start_date, end_date };

		for (const [key, value] of Object.entries(newTrip)) {
			if (value == null) {
				return res.status(400).json({
					error: `Missing '${key}' in request body`
				});
			}
		}

		if (!dest_cities || !Array.isArray(dest_cities) || !dest_cities.length) {
			return res.status(400).json({
				error: `Missing 'dest_cities' in request body`
			});
		}

		dest_cities.forEach((ele, idx) => {
			['city_name', 'city_place_id'].forEach((field) => {
				if (!ele[field]) {
					return res.status(400).json({
						error: `Missing '${field}' of 'dest_cities[${idx}]' in request body`
					});
				}
			})
		})
		
		newTrip.description = description;
		newTrip.user_id = req.user.id;
		
		TripsService.insertTrip(
			req.app.get('db'),
			newTrip,
			dest_cities
		)
			.then(([trip, destCities]) => {
				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${trip.user_id}/${trip.id}`))
					.json(TripsService.serializeTrip(trip, destCities));
			})
			.catch(next);
	})

TripsRouter
	.route('/:user_id')
	.all(requireAuth)
	.get((req, res) => {
		TripsService.getTripsByUser(
			req.app.get('db'),
			req.params.user_id
		)
			.then(([trips, destCities]) => {
				res.json(TripsService.serializeTrips(
					trips,
					TripsService.mapDestCities(destCities)
				));
			});
	})

TripsRouter
	.route('/:user_id/:trip_id')
	.all(requireAuth)
	.all(checkTripExists)
	.get((req, res) => {
		res.json(TripsService.serializeTrip(res.trip, res.dest_cities));
	})

async function checkTripExists(req, res, next) {
	try {
		const trip = await TripsService.getTripById(
			req.app.get('db'),
			req.params.trip_id
		);

		if (!trip) {
			return res.status(404).json({
				error: `Trip doesn't exist`
			});
		}

		const dest_cities = await TripsService.getDestCitiesByTrip(
			req.app.get('db'),
			trip.id
		);

		res.trip = trip;
		res.dest_cities = dest_cities;
		next();
	}
	catch (error) {
		next(error);
	};
}

module.exports = TripsRouter;