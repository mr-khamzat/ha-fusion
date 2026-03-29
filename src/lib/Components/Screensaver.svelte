<script lang="ts">
	import { states, timer, motion, dashboard } from '$lib/Stores';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';

	const dispatch = createEventDispatcher();

	$: config = $dashboard?.screensaver || {};

	// ── Time & date ────────────────────────────────────────────────────────────
	$: showSeconds = config.show_seconds ?? false;
	$: timeStr = $timer.toLocaleTimeString('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		...(showSeconds ? { second: '2-digit' } : {})
	});
	$: dateStr = $timer.toLocaleDateString('ru-RU', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	// ── Weather ────────────────────────────────────────────────────────────────
	$: showWeather = config.show_weather !== false;
	$: weatherEntityId =
		config.weather_entity ||
		Object.values($states || {}).find((e) => e.entity_id.startsWith('weather.'))?.entity_id;
	$: weatherEntity = weatherEntityId ? $states?.[weatherEntityId] : undefined;
	$: weatherState = weatherEntity?.state || '';
	$: weatherTemp = weatherEntity?.attributes?.temperature;
	$: weatherUnit = weatherEntity?.attributes?.temperature_unit || '°C';
	$: weatherIcon = weatherState ? (weatherIcons[weatherState] || '🌡️') : '';
	$: weatherCondition = conditionRu[weatherState] || weatherState;
	$: weatherFeelsLike = weatherEntity?.attributes?.apparent_temperature ?? weatherEntity?.attributes?.feels_like ?? null;
	$: weatherHumidity = weatherEntity?.attributes?.humidity ?? null;
	$: weatherWind = weatherEntity?.attributes?.wind_speed ?? null;
	$: weatherWindUnit = weatherEntity?.attributes?.wind_speed_unit || 'м/с';
	$: weatherPressure = weatherEntity?.attributes?.pressure ?? null;
	$: weatherWindBearing = weatherEntity?.attributes?.wind_bearing ?? null;
	$: weatherDewPoint = weatherEntity?.attributes?.dew_point ?? null;
	$: weatherVisibility = weatherEntity?.attributes?.visibility ?? null;

	// Weather state categories for animations
	$: isRainy = ['rainy', 'pouring', 'hail'].includes(weatherState);
	$: isSnowy = ['snowy', 'snowy-rainy'].includes(weatherState);
	$: isSunny = ['sunny'].includes(weatherState);
	$: isStormy = ['lightning', 'lightning-rainy'].includes(weatherState);
	$: isCloudy = ['cloudy', 'partlycloudy', 'windy', 'windy-variant', 'fog'].includes(weatherState);

	function windDirArrow(bearing: number | null): string {
		if (bearing == null) return '';
		const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
		return dirs[Math.round(bearing / 45) % 8];
	}

	// ── Weather forecast (3 days) ───────────────────────────────────────────────
	interface ForecastDay {
		datetime: string;
		condition: string;
		temperature: number;
		templow?: number;
	}
	$: forecastRaw = (weatherEntity?.attributes?.forecast as ForecastDay[] | undefined) || [];
	// Take up to 3 daily entries; skip today (index 0) if it matches current date
	$: forecast3 = (() => {
		if (!forecastRaw.length) return [];
		const today = new Date().toISOString().slice(0, 10);
		const filtered = forecastRaw.filter((f) => {
			const d = (f.datetime || '').slice(0, 10);
			return d !== today;
		});
		return filtered.slice(0, 3);
	})();

	function forecastDayLabel(datetime: string): string {
		if (!datetime) return '';
		const d = new Date(datetime);
		return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
	}

	// ── Temperature & humidity sensors ─────────────────────────────────────────
	$: tempSensors = (config.temp_sensors || []) as string[];
	$: humiditySensors = (config.humidity_sensors || []) as string[];

	interface SensorRow {
		id: string;
		label: string;
		value: string;
		unit: string;
		humidityId?: string;
		humidityVal?: string;
	}

	$: sensorRows = buildSensorRows(tempSensors, humiditySensors, $states || {});

	function buildSensorRows(temps: string[], humids: string[], st: HassEntities): SensorRow[] {
		return temps.map((id) => {
			const e = st[id];
			const label = e?.attributes?.friendly_name || id.replace('sensor.', '');
			const value = e?.state || '—';
			const unit = e?.attributes?.unit_of_measurement || '°C';
			// try to pair humidity sensor by index
			const humidityId = humids[temps.indexOf(id)];
			const humE = humidityId ? st[humidityId] : undefined;
			return {
				id,
				label,
				value,
				unit,
				humidityId,
				humidityVal: humE?.state
			};
		});
	}

	// Also show unpaired humidity sensors
	$: extraHumidity = humiditySensors.slice(tempSensors.length).map((id) => {
		const e = $states?.[id];
		return {
			id,
			label: e?.attributes?.friendly_name || id.replace('sensor.', ''),
			value: e?.state || '—',
			unit: e?.attributes?.unit_of_measurement || '%'
		};
	});

	// ── Persons ────────────────────────────────────────────────────────────────
	$: personList = config.show_persons
		? Object.values($states || {}).filter((e) => e.entity_id.startsWith('person.'))
		: [];

	// ── Prayer ─────────────────────────────────────────────────────────────────
	$: prayerSensors = (config.show_prayer !== false) ? detectPrayerSensors($states || {}) : [];
	$: nextPrayer = (config.show_prayer !== false) ? getNextPrayer(prayerSensors, $timer) : null;

	// ── Camera ─────────────────────────────────────────────────────────────────
	$: cameraEntityState = config.camera_entity ? $states?.[config.camera_entity] : undefined;
	$: cameraPicture = cameraEntityState?.attributes?.entity_picture || '';

	// ── Helpers ────────────────────────────────────────────────────────────────
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

	const conditionRu: Record<string, string> = {
		'clear-night': 'Ясная ночь',
		cloudy: 'Облачно',
		fog: 'Туман',
		hail: 'Град',
		lightning: 'Гроза',
		'lightning-rainy': 'Дождь с грозой',
		partlycloudy: 'Переменная облачность',
		pouring: 'Ливень',
		rainy: 'Дождь',
		snowy: 'Снег',
		'snowy-rainy': 'Дождь со снегом',
		sunny: 'Солнечно',
		windy: 'Ветрено',
		'windy-variant': 'Ветрено',
		exceptional: 'Особые условия'
	};

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

	function detectPrayerSensors(statesMap: Record<string, any>) {
		return PRAYER_KEYS.map((name) => {
			const aliases = PRAYER_ALIASES[name] || [name];
			const entity = Object.values(statesMap).find((e) => {
				if (!e.entity_id.startsWith('sensor.')) return false;
				if (!e.state || e.state === 'unavailable' || e.state === 'unknown') return false;
				const idLower = e.entity_id.toLowerCase();
				const nameLower = (e.attributes?.friendly_name || '').toLowerCase();
				// Must contain the specific prayer name or one of its aliases
				if (!aliases.some((a) => idLower.includes(a) || nameLower.includes(a))) return false;
				// HH:MM or HH:MM:SS at start of state
				if (/^\d{1,2}:\d{2}/.test(e.state)) return true;
				// ISO or space-separated datetime: T05:30 or " 05:30"
				if (/[T ]\d{2}:\d{2}/.test(e.state)) return true;
				return false;
			});
			if (!entity) return null;
			let time = entity.state as string;
			// Extract HH:MM from ISO or space-separated datetime
			const dtMatch = time.match(/[T ](\d{2}:\d{2})/);
			if (dtMatch) time = dtMatch[1];
			// Trim to HH:MM:SS (drop timezone suffix if present)
			const hmsMatch = time.match(/^(\d{1,2}:\d{2}(:\d{2})?)/);
			if (hmsMatch) time = hmsMatch[1];
			return { name, time };
		}).filter(Boolean) as { name: string; time: string }[];
	}

	function getNextPrayer(
		sensors: { name: string; time: string }[],
		now: Date
	): { label: string; time: string; countdown: string } | null {
		if (!sensors.length) return null;
		const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
		for (const s of sensors) {
			const parts = s.time.split(':');
			const pSecs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + (parseInt(parts[2]) || 0);
			const diff = pSecs - nowSecs;
			if (diff > 0) {
				return { label: PRAYER_NAMES[s.name] || s.name, time: s.time.slice(0, 5), countdown: formatCountdown(diff) };
			}
		}
		const first = sensors[0];
		const parts = first.time.split(':');
		const pSecs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + (parseInt(parts[2]) || 0);
		const diff = 86400 - nowSecs + pSecs;
		return { label: PRAYER_NAMES[first.name] || first.name, time: first.time.slice(0, 5), countdown: formatCountdown(diff) };
	}

	function formatCountdown(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	function personState(state: string): string {
		if (state === 'home') return 'Дома';
		if (state === 'not_home') return 'В пути';
		return state;
	}

	function batteryColor(level: number): string {
		if (level >= 60) return 'rgba(52, 211, 153, 0.85)';
		if (level >= 20) return 'rgba(251, 191, 36, 0.85)';
		return 'rgba(239, 68, 68, 0.85)';
	}

	function findPersonBattery(person: HassEntity, st: HassEntities): number | null {
		const personId = person.entity_id.replace('person.', '').toLowerCase();
		const personName = (person.attributes?.friendly_name || '').toLowerCase();
		const sensor = Object.values(st).find(
			(e) =>
				e.entity_id.startsWith('sensor.') &&
				(e.attributes?.device_class === 'battery' || e.attributes?.unit_of_measurement === '%') &&
				(e.entity_id.toLowerCase().includes(personId) ||
					(personName && (e.attributes?.friendly_name || '').toLowerCase().includes(personName))) &&
				!isNaN(parseFloat(e.state)) &&
				parseFloat(e.state) <= 100
		);
		if (!sensor) return null;
		const level = parseFloat(sensor.state);
		return level >= 0 && level <= 100 ? level : null;
	}

	function dismiss() {
		dispatch('dismiss');
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="screensaver"
	on:click={dismiss}
	on:touchstart={dismiss}
	transition:fade={{ duration: $motion * 2 }}
>
	<div class="ss-grid">
		<!-- ── LEFT COLUMN ─────────────────────────────────────────── -->
		<div class="ss-left">
			<!-- Time -->
			<div class="ss-time">{timeStr}</div>

			<!-- Date -->
			<div class="ss-date">{dateStr}</div>

			<!-- Weather (below date) -->
			<!-- Enhanced Weather Card -->
			{#if showWeather && weatherState}
				<div
					class="ss-weather-card"
					class:anim-rain={isRainy}
					class:anim-storm={isStormy}
					class:anim-snow={isSnowy}
					class:anim-sunny={isSunny}
					class:anim-cloudy={isCloudy}
				>
					<!-- Animated particles -->
					{#if isRainy || isStormy}
						<div class="ss-particles" aria-hidden="true">
							{#each { length: 14 } as _, i}
								<div class="ss-raindrop" style="--d:{(i * 0.17).toFixed(2)}s;--l:{(i * 7.1).toFixed(1)}%"></div>
							{/each}
						</div>
					{/if}
					{#if isSnowy}
						<div class="ss-particles" aria-hidden="true">
							{#each { length: 10 } as _, i}
								<div class="ss-snowflake" style="--d:{(i * 0.42).toFixed(2)}s;--l:{(i * 10).toFixed(1)}%">❄</div>
							{/each}
						</div>
					{/if}
					{#if isStormy}
						<div class="ss-lightning" aria-hidden="true"></div>
					{/if}

					<!-- Main: icon + temp + condition -->
					<div class="ss-weather-main">
						<span class="ss-weather-icon-big" class:spin-sun={isSunny}>{weatherIcon}</span>
						<div class="ss-weather-center">
							{#if weatherTemp != null}
								<span class="ss-weather-temp-big">{Math.round(weatherTemp)}{weatherUnit}</span>
							{/if}
							<span class="ss-weather-cond-big">{weatherCondition}</span>
							{#if weatherFeelsLike != null}
								<span class="ss-weather-feels">Ощущается {Math.round(weatherFeelsLike)}{weatherUnit}</span>
							{/if}
						</div>
					</div>

					<!-- Details row -->
					<div class="ss-weather-details">
						{#if weatherHumidity != null}
							<div class="ss-wd-item"><span class="ss-wd-icon">💧</span>{Math.round(weatherHumidity)}%</div>
						{/if}
						{#if weatherWind != null}
							<div class="ss-wd-item">
								<span class="ss-wd-icon">💨</span>{Math.round(weatherWind)}&nbsp;{weatherWindUnit}
								{#if weatherWindBearing != null}<span class="ss-wind-arrow">{windDirArrow(weatherWindBearing)}</span>{/if}
							</div>
						{/if}
						{#if weatherPressure != null}
							<div class="ss-wd-item"><span class="ss-wd-icon">🔵</span>{Math.round(weatherPressure)}&nbsp;гПа</div>
						{/if}
						{#if weatherVisibility != null}
							<div class="ss-wd-item"><span class="ss-wd-icon">👁️</span>{weatherVisibility}&nbsp;км</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Weather forecast strip -->
			{#if showWeather && forecast3.length > 0}
				<div class="ss-forecast">
					{#each forecast3 as day}
						<div class="ss-forecast-day">
							<span class="ss-forecast-label">{forecastDayLabel(day.datetime)}</span>
							<span class="ss-forecast-icon">{weatherIcons[day.condition] || '🌡️'}</span>
							<span class="ss-forecast-temp">
								{Math.round(day.temperature)}{weatherUnit}
								{#if day.templow != null}
									<span class="ss-forecast-low">/{Math.round(day.templow)}</span>
								{/if}
							</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Family members (left, under weather) -->
			{#if personList.length > 0}
				<div class="ss-persons">
					{#each personList as person}
						{@const battery = findPersonBattery(person, $states || {})}
						<div class="ss-person">
							{#if person.attributes?.entity_picture}
								<img
									src={person.attributes.entity_picture}
									alt={person.attributes?.friendly_name || person.entity_id}
									class="ss-person-pic"
								/>
							{:else}
								<span class="ss-person-icon">👤</span>
							{/if}
							<div class="ss-person-info">
								<span class="ss-person-name">
									{person.attributes?.friendly_name || person.entity_id}
								</span>
								<span class="ss-person-state" class:home={person.state === 'home'}>
									{personState(person.state)}
								</span>
								{#if battery !== null}
									<span class="ss-person-battery" style:color={batteryColor(battery)}>
										🔋 {Math.round(battery)}%
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- ── RIGHT COLUMN ────────────────────────────────────────── -->
		<div class="ss-right">
			<!-- Temperature & humidity sensors -->
			{#if sensorRows.length > 0 || extraHumidity.length > 0}
				<div class="ss-sensors">
					{#each sensorRows as row}
						<div class="ss-sensor-card">
							<div class="ss-sensor-name">{row.label}</div>
							<div class="ss-sensor-values">
								<span class="ss-sensor-val">🌡️ {row.value}{row.unit}</span>
								{#if row.humidityVal != null}
									<span class="ss-sensor-val ss-humidity">💧 {row.humidityVal}%</span>
								{/if}
							</div>
						</div>
					{/each}
					{#each extraHumidity as row}
						<div class="ss-sensor-card">
							<div class="ss-sensor-name">{row.label}</div>
							<div class="ss-sensor-values">
								<span class="ss-sensor-val ss-humidity">💧 {row.value}{row.unit}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Prayer (right side) -->
			{#if nextPrayer}
				<div class="ss-prayer">
					<div class="ss-prayer-head">
						<span>🕌</span>
						<span class="ss-prayer-name">{nextPrayer.label}</span>
						<span class="ss-prayer-time">{nextPrayer.time}</span>
					</div>
					<div class="ss-prayer-countdown">{nextPrayer.countdown}</div>
					<div class="ss-prayer-label">до намаза</div>
				</div>
			{/if}
		</div>

		<!-- ── FOOTER ──────────────────────────────────────────────── -->
		{#if cameraPicture}
			<div class="ss-footer">
				<div class="ss-camera">
					<img src={cameraPicture} alt="camera" class="ss-cam-img" />
				</div>
			</div>
		{/if}
	</div>

	<div class="ss-hint">Нажмите для пробуждения</div>
</div>

<style>
	.screensaver {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.93);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		user-select: none;
	}

	/* ── GRID ─────────────────────────────────────────────────────── */
	.ss-grid {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr auto;
		padding: clamp(1.5rem, 4vw, 3.5rem);
		gap: 1rem 2rem;
		pointer-events: none;
		overflow: hidden;
	}

	.ss-left {
		grid-column: 1;
		grid-row: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		justify-content: center;
	}

	.ss-right {
		grid-column: 2;
		grid-row: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 1.5rem;
		justify-content: center;
	}

	.ss-footer {
		grid-column: 1 / 3;
		grid-row: 2;
		display: flex;
		justify-content: flex-end;
		align-items: flex-end;
		padding-top: 0.5rem;
	}

	/* ── TIME ─────────────────────────────────────────────────────── */
	.ss-time {
		font-size: clamp(3.5rem, 12vw, 7.5rem);
		font-weight: 200;
		color: rgba(255, 255, 255, 0.95);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	/* ── DATE ─────────────────────────────────────────────────────── */
	.ss-date {
		font-size: clamp(0.95rem, 2.5vw, 1.35rem);
		color: rgba(255, 255, 255, 0.45);
		font-weight: 300;
		text-transform: capitalize;
	}

	/* ── WEATHER CARD ─────────────────────────────────────────────── */
	.ss-weather-card {
		position: relative;
		margin-top: 0.6rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		backdrop-filter: blur(8px);
		overflow: hidden;
		max-width: 22rem;
	}

	.ss-weather-card.anim-sunny {
		background: rgba(255, 200, 50, 0.07);
		border-color: rgba(255, 200, 50, 0.18);
		box-shadow: 0 0 30px rgba(255, 200, 50, 0.08);
	}
	.ss-weather-card.anim-rain,
	.ss-weather-card.anim-storm {
		background: rgba(80, 130, 200, 0.08);
		border-color: rgba(100, 160, 230, 0.2);
	}
	.ss-weather-card.anim-snow {
		background: rgba(200, 220, 255, 0.07);
		border-color: rgba(200, 220, 255, 0.18);
	}
	.ss-weather-card.anim-cloudy {
		background: rgba(150, 160, 180, 0.07);
		border-color: rgba(180, 190, 210, 0.15);
	}

	/* MAIN ROW */
	.ss-weather-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.ss-weather-icon-big {
		font-size: clamp(2rem, 5vw, 3.2rem);
		line-height: 1;
		filter: drop-shadow(0 0 8px rgba(255,255,255,0.15));
		display: inline-block;
	}
	.ss-weather-icon-big.spin-sun {
		animation: sun-spin 20s linear infinite;
		filter: drop-shadow(0 0 12px rgba(255,200,50,0.5));
	}

	.ss-weather-center {
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
	}

	.ss-weather-temp-big {
		font-size: clamp(1.5rem, 4vw, 2.4rem);
		font-weight: 200;
		color: rgba(255, 255, 255, 0.92);
		line-height: 1;
	}

	.ss-weather-cond-big {
		font-size: clamp(0.8rem, 1.6vw, 1rem);
		color: rgba(255, 255, 255, 0.55);
		font-weight: 300;
	}

	.ss-weather-feels {
		font-size: clamp(0.65rem, 1.2vw, 0.78rem);
		color: rgba(255, 255, 255, 0.3);
	}

	/* DETAILS ROW */
	.ss-weather-details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.8rem;
		margin-top: 0.55rem;
		padding-top: 0.45rem;
		border-top: 1px solid rgba(255,255,255,0.07);
	}

	.ss-wd-item {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		font-size: clamp(0.68rem, 1.3vw, 0.82rem);
		color: rgba(255, 255, 255, 0.5);
	}

	.ss-wd-icon { font-size: 0.75em; }
	.ss-wind-arrow { font-weight: 700; color: rgba(255,255,255,0.7); }

	/* ── RAIN PARTICLES ───────────────────────────────────────────── */
	.ss-particles {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		pointer-events: none;
		overflow: hidden;
		border-radius: inherit;
	}

	.ss-raindrop {
		position: absolute;
		top: -10%;
		left: var(--l, 10%);
		width: 1.5px;
		height: 12px;
		background: linear-gradient(to bottom, transparent, rgba(150,200,255,0.55));
		border-radius: 2px;
		animation: rain-fall 0.8s linear var(--d, 0s) infinite;
	}

	.ss-snowflake {
		position: absolute;
		top: -10%;
		left: var(--l, 10%);
		color: rgba(220,235,255,0.7);
		font-size: 0.7rem;
		animation: snow-fall 2.5s linear var(--d, 0s) infinite;
	}

	.ss-lightning {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		pointer-events: none;
		border-radius: inherit;
		animation: lightning-flash 4s ease-in-out 1.5s infinite;
	}

	/* ── ANIMATIONS ───────────────────────────────────────────────── */
	@keyframes sun-spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes rain-fall {
		0% { transform: translateY(-10px); opacity: 0; }
		20% { opacity: 1; }
		100% { transform: translateY(80px); opacity: 0; }
	}

	@keyframes snow-fall {
		0% { transform: translateY(-8px) translateX(0); opacity: 0; }
		15% { opacity: 0.8; }
		50% { transform: translateY(40px) translateX(6px); }
		100% { transform: translateY(80px) translateX(-4px); opacity: 0; }
	}

	@keyframes lightning-flash {
		0%, 90%, 100% { background: transparent; }
		92% { background: rgba(255,255,180,0.15); }
		94% { background: transparent; }
		96% { background: rgba(255,255,180,0.1); }
	}

	/* ── FORECAST ─────────────────────────────────────────────────── */
	.ss-forecast {
		display: flex;
		gap: 0.8rem;
		margin-top: 0.4rem;
	}

	.ss-forecast-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.6rem;
		padding: 0.4rem 0.6rem;
		min-width: 3.5rem;
	}

	.ss-forecast-label {
		font-size: clamp(0.55rem, 1vw, 0.7rem);
		color: rgba(255, 255, 255, 0.4);
		text-transform: capitalize;
		white-space: nowrap;
	}

	.ss-forecast-icon {
		font-size: clamp(0.9rem, 1.8vw, 1.15rem);
	}

	.ss-forecast-temp {
		font-size: clamp(0.65rem, 1.2vw, 0.8rem);
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
	}

	.ss-forecast-low {
		color: rgba(255, 255, 255, 0.35);
	}

	/* ── PERSONS ──────────────────────────────────────────────────── */
	.ss-persons {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1rem;
	}

	.ss-person {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.ss-person-pic {
		width: clamp(2rem, 4vw, 3rem);
		height: clamp(2rem, 4vw, 3rem);
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.12);
		flex-shrink: 0;
	}

	.ss-person-icon {
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.ss-person-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.ss-person-name {
		font-size: clamp(0.75rem, 1.4vw, 0.9rem);
		color: rgba(255, 255, 255, 0.7);
	}

	.ss-person-state {
		font-size: clamp(0.65rem, 1.2vw, 0.8rem);
		color: rgba(255, 255, 255, 0.35);
	}

	.ss-person-state.home {
		color: rgba(52, 211, 153, 0.8);
	}

	.ss-person-battery {
		font-size: clamp(0.6rem, 1.1vw, 0.75rem);
		opacity: 0.9;
	}

	/* ── SENSORS ──────────────────────────────────────────────────── */
	.ss-sensors {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		align-items: flex-end;
	}

	.ss-sensor-card {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.8rem;
		padding: 0.6rem 1rem;
		min-width: clamp(8rem, 16vw, 13rem);
		text-align: right;
	}

	.ss-sensor-name {
		font-size: clamp(0.6rem, 1.1vw, 0.75rem);
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ss-sensor-values {
		display: flex;
		gap: 0.8rem;
		justify-content: flex-end;
	}

	.ss-sensor-val {
		font-size: clamp(1rem, 2.5vw, 1.6rem);
		color: rgba(255, 255, 255, 0.8);
		font-weight: 200;
	}

	.ss-humidity {
		color: rgba(147, 197, 253, 0.8);
	}

	/* ── PRAYER ───────────────────────────────────────────────────── */
	.ss-prayer {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.2rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.8rem;
		padding: 0.7rem 1rem;
	}

	.ss-prayer-head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.ss-prayer-name {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.ss-prayer-time {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.ss-prayer-countdown {
		font-size: clamp(1.1rem, 2.5vw, 1.6rem);
		color: rgba(255, 220, 100, 0.9);
		font-weight: 200;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}

	.ss-prayer-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.3);
		text-align: right;
	}

	/* ── CAMERA ───────────────────────────────────────────────────── */
	.ss-camera {
		flex-shrink: 0;
	}

	.ss-cam-img {
		width: clamp(12rem, 24vw, 22rem);
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: block;
	}

	/* ── HINT ─────────────────────────────────────────────────────── */
	.ss-hint {
		text-align: center;
		padding: 0.6rem;
		font-size: clamp(0.6rem, 1.2vw, 0.75rem);
		color: rgba(255, 255, 255, 0.15);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		pointer-events: none;
	}

	/* ── RESPONSIVE ───────────────────────────────────────────────── */
	@media (max-width: 600px) {
		.ss-grid {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto auto;
		}

		.ss-left {
			grid-column: 1;
			grid-row: 1;
		}

		.ss-right {
			grid-column: 1;
			grid-row: 2;
			align-items: flex-start;
		}

		.ss-footer {
			grid-column: 1;
			grid-row: 3;
			justify-content: flex-start;
		}

		.ss-time {
			font-size: clamp(3rem, 18vw, 5rem);
		}

		.ss-sensors {
			align-items: flex-start;
		}

		.ss-sensor-card {
			text-align: left;
		}

		.ss-sensor-values {
			justify-content: flex-start;
		}
	}
</style>
