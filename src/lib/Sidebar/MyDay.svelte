<script lang="ts">
	import { states, timer } from '$lib/Stores';
	import { connection, selectedLanguage } from '$lib/Stores';
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import type { HassEntities } from 'home-assistant-js-websocket';
	import type { MyDayItem } from '$lib/Types';

	export let sel: MyDayItem;

	// ── Prayer detection (reused from Screensaver) ─────────────────────────────

	const PRAYER_NAMES: Record<string, string> = {
		fajr: 'Фаджр',
		dhuhr: 'Зухр',
		asr: 'Аср',
		maghrib: 'Магриб',
		isha: 'Иша'
	};

	const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

	const PRAYER_ALIASES: Record<string, string[]> = {
		fajr: ['fajr', 'fadjr', 'фаджр', 'субх'],
		dhuhr: ['dhuhr', 'zuhr', 'зухр', 'полудень'],
		asr: ['asr', 'аср'],
		maghrib: ['maghrib', 'магриб', 'мағриб'],
		isha: ['isha', 'esha', 'иша']
	};

	const weatherIcons: Record<string, string> = {
		'clear-night': '🌙',
		cloudy: '☁️',
		fog: '🌫️',
		hail: '🌨️',
		lightning: '⚡',
		'lightning-rainy': '⛈️',
		partlycloudy: '⛅',
		pouring: '🌧️',
		rainy: '🌦️',
		snowy: '❄️',
		'snowy-rainy': '🌨️',
		sunny: '☀️',
		windy: '💨',
		'windy-variant': '🌬️',
		exceptional: '⚠️'
	};

	function detectPrayerSensors(statesMap: HassEntities) {
		return PRAYER_KEYS.map((name) => {
			const aliases = PRAYER_ALIASES[name] || [name];
			const entity = Object.values(statesMap).find((e) => {
				if (!e.entity_id.startsWith('sensor.')) return false;
				if (!e.state || e.state === 'unavailable' || e.state === 'unknown') return false;
				const idLower = e.entity_id.toLowerCase();
				const nameLower = (e.attributes?.friendly_name || '').toLowerCase();
				if (!aliases.some((a) => idLower.includes(a) || nameLower.includes(a))) return false;
				if (/^\d{1,2}:\d{2}/.test(e.state)) return true;
				if (/[T ]\d{2}:\d{2}/.test(e.state)) return true;
				return false;
			});
			if (!entity) return null;
			let time = entity.state as string;
			const dtMatch = time.match(/[T ](\d{2}:\d{2})/);
			if (dtMatch) time = dtMatch[1];
			const hmsMatch = time.match(/^(\d{1,2}:\d{2}(:\d{2})?)/);
			if (hmsMatch) time = hmsMatch[1];
			return { name, time };
		}).filter(Boolean) as { name: string; time: string }[];
	}

	function formatCountdown(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	function getNextPrayer(
		sensors: { name: string; time: string }[],
		now: Date
	): { label: string; time: string; countdown: string } | null {
		if (!sensors.length) return null;
		const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
		for (const s of sensors) {
			const parts = s.time.split(':');
			const pSecs =
				parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + (parseInt(parts[2]) || 0);
			const diff = pSecs - nowSecs;
			if (diff > 0) {
				return {
					label: PRAYER_NAMES[s.name] || s.name,
					time: s.time.slice(0, 5),
					countdown: formatCountdown(diff)
				};
			}
		}
		const first = sensors[0];
		const parts = first.time.split(':');
		const pSecs =
			parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + (parseInt(parts[2]) || 0);
		const diff = 86400 - nowSecs + pSecs;
		return {
			label: PRAYER_NAMES[first.name] || first.name,
			time: first.time.slice(0, 5),
			countdown: formatCountdown(diff)
		};
	}

	// ── Reactive data ───────────────────────────────────────────────────────────

	// Prayer
	$: prayerSensors = !sel?.hide_prayer ? detectPrayerSensors($states || {}) : [];
	$: nextPrayer = !sel?.hide_prayer ? getNextPrayer(prayerSensors, $timer) : null;

	// Weather — auto-detect or use configured entity
	$: weatherEntityId =
		sel?.weather_entity ||
		Object.values($states || {}).find((e) => e.entity_id.startsWith('weather.'))?.entity_id;
	$: weatherEntity = weatherEntityId ? $states?.[weatherEntityId] : undefined;
	$: weatherState = weatherEntity?.state || '';
	$: weatherTemp = weatherEntity?.attributes?.temperature;
	$: weatherUnit = weatherEntity?.attributes?.temperature_unit || '°';
	$: weatherIcon = weatherState ? (weatherIcons[weatherState] || '🌡️') : '';
	$: showWeather = !!weatherEntity && weatherState !== 'unavailable';

	// Persons
	$: persons = !sel?.hide_persons
		? Object.values($states || {}).filter((e) => e.entity_id.startsWith('person.'))
		: [];

	// Calendar — fetch next event from first calendar entity
	interface CalEvent {
		title: string;
		start: string;
		allDay: boolean;
	}

	let calEvent: CalEvent | null = null;
	let calTimer: ReturnType<typeof setInterval>;

	async function fetchCalendar() {
		if (sel?.hide_calendar) return;
		if (!$connection) return;

		const calendarEntityId = Object.keys($states || {}).find((k) =>
			k.startsWith('calendar.')
		);
		if (!calendarEntityId) return;

		const now = new Date();
		const end = new Date();
		end.setDate(now.getDate() + 7);

		const params = encodeURI(`?start=${now.toISOString()}&end=${end.toISOString()}`);
		const url = `${base}/api/calendars/${calendarEntityId}${params}`;
		const token = ($connection as any)?.options?.auth?.data?.access_token;

		try {
			const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
			const data = await res.json();
			if (Array.isArray(data) && data.length > 0) {
				const e = data[0];
				calEvent = {
					title: e.summary || '',
					start: e.start?.dateTime || e.start?.date || '',
					allDay: !e.start?.dateTime
				};
			} else {
				calEvent = null;
			}
		} catch {
			calEvent = null;
		}
	}

	// Track previous connection to detect reconnects without double-fetching on mount
	let _prevConn: typeof $connection = null;
	$: {
		if ($connection && $connection !== _prevConn) {
			_prevConn = $connection;
			fetchCalendar();
		}
	}

	onMount(() => {
		calTimer = setInterval(fetchCalendar, 5 * 60 * 1000);
	});

	onDestroy(() => clearInterval(calTimer));

	function calRelativeTime(dateStr: string): string {
		if (!dateStr) return '';
		const now = new Date();
		const d = new Date(dateStr);
		const diffMs = d.getTime() - now.getTime();
		const diffH = diffMs / 3600000;
		const diffD = Math.floor(diffH / 24);
		if (diffH >= 0 && diffH < 1) return `через ${Math.round(diffH * 60)}м`;
		if (diffH >= 1 && diffH < 24) return `через ${Math.round(diffH)}ч`;
		if (diffD === 1) return 'завтра';
		if (diffD < 7)
			return new Intl.DateTimeFormat($selectedLanguage, { weekday: 'short' }).format(d);
		return new Intl.DateTimeFormat($selectedLanguage, {
			month: 'short',
			day: 'numeric'
		}).format(d);
	}

	function calFormatTime(dateStr: string, allDay: boolean): string {
		if (allDay) return 'весь день';
		return new Intl.DateTimeFormat($selectedLanguage, {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(dateStr));
	}

	function personInitials(name: string): string {
		return name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	$: hasAnyData = nextPrayer || showWeather || persons.length > 0 || calEvent;
</script>

<div class="my-day">
	<!-- Header label -->
	<div class="section-label">Мой день</div>

	{#if !hasAnyData}
		<div class="placeholder">Нет данных</div>
	{:else}
		<!-- Prayer -->
		{#if nextPrayer && !sel?.hide_prayer}
			<div class="row prayer-row">
				<span class="row-icon">🕌</span>
				<div class="row-body">
					<span class="row-title">{nextPrayer.label}</span>
					<span class="row-sub">{nextPrayer.time}</span>
				</div>
				<span class="row-right countdown">{nextPrayer.countdown}</span>
			</div>
		{/if}

		<!-- Weather -->
		{#if showWeather}
			<div class="row">
				<span class="row-icon weather-icon">{weatherIcon}</span>
				<div class="row-body">
					<span class="row-title">
						{#if weatherTemp !== undefined}
							{Math.round(weatherTemp)}{weatherUnit}
						{:else}
							{weatherState}
						{/if}
					</span>
					{#if weatherState}
						<span class="row-sub">{weatherState.replace(/-/g, ' ')}</span>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Persons -->
		{#if persons.length > 0 && !sel?.hide_persons}
			<div class="row persons-row">
				<span class="row-icon">👥</span>
				<div class="persons-list">
					{#each persons as person}
						{@const isHome = person.state === 'home'}
						{@const name =
							person.attributes?.friendly_name ||
							person.entity_id.split('.')[1] ||
							''}
						{@const pic = person.attributes?.entity_picture}
						<div class="person-chip" class:home={isHome} title={name}>
							{#if pic}
								<img src={pic} alt={name} class="person-pic" />
							{:else}
								<span class="person-initials">{personInitials(name)}</span>
							{/if}
							<span class="person-dot" class:home={isHome}></span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Calendar -->
		{#if calEvent && !sel?.hide_calendar}
			<div class="row">
				<span class="row-icon">📅</span>
				<div class="row-body">
					<span class="row-title cal-title">{calEvent.title}</span>
					<span class="row-sub">{calFormatTime(calEvent.start, calEvent.allDay)}</span>
				</div>
				<span class="row-right">{calRelativeTime(calEvent.start)}</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.my-day {
		padding: var(--theme-sidebar-item-padding);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		pointer-events: none;
	}

	.section-label {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.3);
		margin-bottom: 0.1rem;
	}

	.placeholder {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.25);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 1.8rem;
	}

	.row-icon {
		flex-shrink: 0;
		font-size: 1rem;
		width: 1.4rem;
		text-align: center;
		line-height: 1;
	}

	.weather-icon {
		font-size: 1.1rem;
	}

	.row-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.row-title {
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cal-title {
		font-size: 0.78rem;
	}

	.row-sub {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.35);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: capitalize;
	}

	.row-right {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.3);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.countdown {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		font-variant-numeric: tabular-nums;
	}

	/* Persons */
	.persons-row {
		align-items: center;
	}

	.persons-list {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.person-chip {
		position: relative;
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #3730a3, #6366f1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
		flex-shrink: 0;
	}

	.person-chip.home {
		background: linear-gradient(135deg, #065f46, #10b981);
	}

	.person-pic {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}

	.person-initials {
		font-size: 0.6rem;
		font-weight: 700;
		color: white;
	}

	.person-dot {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #6b7280;
		border: 1.5px solid var(--theme-navigate-background-color, #1a1a2e);
	}

	.person-dot.home {
		background: #10b981;
	}
</style>
