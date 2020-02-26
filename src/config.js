module.exports = {
	PORT: process.env.PORT || 8000,
	NODE_ENV: process.env.NODE_ENV || 'development',
	DB_URL: process.env.DB_URL || 'postgresql://esther_lin@localhost/itinerary_planner',
	JWT_SECRET: process.env.JWT_SECRET || 'jwt-secret-esther-lin-2020',
	JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
	CLIENT_ORIGIN: 'https://itinerary-planner-app.asching7108.now.sh'
};