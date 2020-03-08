const xss = require('xss');
const Treeize = require('treeize');

const PlansService = {
	getAllPlans(db) {
		return db
			.from('trip_plans AS tp')
			.select(
				'tp.id',
				'tp.plan_type',
				'tp.plan_name',
				'tp.plan_place_id',
				'tp.start_date',
				'tp.end_date',
				'tp.description',
				'tp.trip_id',
				'tp.city_name',
				'tp.utc_offset_minutes'
			)
			.innerJoin(
				'trips AS t',
				'tp.trip_id',
				't.id'
			);
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

	deletePlanById(db, plan_id) {
		return db
			.from('trip_plans')
			.delete()
			.where('id', plan_id);
	},
	
	updatePlanById(db, plan_id, updatePlan) {
		return db
			.from('trip_plans')
			.update(updatePlan)
			.where('id', plan_id)
			.then(() => {
				db.raw(`UPDATE trip_plans SET date_modified = now() AT TIME ZONE 'UTC' WHERE id = ${plan_id}`)
					.then(() => PlansService.getPlanById(db, plan_id));
			});
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
			plan_name: xss(planData.plan_name),
			plan_place_id: planData.plan_place_id,
			start_date: planData.start_date,
			end_date: planData.end_date,
			description: xss(planData.description),
			trip_id: planData.trip_id,
			city_name: planData.city_name,
			utc_offset_minutes: planData.utc_offset_minutes
		};
	}
}

module.exports = PlansService;