# Vamos - Itinerary Planner Server

Vamos is a full stack web application for managing travel itineraries. Users can create travel plans easily with autocomplete search for places and automatically fetched google places data.

This is the server-side code for the application with Express and PostgreSQL.

## Client

- [Client Repo](https://github.com/asching7108/itinerary-planner-app/)

## Set Up

- Clone this repository to your local machine: `git clone REPO-URL NEW-PROJECTS-NAME`
- cd into the cloned repository
- Make a fresh start of the git history for this project: `rm -rf .git && git init`
- Install dependencies: `npm install`
- Create development and test databases: `createdb vamos`, `createdb vamos_test`
- Create database user: `createuser vamos`
- Grant privileges to new user in `psql`:
  - `GRANT ALL PRIVILEGES ON DATABASE vamos TO vamos`
  - `GRANT ALL PRIVILEGES ON DATABASE "vamos-test" TO vamos`
- Prepare environment file: `cp example.env .env`
- Replace values in `.env` with your custom values
- Replace default values in `src/config.js` with your custom values
- Bootstrap development database: `npm run migrate`
- Bootstrap test database: `npm run migrate:test`

### Configuring Postgres

For tests involving time to run properly, your Postgres database must be configured to run in the UTC timezone.

1. Locate the `postgresql.conf` file for your Postgres installation.
    - OS X, Homebrew: `/usr/local/var/postgres/postgresql.conf`
2. Uncomment the `timezone` line and set it to `UTC` as follows:

```
# - Locale and Formatting -

datestyle = 'iso, mdy'
#intervalstyle = 'postgres'
timezone = 'UTC'
#timezone_abbreviations = 'Default'     # Select the set of available time zone
```

## Sample Data

- To seed the database for development: `psql -U vamos -d vamos -a -f seeds/seed.trip_tables.sql`
- To clear seed data: `psql -U vamos -d vamos -a -f seeds/trunc.trip_tables.sql`

## Scripts

- Start application `npm start`
- Start application for development: `npm run dev`
- Run tests: `npm test`

## Deploy

When ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.

## Technologies

* Express
* Node.js
* PostgreSQL
* JavaScript
* Chai & Mocha