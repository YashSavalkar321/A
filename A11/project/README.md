# Cora Graph App (Angular + Neo4j)

This project is a complete Angular SSR app with a redesigned UI and a secure Neo4j backend API.

## What changed

- Complete UI redesign in the Angular app.
- Neo4j access moved from browser code to server-side Express API endpoints.
- Credentials now come from environment variables (`.env`) instead of hardcoded values.
- Missing Angular project setup files were added so the app can be installed and run.

## Tech stack

- Angular 20 (SSR)
- Express (inside Angular SSR server)
- Neo4j Driver

## Folder overview

- `src/app/app.html` and `src/app/app.css`: full new UI
- `src/app/app.ts`: query handlers and loading states
- `src/app/neo4j.service.ts`: frontend API client
- `src/server.ts`: Neo4j-backed API endpoints
- `.env.example`: sample Neo4j config

## Prerequisites

1. Node.js 20+ (LTS recommended)
2. npm 10+
3. Neo4j Desktop or Neo4j server running locally

## 1) Setup Neo4j database

1. Start Neo4j and note your Bolt URI (default: `neo4j://localhost:7687`).
2. Open Neo4j Browser.
3. Create sample data (or load your assignment dataset). Example seed:

```cypher
MERGE (c1:Classification {name: 'Neural Networks'})
MERGE (c2:Classification {name: 'Reinforcement Learning'})
MERGE (a1:Author {name: 'Author 1'})
MERGE (a2:Author {name: 'Author 2'})
MERGE (p1:Paper {title: 'Research Paper 31336'})
MERGE (p2:Paper {title: 'Research Paper 35'})
MERGE (p3:Paper {title: 'Research Paper 120'})
MERGE (p1)-[:BELONGS_TO]->(c1)
MERGE (p2)-[:BELONGS_TO]->(c2)
MERGE (a1)-[:WROTE]->(p1)
MERGE (a1)-[:WROTE]->(p3)
MERGE (a2)-[:WROTE]->(p2)
MERGE (p1)-[:CITES]->(p3)
MERGE (p3)-[:CITES]->(p2);
```

## 2) Configure environment variables

1. In project root, create `.env` from `.env.example`.
2. Fill correct Neo4j credentials.

Windows CMD:

```bat
copy .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `.env`:

```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
```

## 3) Install dependencies

```bash
npm install
```

## 4) Run application

Development mode:

```bash
npm start
```

This starts the Angular app on `http://localhost:4200` and the Express API on `http://localhost:4000`, with `/api` requests proxied automatically during development.

Open:

- http://localhost:4200

## 5) Build application

```bash
npm run build
```

Build output is generated under `dist/cora-app`.

## API endpoints used by frontend

- `POST /api/citation-depth`
- `POST /api/classification`
- `POST /api/author-papers`

All Neo4j queries run on the server side in `src/server.ts`.

## Troubleshooting

1. `Missing NEO4J_PASSWORD in environment`:
   - Ensure `.env` exists in project root.
   - Ensure `NEO4J_PASSWORD` is set.
2. Neo4j connection errors:
   - Check Neo4j server is running.
   - Verify URI, username, password.
3. Empty query results:
   - Confirm your graph has `Paper`, `Author`, `Classification`, `CITES`, `WROTE`, and `BELONGS_TO` data.
