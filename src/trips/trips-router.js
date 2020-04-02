const express = require('express');
const path = require('path');
const TripsService = require('./trips-service');
const PlansService = require('./plans-service');
const { requireAuth } = require('../middleware/jwt-auth');

const TripsRouter = express.Router();
const jsonBodyParser = express.json();

TripsRouter
	.route('/')
	.all(requireAuth)

	.get((req, res, next) => {
		TripsService.getTripsByUser(
			req.app.get('db'),
			req.user.id
		)
			.then(([trips, destCities]) => {
				res.json(TripsService.serializeTrips(
					trips,
					TripsService.mapDestCities(destCities)
				));
			})
			.catch(next);
	})

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

		for (const destCity of dest_cities) {
			for (const field of ['city_name', 'city_place_id', 'utc_offset_minutes']) {
				if (!destCity[field]) {
					return res.status(400).json({
						error: `Missing '${field}' in request body`
					});
				}
			}
		}
		
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
					.location(path.posix.join(req.originalUrl, `/${trip.id}`))
					.json(TripsService.serializeTrip(trip, destCities));
			})
			.catch(next);
	})

TripsRouter
	.route('/:trip_id')
	.all(requireAuth)
	.all(checkTripExists)

	.get((req, res) => {
		res.json(TripsService.serializeTrip(res.trip, res.dest_cities));
	})

	.delete((req, res, next) => {
		TripsService.deleteTripById(
			req.app.get('db'),
			req.params.trip_id
		)
			.then(() => {
				res.status(204).end();
			})
			.catch(next);
	})

	.patch(jsonBodyParser, (req, res, next) => {
		const { trip_name, dest_cities, start_date, end_date, description } = req.body;
		const tripToUpdate = { trip_name, dest_cities, start_date, end_date, description };

		const numOfValues = Object.values(tripToUpdate).filter(Boolean).length;
		if (!numOfValues) {
			return res.status(400).json({
				error: `Request body must contain at least one field to update`
			})
		}

		TripsService.updateTripById(
			req.app.get('db'),
			req.params.trip_id,
			tripToUpdate
		)
			.then(([trip, destCities]) => {
				res.json(TripsService.serializeTrip(trip, destCities));
			})
			.catch(next);
	})

TripsRouter
	.route('/:trip_id/plans')
	.all(requireAuth)
	.all(checkTripExists)

	.get((req, res, next) => {
		PlansService.getPlansForTrip(
			req.app.get('db'),
			req.params.trip_id
		)
		.then(plans => {
			res.json(PlansService.serializePlans(plans));
		})
		.catch(next);
	})

  .post(jsonBodyParser, (req, res, next) => {
		const {
			plan_type, 
			plan_name, 
			start_date, 
			end_date, 
			description,  
			plan_place_id, 
      city_name,
			utc_offset_minutes,
			plan_details
		} = req.body;
		let newPlan = { 
			plan_type, 
			plan_name, 
			start_date, 
			city_name, 
			utc_offset_minutes
		};

		for (const [key, value] of Object.entries(newPlan)) {
			if (value == null) {
				return res.status(400).json({
					error: `Missing '${key}' in request body`
				});
			}
		}

		newPlan = {
			end_date,
			description,
			plan_place_id,
			trip_id: req.params.trip_id,
			...newPlan
		};

		PlansService.insertPlan(
			req.app.get('db'),
			newPlan,
			plan_details
		)
			.then(([plan, planDetails, trip]) => {
				PlansService.getPlanById(
					req.app.get('db'),
					plan.id
				)
					.then(plans => {
						res
						.status(201)
						.location(`/api/trips/${plan.trip_id}/plans/${plan.id}`)
						.json(PlansService.serializePlans(plans));
					});
			})
			.catch(next);
  })

TripsRouter
	.route('/:trip_id/plans/:plan_id')
	.all(requireAuth)
	.all(checkTripExists)
	.all(checkPlanExists)

	.get((req, res, next) => {
		PlansService.getPlanById(
			req.app.get('db'),
			req.params.plan_id
		)
		.then(plans => {
			res.json(PlansService.serializePlans(plans));
		})
		.catch(next);
	})

	.delete((req, res, next) => {
		PlansService.deletePlanById(
			req.app.get('db'),
			req.params.plan_id
		)
			.then(() => {
				res.status(204).end();
			})
			.catch(next);
	})

	.patch(jsonBodyParser, (req, res, next) => {
		const { 
			plan_type, 
			plan_name, 
			plan_place_id, 
			start_date, 
			end_date, 
			description, 
			city_name,
			utc_offset_minutes,
			plan_details
		} = req.body;
		const planToUpdate = { 
			plan_type, 
			plan_name, 
			plan_place_id, 
			start_date, 
			end_date, 
			description, 
			city_name,
			utc_offset_minutes,
			plan_details
		 };

		const numOfValues = Object.values(planToUpdate).filter(Boolean).length;
		if (!numOfValues) {
			return res.status(400).json({
				error: `Request body must contain at least one field to update`
			})
		}

		PlansService.updatePlanById(
			req.app.get('db'),
			req.params.plan_id,
			planToUpdate
		)
			.then(([plans, planDetails, trip]) => {
				res.json(PlansService.serializePlans(plans));
			})
			.catch(next);
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

async function checkPlanExists(req, res, next) {
	try {
		const plans = await PlansService.getPlanById(
			req.app.get('db'),
			req.params.plan_id
		);
		
		if (!plans.length) {
			return res.status(404).json({
				error: `Plan doesn't exist`
			});
		}

		res.plans = plans;
		next();
	}
	catch (error) {
		next(error);
	};
}

module.exports = TripsRouter;