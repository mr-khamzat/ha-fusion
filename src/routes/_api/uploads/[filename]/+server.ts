import { readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import path from 'path';
import type { RequestHandler } from './$types';

const CONTENT_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.gif': 'image/gif',
	'.webp': 'image/webp'
};

export const GET: RequestHandler = async ({ params }) => {
	const filename = params.filename;

	// security: no path traversal
	if (!filename || filename.includes('..') || filename.includes('/')) {
		return error(400, 'Invalid filename');
	}

	const ext = path.extname(filename).toLowerCase();
	const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

	try {
		const data = await readFile(`./data/uploads/${filename}`);
		return new Response(data, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400'
			}
		});
	} catch {
		return error(404, 'File not found');
	}
};
