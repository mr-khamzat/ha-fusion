import { json, error } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';

export const POST = async ({ request }: { request: Request }) => {
	try {
		const body = await request.json();
		const {
			message,
			history = [],
			api_key,
			model = 'claude-haiku-4-5-20251001',
			system_prompt
		} = body as {
			message: string;
			history: Array<{ role: 'user' | 'assistant'; content: string }>;
			api_key: string;
			model: string;
			system_prompt?: string;
		};

		if (!message) return error(400, 'message required');
		if (!api_key) return error(400, 'api_key required');

		const client = new Anthropic({ apiKey: api_key });

		const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
			...history.map((m) => ({ role: m.role, content: m.content })),
			{ role: 'user' as const, content: message }
		];

		const response = await client.messages.create({
			model,
			max_tokens: 1024,
			system:
				system_prompt ||
				'\u0422\u044B \u0443\u043C\u043D\u044B\u0439 \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u0434\u043B\u044F \u0443\u043C\u043D\u043E\u0433\u043E \u0434\u043E\u043C\u0430 Home Assistant. \u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u043A\u0440\u0430\u0442\u043A\u043E \u0438 \u043F\u043E \u0434\u0435\u043B\u0443 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435.',
			messages
		});

		const firstBlock = response.content[0];
		const reply = firstBlock.type === 'text' ? firstBlock.text : '';

		return json({ reply, usage: response.usage });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : 'AI request failed';
		return error(500, msg);
	}
};
