import { handler } from './build/handler.js';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

const app = express();

// environment
dotenv.config();
const ADDON = process.env.ADDON === 'true';
const { PORT, HASS_PORT, EXPOSED_PORT } = process.env;

// dynamically set target
const entryMiddleware = async (req, res, next) => {
	// default
	let target = process.env.HASS_URL;

	if (ADDON) {
		// headers
		const {
			'x-hass-source': source,
			'x-forwarded-proto': forwardedProto,
			'x-forwarded-host': forwardedHost,
			host
		} = req.headers;

		// ingress
		if (source && forwardedProto && forwardedHost) {
			target = `${forwardedProto}://${forwardedHost}`;
		}

		// exposed port
		else if (host && EXPOSED_PORT && HASS_PORT) {
			const proto = req.secure ? 'https' : 'http';
			target = `${proto}://${host.replace(EXPOSED_PORT, HASS_PORT)}`;
		}
	}

	// target should be defined now
	if (!target) {
		res.status(502).send('Proxy target could not be determined');
		return;
	}

	// add header for +page.server.ts
	req.headers['X-Proxy-Target'] = target;
	req.target = target;
	next();
};

// CORS headers for ingress
const corsMiddleware = (_req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
};

// production proxy — handles both HTTP and WebSocket
const proxy = createProxyMiddleware({
	pathFilter: ['/local/', '/api/'],
	router: (req) => req.target,
	changeOrigin: true,
	ws: true,
	secure: false, // allow self-signed SSL certificates (common in HA)
	on: {
		error: (err, _req, res) => {
			console.error('Proxy error:', err.message);
			if (res && typeof res.status === 'function') {
				res.status(502).send('Proxy error: ' + err.message);
			}
		}
	}
});

app.use(corsMiddleware);
app.use(entryMiddleware, proxy);

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

const server = app.listen(PORT, () => {
	if (ADDON) {
		console.log('ADDON:', ADDON);
		console.log('INGRESS_PORT:', PORT);
		console.log('EXPOSED_PORT:', EXPOSED_PORT);
		console.log('HASS_PORT:', HASS_PORT);
	} else {
		console.log('HASS_URL:', process.env.HASS_URL);
		console.log('PORT:', PORT);
		console.log('ADDON:', ADDON);
	}
});

// proxy WebSocket upgrade requests (fixes HA WebSocket API behind reverse proxy)
server.on('upgrade', (req, socket, head) => {
	let target = process.env.HASS_URL;

	if (ADDON) {
		const host = req.headers.host;
		const forwardedProto = req.headers['x-forwarded-proto'];
		const forwardedHost = req.headers['x-forwarded-host'];
		const source = req.headers['x-hass-source'];

		if (source && forwardedProto && forwardedHost) {
			target = `${forwardedProto}://${forwardedHost}`;
		} else if (host && EXPOSED_PORT && HASS_PORT) {
			target = `http://${host.replace(EXPOSED_PORT, HASS_PORT)}`;
		}
	}

	if (!target) {
		socket.destroy();
		return;
	}

	req.target = target;
	proxy.upgrade(req, socket, head);
});
