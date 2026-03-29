import { writeFile, mkdir } from 'fs/promises';
import { json } from '@sveltejs/kit';
import path from 'path';
import type { RequestHandler } from './$types';

const ALLOWED_TYPES = new Set([
	'image/png',
	'image/jpeg',
	'image/svg+xml',
	'image/gif',
	'image/webp'
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file || !file.name) return json({ error: 'No file provided' }, { status: 400 });
	if (!ALLOWED_TYPES.has(file.type)) return json({ error: 'Allowed: PNG, JPG, SVG, GIF, WEBP' }, { status: 400 });
	if (file.size > MAX_SIZE) return json({ error: 'File too large (max 10 MB)' }, { status: 400 });

	try {
		const ext = path.extname(file.name).toLowerCase();
		const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-.]/g, '_');
		const filename = `${Date.now()}_${base}${ext}`;

		await mkdir('./data/uploads', { recursive: true });
		const buffer = Buffer.from(await file.arrayBuffer());
		await writeFile(`./data/uploads/${filename}`, buffer);

		return json({ url: `/_api/uploads/${filename}`, filename });
	} catch (err: any) {
		return json({ error: err.message || 'Upload failed' }, { status: 500 });
	}
};
