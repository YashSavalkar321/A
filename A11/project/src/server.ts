import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import 'dotenv/config';
import neo4j, { Driver } from 'neo4j-driver';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

let cachedDriver: Driver | null = null;

function getDriver(): Driver {
  if (cachedDriver) {
    return cachedDriver;
  }

  const uri = process.env['NEO4J_URI'] ?? 'neo4j://localhost:7687';
  const username = process.env['NEO4J_USERNAME'] ?? 'neo4j';
  const password = process.env['NEO4J_PASSWORD'];

  if (!password) {
    throw new Error('Missing NEO4J_PASSWORD in environment.');
  }

  cachedDriver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    disableLosslessIntegers: true,
  });
  return cachedDriver;
}

async function runReadQuery(
  cypher: string,
  params: Record<string, unknown>,
) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

app.post('/api/citation-depth', async (req, res) => {
  try {
    const paperA = String(req.body?.paperA ?? '').trim();
    const paperB = String(req.body?.paperB ?? '').trim();
    if (!paperA || !paperB) {
      return res.status(400).json({ error: 'paperA and paperB are required.' });
    }

    const records = await runReadQuery(
      `
      MATCH path = shortestPath((a:Paper {title: $paperA})-[:CITES*]->(b:Paper {title: $paperB}))
      RETURN toInteger(length(path)) AS depth
      `,
      { paperA, paperB },
    );

    if (!records.length) {
      return res.json({ found: false });
    }

    return res.json({ found: true, depth: records[0].get('depth') as number });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to execute citation query.' });
  }
});

app.post('/api/classification', async (req, res) => {
  try {
    const paperTitle = String(req.body?.paperTitle ?? '').trim();
    if (!paperTitle) {
      return res.status(400).json({ error: 'paperTitle is required.' });
    }

    const records = await runReadQuery(
      `
      MATCH (p:Paper {title: $paperTitle})-[:BELONGS_TO]->(c:Classification)
      RETURN c.name AS classification
      LIMIT 1
      `,
      { paperTitle },
    );

    const classification = records.length
      ? (records[0].get('classification') as string)
      : null;
    return res.json({ classification });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to execute classification query.' });
  }
});

app.post('/api/author-papers', async (req, res) => {
  try {
    const authorName = String(req.body?.authorName ?? '').trim();
    if (!authorName) {
      return res.status(400).json({ error: 'authorName is required.' });
    }

    const records = await runReadQuery(
      `
      MATCH (a:Author {name: $authorName})-[:WROTE]->(p:Paper)
      RETURN p.title AS title
      ORDER BY title
      `,
      { authorName },
    );

    return res.json({ papers: records.map((record) => record.get('title') as string) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to execute author papers query.' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
