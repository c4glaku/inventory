<h1>Inventory Manager</h1>
<h3>A full-stack inventory management system built with a Node/Express backend, PostgreSQL database, and a React frontend. Features include CRUD operations for products and suppliers, and user authentication using JWT tokens.</h3>

<h2><b>Tech Stack:</b></h2>
<ul><b>Backend: </b> Node.js, Express, PostgreSQL</ul>
<ul><b>Frontend: JWT</b> React, Axios, React Router  </ul>
<ul><b>Authentication: </b> JWT</ul>

<h2>Project Status</h2>
<h3>Added final touches to the development build, now also supports import/export with JSON and csv files.</h3>
<h3>To add: JWT authentication</h3>
<h4>Last Updated: 2025/02/19</h4>



<h2>Setup Instrucitons</h2>

<h2>Step 0</h2>
<h2>Before setting up the inventory manager, make sure to download:</h2>
<ul><b>PostgreSQL: </b>https://www.postgresql.org/download/</ul>
<ul><b>Optional but Recommended) Postman (or an equivalent software for testing purposes): </b>https://www.postman.com/downloads/</ul>

<h2>Step 1</h2>
From the backend directory, run

```console
npm install
```
Once all modules are installed, run
```console
node server
```
At this point, server should be running on port 3000 (or, any other port if you have configured .env)
<h2>Step 2</h2>
At this point, the backend should be up and running. However, database connection is not set up yet. In order to set up a database, simply run psql

```console
Server [localhost]:
Database [postgres]: inventory_db
Port [5432]:
Username [postgres]:
Password for user postgres:
```

Leave Server empty to default to localhost, and similarly leave the fields for Port and Username empty for them to default as well, unless you have a specific set up on your end.
Enter <b>your password</b> which you should have set up during PostgreSQL installation for the superuser.
Then you will be met with the psql console, simply run the below commands:
```
postgres=# \c inventory_db
inventory_db=# \i C:/Users/YourUsername/Path/To/Your/backend/src/db/schema.sql
```
At this point, the database should be ready for you to use methods on.
Currently, the manager only supports GET, POST, and PUT methods, you may test them on Postman.
Endpoints are localhost:3000/api/products and localhost:3000/api/suppliers respectively.

<h2>Step 3: Setting up the Frontend Client</h2>
From the frontend directory, run
```console
npm install
```

<h2>Step 4</h2>
Once all installs are done, run
```console
npm start
```
This starts the development build. Currently the app is still in development, but stay tuned for a full release!


