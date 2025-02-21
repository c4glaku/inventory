<h1>Inventory Manager</h1>
<h3>A full-stack inventory management system built with a Node/Express backend, PostgreSQL database, and a React frontend. Features include CRUD operations for products and suppliers, user authentication using JWT tokens, and import/export functionality (JSON & CSV).</h3>

<h2><b>Tech Stack:</b></h2>
<ul><b>Backend: </b> Node.js, Express, PostgreSQL</ul>
<ul><b>Frontend: </b> React, Axios, React Router</ul>
<ul><b>Authentication: </b> JWT</ul>

<h2>Project Status</h2>
<h3>Added final touches to the development build, now also supports import/export with JSON and CSV files.</h3>
<h3>JWT authentication has been implemented.</h3>
<h3>An installer has been added to set up the database and launch the project on first run.</h3>
<h4>Last Updated: 2025/02/20</h4>

<h2>Setup Instructions</h2>

<h2>Step 0</h2>
<h2>Before setting up the inventory manager, make sure to download:</h2>
<ul><b>PostgreSQL: </b>https://www.postgresql.org/download/</ul>
<ul><b>(Optional but Recommended) Postman (or an equivalent software for testing purposes): </b>https://www.postman.com/downloads/</ul>
<ul><b>Node.js: </b>https://nodejs.org/</ul>

<h2>Step 1: Running the Installer (First-Time Setup)</h2>
<h3>The installer sets up the database and prompts for:</h3>
<ul>
<li>PostgreSQL superuser password</li>
<li>A JWT secret key</li>
<li>Admin username and password for JWT authentication</li>
</ul>
<h3>Run the installer executable:</h3>

```console
inventory-installer.exe
```

<h3>Note:</h3>
<ul>
<li>The installer should only be run once. If you need to rerun it, you must manually drop the database first.</li>
<li>After installation, the project will launch automatically. However, there is no integrated launcher yet, so for subsequent launches, you must start the backend and frontend manually.</li>
</ul>

<h2>Step 2: Running the Application Manually (Post-Installation)</h2>
<h3>Starting the Backend</h3>
From the backend directory, run:

```console
npm install
```
Once all modules are installed, start the backend:

```console
npm start
```
At this point, the server should be running on port 3000 (or a different port if configured in .env).

<h3>Starting the Frontend</h3>
From the frontend directory, run:

```console
npm install
```

Once all installs are done, start the frontend:

```console
npm start
```

The frontend will run on `http://localhost:3001` (or another configured port).

<h2>Step 3: Setting Up the Database Manually (If Needed)</h2>
If you need to manually set up the database, run psql:

```console
Server [localhost]:
Database [postgres]: inventory_db
Port [5432]:
Username [postgres]:
Password for user postgres:
```

Leave the Server, Port, and Username fields empty unless you have a custom setup. Enter your **PostgreSQL superuser password** (set during PostgreSQL installation). Once inside psql, run:

```console
postgres=# \c inventory_db
inventory_db=# \i C:/Users/YourUsername/Path/To/Your/backend/src/db/schema.sql
```

At this point, the database should be ready for use.

<h2>Step 4: API Testing</h2>
The manager currently supports **GET, POST, and PUT** methods. You can test them on Postman.

<h3>API Endpoints:</h3>
<ul>
<li>Products: `http://localhost:3000/api/products`</li>
<li>Suppliers: `http://localhost:3000/api/suppliers`</li>
</ul>

<h2>Step 5: (Optional) Repackaging the Installer</h2>
If you need to repackage the `.exe` installer, navigate to the `installer` directory, install dependencies, and run:

```console
npm install
pkg index.js --target node18-win-x64 --output ../inventory-installer.exe
```

<h2>Final Notes</h2>
- The installer **should only be run once** unless the database is manually dropped.
- Currently, there is **no integrated launcher**, so you must start the backend and frontend manually each time.
- Import/export functionality is available for JSON and CSV formats.

This application is still under development, but stay tuned for a full release!

