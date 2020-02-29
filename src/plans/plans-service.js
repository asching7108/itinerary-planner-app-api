const xss = require('xss');
const Treeize = require('treeize');

const PlansService = {
	getAllPlans(db) {
		return db
			.from('trip_plans AS tp')
			.select(
				'tp.id',
				'tp.plan_type',
				'tp.plan_sub_type',
				'tp.plan_name',
				'tp.plan_place_id',
				'tp.start_date',
				'tp.end_date',
				'tp.description',
				'tp.trip_id',
				'tp.trip_dest_city_id',
				'dc.city_name'
			)
			.innerJoin(
				'trips AS t',
				'tp.trip_id',
				't.id'
			)
			.innerJoin(
				'trip_dest_cities AS dc',
				'tp.trip_dest_city_id',
				'dc.id'
			)
	},

	getPlansForTrip(db, trip_id) {
		return this.getAllPlans(db)
			.where('tp.trip_id', trip_id);
	},

	getPlanById(db, plan_id) {
		return this.getAllPlans(db)
			.where('tp.id', plan_id)
			.first();
	},

	insertPlan(db, newPlan) {
		return db
			.into('trip_plans')
			.insert(newPlan)
			.returning('*')
			.then(([plan]) => plan)
			.then(plan =>
				this.getPlanById(db, plan.id)
			);
	},
	
	serializePlans(plans) {
		return plans.map(this.serializePlan);
	},

	serializePlan(plan) {
		const planTree = new Treeize();
		const planData = planTree.grow([ plan ]).getData()[0];

		return {
			id: planData.id,
			plan_type: planData.plan_type,
			plan_sub_type: planData.plan_sub_type,
			plan_name: xss(planData.plan_name),
			plan_place_id: planData.plan_place_id,
			start_date: planData.start_date,
			end_date: planData.end_date,
			description: xss(planData.description),
			trip_id: planData.trip_id,
			trip_dest_city_id: planData.trip_dest_city_id,
			city_name: planData.city_name
		};
	}
}

module.exports = PlansService;