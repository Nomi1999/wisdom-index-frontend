import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const rawBaseUrl =
  process.env.INTERNAL_API_URL ||
  process.env.BACKEND_PROXY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5001';

const target = new URL(rawBaseUrl);

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
  },
};

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

export default function proxyHandler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.url) {
    res.status(500).json({ error: 'Proxy request missing URL.' });
    return;
  }

  const pathParam = req.query.path;
  const pathSegments = Array.isArray(pathParam)
    ? pathParam
    : pathParam
    ? [pathParam]
    : [];
  const extraPath = pathSegments.length ? `/${pathSegments.join('/')}` : '';
  const queryIndex = req.url.indexOf('?');
  const query = queryIndex >= 0 ? req.url.substring(queryIndex) : '';

  const upstreamPath = `${trimTrailingSlash(target.pathname)}${extraPath}${query}` || '/';

  const headers = { ...req.headers, host: target.host, origin: target.origin };
  delete (headers as Record<string, unknown>)['content-length']; // recalculated automatically

  const requestOptions: http.RequestOptions = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    method: req.method,
    path: upstreamPath,
    headers,
  };

  const proxyRequest = (target.protocol === 'https:' ? https : http).request(
    requestOptions,
    (proxyResponse) => {
      if (!res.headersSent) {
        res.writeHead(proxyResponse.statusCode ?? 500, proxyResponse.headers as http.OutgoingHttpHeaders);
      }
      proxyResponse.pipe(res, { end: true });
    }
  );

  proxyRequest.setTimeout(180_000, () => {
    proxyRequest.destroy(new Error('Proxy timeout'));
  });

  proxyRequest.on('error', (error) => {
    if (!res.headersSent) {
      res
        .status(502)
        .json({ error: 'Proxy error', message: error.message, target: target.origin });
    } else {
      res.end();
    }
  });

  req.on('aborted', () => {
    proxyRequest.destroy();
  });

  req.pipe(proxyRequest, { end: true });
}
