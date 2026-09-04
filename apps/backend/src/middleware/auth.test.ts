import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { exportJWK, generateKeyPair, SignJWT, type JWK, type KeyObject } from 'jose';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Levanta un Supabase de mentira: lo único que el middleware le pide es el JWKS,
 * así podemos firmar tokens con nuestra propia clave y comprobar qué acepta y
 * qué rechaza sin depender de la red ni de una sesión real.
 */

let server: Server;
let issuer: string;
let privateKey: KeyObject;
let otherPrivateKey: KeyObject;
let requireUser: RequestHandler;

const USER_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

before(async () => {
  const pair = await generateKeyPair('ES256');
  privateKey = pair.privateKey as KeyObject;
  const publicJwk: JWK = await exportJWK(pair.publicKey);
  publicJwk.kid = 'test-key';
  publicJwk.alg = 'ES256';
  publicJwk.use = 'sig';

  // Un segundo par para probar el caso "token bien formado, firma ajena".
  const otherPair = await generateKeyPair('ES256');
  otherPrivateKey = otherPair.privateKey as KeyObject;

  server = createServer((req, res) => {
    if (req.url === '/auth/v1/.well-known/jwks.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ keys: [publicJwk] }));
      return;
    }
    res.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (typeof address === 'string' || address === null) throw new Error('sin puerto');

  const baseUrl = `http://127.0.0.1:${address.port}`;
  issuer = `${baseUrl}/auth/v1`;

  // El middleware lee SUPABASE_URL al importarse, así que se setea antes.
  process.env.SUPABASE_URL = baseUrl;
  delete process.env.DEV_AUTH_USER_ID;
  ({ requireUser } = await import('./auth'));
});

after(() => {
  server.close();
});

interface Outcome {
  status?: number;
  body?: { error?: string };
  passed: boolean;
}

/** Corre el middleware y espera a que resuelva, sea por next() o por una respuesta. */
function run(authorization?: string): Promise<Outcome> {
  return new Promise((resolve, reject) => {
    let status: number | undefined;

    const req = {
      header: (name: string) =>
        name.toLowerCase() === 'authorization' ? authorization : undefined,
    } as unknown as Request;

    const res = {
      status: (code: number) => {
        status = code;
        return res;
      },
      json: (body: { error?: string }) => {
        resolve({ status, body, passed: false });
        return res;
      },
    } as unknown as Response;

    const next: NextFunction = (err?: unknown) => {
      if (err) return reject(err);
      resolve({ passed: true });
    };

    requireUser(req, res, next);
  });
}

async function mint(claims: {
  sub?: string;
  aud?: string;
  iss?: string;
  email?: string;
  expiresIn?: string;
  key?: KeyObject;
}) {
  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
    .setSubject(claims.sub ?? USER_ID)
    .setAudience(claims.aud ?? 'authenticated')
    .setIssuer(claims.iss ?? issuer)
    .setIssuedAt()
    .setExpirationTime(claims.expiresIn ?? '1h')
    .sign(claims.key ?? privateKey);
}

describe('requireUser', () => {
  it('acepta un token válido y expone el usuario del claim sub', async () => {
    const token = await mint({ email: 'edu@morfisano.app' });

    const req = {
      header: () => `Bearer ${token}`,
    } as unknown as Request;
    const res = {
      status() {
        return this;
      },
      json(body: unknown) {
        throw new Error(`no debería responder: ${JSON.stringify(body)}`);
      },
    } as unknown as Response;

    await new Promise<void>((resolve, reject) => {
      requireUser(req, res, ((err?: unknown) => (err ? reject(err) : resolve())) as NextFunction);
    });

    assert.equal(req.userId, USER_ID);
    assert.equal(req.userEmail, 'edu@morfisano.app');
  });

  it('rechaza si no viene el header Authorization', async () => {
    const out = await run(undefined);
    assert.equal(out.passed, false);
    assert.equal(out.status, 401);
  });

  it('rechaza un esquema que no sea Bearer', async () => {
    const out = await run('Basic dXNlcjpwYXNz');
    assert.equal(out.status, 401);
  });

  it('rechaza un token que no es un JWT', async () => {
    const out = await run('Bearer cualquier-cosa');
    assert.equal(out.status, 401);
    assert.equal(out.body?.error, 'Token inválido');
  });

  it('rechaza un token firmado con otra clave', async () => {
    const token = await mint({ key: otherPrivateKey });
    const out = await run(`Bearer ${token}`);
    assert.equal(out.status, 401);
  });

  it('rechaza un token de otro emisor', async () => {
    const token = await mint({ iss: 'https://otro-proyecto.supabase.co/auth/v1' });
    const out = await run(`Bearer ${token}`);
    assert.equal(out.status, 401);
  });

  it('rechaza un token con otra audiencia', async () => {
    const token = await mint({ aud: 'anon' });
    const out = await run(`Bearer ${token}`);
    assert.equal(out.status, 401);
  });

  it('avisa distinto cuando el token venció', async () => {
    const token = await mint({ expiresIn: '-1h' });
    const out = await run(`Bearer ${token}`);
    assert.equal(out.status, 401);
    assert.match(out.body?.error ?? '', /venció/);
  });
});
