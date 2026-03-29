<script lang="ts">
	import { editMode, motion, ripple, selectedLanguage } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: citySlug = sel?.city_slug || '';
	$: cityName = sel?.city_name || '';

	const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
	const PRAYER_LABELS: Record<string, string> = {
		fajr: 'Фаджр',
		sunrise: 'Восход',
		dhuhr: 'Зухр',
		asr: 'Аср',
		maghrib: 'Магриб',
		isha: 'Иша'
	};
	const PRAYER_ICONS: Record<string, string> = {
		fajr: 'mdi:weather-night',
		sunrise: 'mdi:weather-sunset-up',
		dhuhr: 'mdi:weather-sunny',
		asr: 'mdi:weather-partly-cloudy',
		maghrib: 'mdi:weather-sunset-down',
		isha: 'mdi:moon-waning-crescent'
	};

	let times: Record<string, string> = {};
	let loading = false;
	let fetchError = '';
	let now = new Date();
	let ticker: ReturnType<typeof setInterval>;
	let lastFetchedCity = '';

	onMount(() => {
		ticker = setInterval(() => {
			now = new Date();
		}, 10000);
	});

	onDestroy(() => clearInterval(ticker));

	// Re-fetch when city slug changes
	$: if (citySlug && citySlug !== lastFetchedCity) {
		fetchTimes(citySlug);
	}

	async function fetchTimes(slug: string) {
		loading = true;
		fetchError = '';
		lastFetchedCity = slug;
		try {
			const res = await fetch(`${base}/_api/prayer_times?city=${encodeURIComponent(slug)}`);
			const data = await res.json();
			if (!res.ok) {
				fetchError = data?.message || `Ошибка ${res.status}`;
				times = {};
			} else {
				times = data;
				fetchError = '';
			}
		} catch (e: any) {
			fetchError = 'Нет подключения';
			times = {};
		}
		loading = false;
	}

	function parseTime(str: string): Date | null {
		if (!str) return null;
		const parts = str.split(':').map(Number);
		if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
		const d = new Date();
		d.setHours(parts[0], parts[1], 0, 0);
		return d;
	}

	$: parsedTimes = PRAYERS.map((key) => ({
		key,
		label: PRAYER_LABELS[key],
		icon: PRAYER_ICONS[key],
		time: times[key] || '',
		dt: parseTime(times[key] || '')
	})).filter((p) => p.dt !== null);

	$: nextPrayer = parsedTimes.find((p) => p.dt && p.dt > now) ?? null;

	$: minutesUntilNext = nextPrayer?.dt
		? Math.round((nextPrayer.dt.getTime() - now.getTime()) / 60000)
		: null;

	function fmt(dt: Date | null): string {
		if (!dt) return '—';
		return new Intl.DateTimeFormat($selectedLanguage, {
			hour: '2-digit',
			minute: '2-digit'
		}).format(dt);
	}

	function fmtCountdown(m: number): string {
		if (m < 60) return `${m} мин`;
		const h = Math.floor(m / 60);
		const rem = m % 60;
		return rem > 0 ? `${h}ч ${rem}м` : `${h}ч`;
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/PrayerTimesConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="prayer-card"
	on:click={handleEdit}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.03)' }}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	<!-- Header -->
	<div class="card-header">
		<div class="header-left">
			<Icon icon="mdi:mosque" height="13" width="13" style="opacity:0.55" />
			<span class="card-title">Намаз{cityName ? ` · ${cityName}` : ''}</span>
		</div>
		{#if nextPrayer && minutesUntilNext !== null}
			<div class="next-badge">
				<span class="next-name">{nextPrayer.label}</span>
				<span class="next-in">через {fmtCountdown(minutesUntilNext)}</span>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="empty-state">
			<Icon icon="mdi:loading" height="22" width="22" class="spin" style="opacity:0.4" />
			<span>Загрузка...</span>
		</div>
	{:else if fetchError}
		<div class="empty-state error">
			<Icon icon="mdi:alert-circle-outline" height="22" width="22" />
			<span>{fetchError}</span>
		</div>
	{:else if !citySlug}
		<div class="empty-state">
			<Icon icon="mdi:mosque" height="24" width="24" style="opacity:0.3" />
			<span>Укажите город в настройках</span>
		</div>
	{:else if parsedTimes.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:mosque" height="24" width="24" style="opacity:0.3" />
			<span>Нет данных для «{citySlug}»</span>
		</div>
	{:else}
		<div class="prayer-grid">
			{#each parsedTimes as p}
				{@const isPast = p.dt && p.dt < now}
				{@const isNext = nextPrayer?.key === p.key}
				<div class="prayer-cell" class:past={isPast} class:next={isNext}>
					<Icon
						icon={p.icon}
						height="13"
						width="13"
						style="color:{isNext ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.35)'}"
					/>
					<span class="prayer-name">{p.label}</span>
					<span class="prayer-time">{fmt(p.dt)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.prayer-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.45);
		font-weight: 500;
		min-width: 0;
		overflow: hidden;
	}

	.card-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.next-badge {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex-shrink: 0;
		margin-left: 0.5rem;
	}

	.next-name {
		font-size: 0.7rem;
		font-weight: 600;
		color: rgba(251, 191, 36, 0.9);
	}

	.next-in {
		font-size: 0.62rem;
		color: rgba(255, 255, 255, 0.35);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		flex: 1;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.75rem;
		text-align: center;
	}

	.empty-state.error {
		color: rgba(248, 113, 113, 0.7);
	}

	.prayer-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.3rem;
		flex: 1;
	}

	.prayer-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.12rem;
		padding: 0.3rem 0.2rem;
		border-radius: 0.4rem;
		background: rgba(255, 255, 255, 0.04);
	}

	.prayer-cell.past {
		opacity: 0.38;
	}

	.prayer-cell.next {
		background: rgba(251, 191, 36, 0.1);
		border: 1px solid rgba(251, 191, 36, 0.2);
	}

	.prayer-name {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.38);
		font-weight: 500;
	}

	.prayer-cell.next .prayer-name {
		color: rgba(251, 191, 36, 0.9);
	}

	.prayer-time {
		font-size: 0.76rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		font-variant-numeric: tabular-nums;
	}

	.prayer-cell.next .prayer-time {
		color: rgba(251, 191, 36, 0.95);
	}

	:global(.spin) {
		animation: spin 1.2s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
