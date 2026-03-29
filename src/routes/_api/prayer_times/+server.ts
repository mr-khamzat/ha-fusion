import { json, error } from '@sveltejs/kit';

// Server-side cache: citySlug → { times, expires }
const CACHE = new Map<string, { times: Record<string, string>; expires: number }>();
const TTL = 4 * 60 * 60 * 1000; // 4 hours

// Russian prayer name → English key
const PRAYER_MAP: Record<string, string> = {
	'фаджр': 'fajr',
	'восход': 'sunrise',
	'шурук': 'sunrise',
	'зухр': 'dhuhr',
	'духр': 'dhuhr',
	'аср': 'asr',
	'магриб': 'maghrib',
	'иша': 'isha',
	'ятси': 'isha'
};

export const GET = async ({ url }) => {
	const city = url.searchParams.get('city')?.toLowerCase().trim();
	if (!city || !/^[a-z0-9\-]+$/.test(city)) {
		return error(400, 'Invalid city slug');
	}

	const cached = CACHE.get(city);
	if (cached && Date.now() < cached.expires) {
		return json(cached.times);
	}

	try {
		const res = await fetch(`https://namaz-24.ru/${city}/`, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
				'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
				'Accept': 'text/html,application/xhtml+xml'
			},
			signal: AbortSignal.timeout(10000)
		});

		if (res.status === 404) return error(404, 'City not found on namaz-24.ru');
		if (!res.ok) return error(502, `namaz-24.ru returned ${res.status}`);

		const html = await res.text();

		// Convert HTML to text lines preserving structure
		const lines = html
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/(?:tr|div|p|li|td|h[1-6]|section|article)>/gi, '\n')
			.replace(/<[^>]+>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/&#?\w+;/g, ' ')
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean);

		const times: Record<string, string> = {};

		for (const line of lines) {
			const timeMatch = line.match(/(\d{1,2}:\d{2})/);
			if (!timeMatch) continue;
			const time = timeMatch[1];

			// Normalize: lowercase, strip apostrophes/special chars
			const norm = line
				.toLowerCase()
				.replace(/['\u2018\u2019\u02bc\u0060]/g, '')
				.replace(/[^а-яёa-z0-9: ]/g, ' ');

			for (const [ruName, enKey] of Object.entries(PRAYER_MAP)) {
				if (times[enKey]) continue;
				if (norm.includes(ruName)) {
					times[enKey] = time;
					break;
				}
			}

			if (Object.keys(times).length >= 6) break;
		}

		// Fallback: search full text if line-based got < 4 prayers
		if (Object.keys(times).length < 4) {
			const flat = lines.join(' ').toLowerCase().replace(/['\u2018\u2019\u02bc]/g, '');
			for (const [ruName, enKey] of Object.entries(PRAYER_MAP)) {
				if (times[enKey]) continue;
				const re = new RegExp(
					`(\\d{1,2}:\\d{2})\\s{0,20}${ruName}|${ruName}\\s{0,20}(\\d{1,2}:\\d{2})`
				);
				const m = flat.match(re);
				if (m) times[enKey] = m[1] || m[2];
			}
		}

		if (Object.keys(times).length < 3) {
			return error(422, `Could not parse prayer times (found: ${Object.keys(times).join(', ')})`);
		}

		CACHE.set(city, { times, expires: Date.now() + TTL });
		return json(times);
	} catch (err: any) {
		if (err.name === 'TimeoutError') return error(504, 'namaz-24.ru timed out');
		return error(500, err.message || 'Failed to fetch');
	}
};
