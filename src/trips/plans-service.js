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
				'tp.utc_offset_minutes',
				'pd.id AS plan_detail_id',
				'pd.plan_subtype',
				'pd.from_name',
				'pd.from_place_id',
				'pd.from_utc_offset_minutes',
				'pd.to_name',
				'pd.to_place_id',
				'pd.to_utc_offset_minutes'
			)
			.innerJoin(
				'trips AS t',
				'tp.trip_id',
				't.id'
			)
			.leftJoin(
				'plan_details AS pd',
				'tp.id',
				'pd.plan_id'
			)
			.orderBy(['tp.start_date', 'tp.end_date']);
	},

	getPlansForTrip(db, trip_id) {
		return this.getAllPlans(db)
			.where('tp.trip_id', trip_id);
	},

	getPlanById(db, plan_id) {
		return this.getAllPlans(db)
			.where('tp.id', plan_id);
	},

	async insertPlan(db, newPlan, planDetails) {
		const resPlan = db
			.into('trip_plans')
			.insert(newPlan)
			.returning('*')
			.then(([plan]) => plan);
	
		const resPlanDetails = await resPlan
			.then(plan => {
				let newPlanDetails = [];
				if (planDetails && planDetails.length) {
					newPlanDetails = planDetails.map(pd => {
						pd.plan_id = plan.id;
						return pd;
					});
				}

				return this.insertPlanDetails(db, newPlanDetails);
			});

		return Promise.all([resPlan, resPlanDetails]);
	},

	async deletePlanById(db, plan_id) {
		const resPlanDetails = db
			.from('plan_details')
			.delete()
			.where('plan_id', plan_id);

		const resPlan = await resPlanDetails
			.then(() => 
				db
					.from('trip_plans')
					.delete()
					.where('id', plan_id)
			);

		return Promise.all([resPlan, resPlanDetails]);
	},

	insertPlanDetails(db, newPlanDetails) {
		return db
		.into('plan_details')
		.insert(newPlanDetails)
		.returning('*')
		.then(planDetails => planDetails);
	},

	deletePlanDetailsByPlan(db, plan_id) {
		return db
			.from('plan_details')
			.delete()
			.where('plan_id', plan_id);
	},
	
	async updatePlanById(db, plan_id, updatePlan) {
		const { plan_details } = updatePlan;

		const resPlanDetails = this.deletePlanDetailsByPlan(db, plan_id)
			.then(res => {
				if (plan_details) {
					delete updatePlan['plan_details'];
					plan_details.map(pd => {
						pd.plan_id = plan_id;
						return pd;
					})
					return this.insertPlanDetails(db, plan_details);
				}
				return res;
			});

		const resPlans = await resPlanDetails
			.then(() => 
				db
					.from('trip_plans')
					.update(updatePlan)
					.where('id', plan_id)
					.then(() => 
						db.raw(`UPDATE trip_plans SET date_modified = now() AT TIME ZONE 'UTC' WHERE id = ${plan_id}`)
							.then(() => this.getPlanById(db, plan_id))
					)
			);

		return Promise.all([resPlans, resPlanDetails]);
	},
	
	serializePlans(plans) {
		const planList = plans.map(this.serializePlan);
		planList.sort(function(a, b) {
			return new Date(a.comparable_date) - new Date(b.comparable_date);
		});
		return planList;
	},

	serializePlan(plan) {
		const planTree = new Treeize();
		const planData = planTree.grow([ plan ]).getData()[0];
		const comparable_date = (
			planData.plan_subtype === 'Check out' || 
			planData.plan_subtype === 'Drop off'
		)
			? planData.end_date
			: planData.start_date;

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
			utc_offset_minutes: planData.utc_offset_minutes,
			plan_detail_id: planData.plan_detail_id,
			plan_subtype: planData.plan_subtype,
			from_name: planData.from_name,
			from_place_id: planData.from_place_id,
			from_utc_offset_minutes: planData.from_utc_offset_minutes,
			to_name: planData.to_name,
			to_place_id: planData.to_place_id,
			to_utc_offset_minutes: planData.to_utc_offset_minutes,
			comparable_date
		};
	}
}

module.exports = PlansService;