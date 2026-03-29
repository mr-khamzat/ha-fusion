<script lang="ts">
	import { states, editMode, motion, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: state = entity?.state || '';
	$: attrs = (entity?.attributes || {}) as Record<string, any>;
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Weather';

	const weatherIcons: Record<string, string> = {
		'clear-night': 'mdi:weather-night',
		cloudy: 'mdi:weather-cloudy',
		fog: 'mdi:weather-fog',
		hail: 'mdi:weather-hail',
		lightning: 'mdi:weather-lightning',
		'lightning-rainy': 'mdi:weather-lightning-rainy',
		partlycloudy: 'mdi:weather-partly-cloudy',
		pouring: 'mdi:weather-pouring',
		rainy: 'mdi:weather-rainy',
		snowy: 'mdi:weather-snowy',
		'snowy-rainy': 'mdi:weather-snowy-rainy',
		sunny: 'mdi:weather-sunny',
		windy: 'mdi:weather-windy',
		'windy-variant': 'mdi:weather-windy-variant',
		exceptional: 'mdi:alert-circle-outline'
	};

	const weatherColors: Record<string, string> = {
		sunny: 'rgba(251,191,36,0.9)',
		'clear-night': 'rgba(167,139,250,0.9)',
		rainy: 'rgba(147,197,253,0.9)',
		pouring: 'rgba(96,165,250,0.9)',
		snowy: 'rgba(255,255,255,0.7)',
		'snowy-rainy': 'rgba(200,220,255,0.75)',
		hail: 'rgba(200,220,255,0.8)',
		fog: 'rgba(200,200,200,0.6)',
		windy: 'rgba(134,239,172,0.8)',
		'windy-variant': 'rgba(134,239,172,0.8)',
		lightning: 'rgba(251,191,36,0.85)',
		'lightning-rainy': 'rgba(251,191,36,0.8)',
		cloudy: 'rgba(200,200,220,0.7)',
		partlycloudy: 'rgba(200,210,240,0.8)'
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

	const dayNamesRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

	$: weatherIcon = weatherIcons[state] || 'mdi:weather-partly-cloudy';
	$: weatherColor = weatherColors[state] || 'rgba(255,255,255,0.85)';
	$: conditionLabel = conditionRu[state] || state;

	$: temperature = attrs.temperature != null ? Math.round(attrs.temperature as number) : null;
	$: humidity = attrs.humidity != null ? Math.round(attrs.humidity as number) : null;
	$: pressure = attrs.pressure != null ? Math.round(attrs.pressure as number) : null;
	$: windSpeed = attrs.wind_speed != null ? (attrs.wind_speed as number).toFixed(1) : null;
	$: tempUnit = attrs.temperature_unit || '°C';
	$: windUnit = attrs.wind_speed_unit || 'km/h';

	$: forecastRaw = (attrs.forecast as any[]) || [];
	$: forecast = forecastRaw.slice(0, 3).map((f: any) => {
		const d = new Date(f.datetime);
		const dayName = dayNamesRu[d.getDay()];
		return {
			day: dayName,
			condition: f.condition || '',
			icon: weatherIcons[f.condition] || 'mdi:weather-partly-cloudy',
			color: weatherColors[f.condition] || 'rgba(255,255,255,0.7)',
			high: f.temperature != null ? Math.round(f.temperature) : null,
			low: f.templow != null ? Math.round(f.templow) : null
		};
	});

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'weather',
				title: 'Weather'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="weather-card"
	on:click={handleClick}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.03)' }}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
	style:--weather-color={weatherColor}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:weather-partly-cloudy" height="28" width="28" style="opacity:0.3" />
			<span>Настроить погоду</span>
		</div>
	{:else}
		<!-- Top: icon + temp + condition -->
		<div class="weather-main">
			<div class="weather-icon-wrap">
				<Icon icon={weatherIcon} height="48" width="48" style="color:{weatherColor};filter:drop-shadow(0 0 10px {weatherColor})" />
			</div>
			<div class="weather-info">
				<div class="weather-name">{name}</div>
				{#if temperature !== null}
					<div class="weather-temp" style:color={weatherColor}>
						{temperature}<span class="temp-unit">{tempUnit}</span>
					</div>
				{/if}
				<div class="weather-condition">{conditionLabel}</div>
			</div>
		</div>

		<!-- Chips row -->
		<div class="chips-row">
			{#if humidity !== null}
				<div class="chip">
					<Icon icon="mdi:water-percent" height="12" width="12" />
					<span>{humidity}%</span>
				</div>
			{/if}
			{#if pressure !== null}
				<div class="chip">
					<Icon icon="mdi:gauge" height="12" width="12" />
					<span>{pressure} гПа</span>
				</div>
			{/if}
			{#if windSpeed !== null}
				<div class="chip">
					<Icon icon="mdi:weather-windy" height="12" width="12" />
					<span>{windSpeed} {windUnit}</span>
				</div>
			{/if}
		</div>

		<!-- Forecast -->
		{#if forecast.length > 0}
			<div class="forecast-row">
				{#each forecast as day}
					<div class="forecast-day">
						<span class="fcast-day-name">{day.day}</span>
						<Icon icon={day.icon} height="18" width="18" style="color:{day.color}" />
						<span class="fcast-temps">
							{#if day.high !== null}<span class="fcast-high">{day.high}°</span>{/if}
							{#if day.low !== null}<span class="fcast-low">{day.low}°</span>{/if}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.weather-card {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		height: 100%;
		min-height: 8rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.8rem;
	}

	.weather-main {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.weather-icon-wrap {
		flex-shrink: 0;
		display: flex;
	}

	.weather-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.weather-name {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.weather-temp {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		transition: color 0.4s ease;
	}

	.temp-unit {
		font-size: 1rem;
		font-weight: 400;
		margin-left: 0.1rem;
		opacity: 0.7;
	}

	.weather-condition {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.chips-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba(255, 255, 255, 0.07);
		border-radius: 999px;
		padding: 0.2rem 0.5rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.55);
	}

	.forecast-row {
		display: flex;
		gap: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding-top: 0.5rem;
		margin-top: auto;
	}

	.forecast-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		flex: 1;
		padding: 0.1rem 0;
	}

	.fcast-day-name {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.35);
		font-weight: 500;
		text-transform: uppercase;
	}

	.fcast-temps {
		display: flex;
		gap: 0.25rem;
		font-size: 0.72rem;
	}

	.fcast-high {
		color: rgba(255, 255, 255, 0.75);
		font-weight: 600;
	}

	.fcast-low {
		color: rgba(255, 255, 255, 0.35);
	}
</style>
