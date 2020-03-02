const express = require('express');
const path = require('path');
const PlansService = require('./plans-service');
const { requireAuth } = require('../middleware/jwt-auth');

const PlansRouter = express.Router();
const jsonBodyParser = express.json();

PlansRouter
  .route('/')
  .all(requireAuth)
  .post(jsonBodyParser, (req, res, next) => {
		const { 
			plan_type, 
			plan_name, 
			start_date, 
			end_date, 
			description, 
			trip_id, 
			trip_dest_city_id 
		} = req.body;
		let newPlan = { plan_type, plan_name, start_date, trip_id, trip_dest_city_id };

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
			...newPlan
		};

		PlansService.insertPlan(
			req.app.get('db'),
			newPlan
		)
			.then(plan => {
				res
					.status(201)
					.location(`/api/trips/${plan.trip_id}/plans/${plan.id}`)
					.json(PlansService.serializePlan(plan));
			})
			.catch(next);
  })

module.exports = PlansRouter;