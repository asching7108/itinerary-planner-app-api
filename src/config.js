module.exports = {
	PORT: process.env.PORT || 8000,
	NODE_ENV: process.env.NODE_ENV || 'development',
	DATABASE_URL: process.env.DATABASE_URL || 'postgresql://esther_lin@localhost/itinerary_planner',
	TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://esther_lin@localhost/itinerary_planner_test',
	JWT_SECRET: process.env.JWT_SECRET || 'jwt-secret-esther-lin-2020',
	JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
	CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'https://vamos-itinerary-planner.now.sh'
};