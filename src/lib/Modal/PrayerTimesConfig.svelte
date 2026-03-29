<script lang="ts">
	import { dashboard, record } from '$lib/Stores';
	import { base } from '$app/paths';
	import { onDestroy } from 'svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';

	export let isOpen: boolean;
	export let sel: any;

	let cityName: string = sel?.city_name || '';
	let citySlug: string = sel?.city_slug || '';
	let testResult: 'idle' | 'loading' | 'ok' | 'error' = 'idle';
	let testError = '';
	let testTimes: Record<string, string> = {};

	const LABELS: Record<string, string> = {
		fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр',
		asr: 'Аср', maghrib: 'Магриб', isha: 'Иша'
	};

	// Russian → Latin transliteration (matches namaz-24.ru URL scheme)
	const TRANSLIT: Record<string, string> = {
		а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'zh', з:'z',
		и:'i', й:'j', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r',
		с:'s', т:'t', у:'u', ф:'f', х:'h', ц:'c', ч:'ch', ш:'sh', щ:'shh',
		ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya'
	};

	function toSlug(s: string): string {
		return s.toLowerCase()
			.split('')
			.map(c => TRANSLIT[c] ?? (c === ' ' || c === '-' ? '-' : /[a-z0-9]/.test(c) ? c : ''))
			.join('')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function handleNameInput() {
		// Auto-generate slug from Cyrillic name
		if (cityName) citySlug = toSlug(cityName);
		save();
	}

	function save() {
		sel.city_slug = citySlug.trim().toLowerCase();
		sel.city_name = cityName.trim();
		$dashboard = $dashboard;
	}

	async function testCity() {
		const slug = citySlug.trim().toLowerCase();
		if (!slug) return;
		testResult = 'loading';
		testError = '';
		try {
			const res = await fetch(`${base}/_api/prayer_times?city=${encodeURIComponent(slug)}`);
			const data = await res.json();
			if (res.ok) {
				testTimes = data;
				testResult = 'ok';
				save();
			} else {
				testError = data?.message || `Ошибка ${res.status}`;
				testResult = 'error';
			}
		} catch {
			testError = 'Нет подключения';
			testResult = 'error';
		}
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Намаз · Prayer Times</h1>

		<h2>Город</h2>
		<p class="hint">Введи название города на русском — slug для URL сгенерируется автоматически.</p>
		<div class="slug-row">
			<input
				type="text"
				class="input"
				placeholder="Грозный"
				bind:value={cityName}
				on:input={handleNameInput}
				autocomplete="off"
				spellcheck="false"
			/>
			<button class="test-btn" on:click={testCity} disabled={!citySlug || testResult === 'loading'}>
				{testResult === 'loading' ? '...' : 'Проверить'}
			</button>
		</div>

		{#if citySlug}
			<p class="slug-hint">URL: <code>namaz-24.ru/{citySlug}/</code></p>
		{/if}

		{#if testResult === 'ok'}
			<div class="test-ok">
				<span>Данные получены:</span>
				<div class="test-times">
					{#each Object.entries(testTimes) as [key, time]}
						<span class="tpill">{LABELS[key] ?? key}: <b>{time}</b></span>
					{/each}
				</div>
			</div>
		{:else if testResult === 'error'}
			<div class="test-err">{testError}</div>
		{/if}

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.hint {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.35);
		margin: 0 0 0.6rem;
		line-height: 1.5;
	}

	.slug-hint {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.25);
		margin: 0.3rem 0 0.5rem;
	}

	code {
		background: rgba(255, 255, 255, 0.08);
		padding: 0.1em 0.3em;
		border-radius: 3px;
		font-size: 0.85em;
	}

	.slug-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.slug-row .input {
		flex: 1;
	}

	.test-btn {
		padding: 0.5rem 1rem;
		background: rgba(96, 165, 250, 0.15);
		color: rgba(147, 197, 253, 0.9);
		border: 1px solid rgba(96, 165, 250, 0.2);
		border-radius: 0.5rem;
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.15s;
	}

	.test-btn:hover:not(:disabled) {
		background: rgba(96, 165, 250, 0.25);
	}

	.test-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.test-ok {
		font-size: 0.75rem;
		color: rgba(52, 211, 153, 0.8);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.5rem;
		background: rgba(52, 211, 153, 0.06);
		border-radius: 0.4rem;
		border: 1px solid rgba(52, 211, 153, 0.15);
	}

	.test-times {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.tpill {
		background: rgba(255, 255, 255, 0.05);
		padding: 0.15rem 0.4rem;
		border-radius: 999px;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.tpill b {
		color: rgba(52, 211, 153, 0.9);
	}

	.test-err {
		font-size: 0.75rem;
		color: rgba(248, 113, 113, 0.8);
		padding: 0.4rem 0.5rem;
		background: rgba(248, 113, 113, 0.06);
		border-radius: 0.4rem;
		border: 1px solid rgba(248, 113, 113, 0.15);
	}
</style>
