<script lang="ts">
	import { states, selectedLanguage, lang, connection, forecasts, dragging } from '$lib/Stores';
	import { iconMapMaterialSymbolsLight, iconMapMeteocons, iconMapWeatherIcons } from '$lib/Weather';
	import type { WeatherIconSet, WeatherIconConditions, WeatherIconMapping } from '$lib/Weather';
	import Icon from '@iconify/svelte';
	import { getSupport } from '$lib/Utils';
	import { onDestroy } from 'svelte';
	import { writable } from 'svelte/store';

	export let sel: any;

	let unsubscribe: any;
	let busy = false;
	const debug = false;

	$: entity = $states?.[sel?.entity_id];
	$: attributes = entity?.attributes;
	$: supported_features = attributes?.supported_features;

	$: supports = getSupport(supported_features, {
		FORECAST_DAILY: 1,
		FORECAST_HOURLY: 2,
		FORECAST_TWICE_DAILY: 4
	});

	/**
	 * tame reactivity
	 */
	const entity_id = writable<string | undefined>(sel?.entity_id);
	const forecast_type = writable<string | undefined>(sel?.forecast_type);

	$: if (sel?.entity_id) $entity_id = sel?.entity_id;
	$: if (!sel?.forecast_type || sel?.forecast_type) $forecast_type = sel?.forecast_type;

	// forecast_type fallback: first supported or 'daily' as universal fallback (for Yandex etc.)
	$: defaultForecastType =
		Object.keys(supports)
			?.find((key) => supports?.[key])
			?.replace('FORECAST_', '')
			?.toLowerCase() || 'daily';

	// get forecast when not dragging and entity changes
	// removed `&& defaultForecastType` guard — always try to subscribe (fixes Yandex supported_features=0)
	$: if (($forecast_type || !$forecast_type) && $entity_id && !$dragging) {
		getForecast();

		if (debug) {
			console.debug({ $forecast_type, $entity_id, $dragging });
		}
	}

	async function getForecast() {
		if (busy) return;
		busy = true;

		if (unsubscribe) {
			if (debug) console.debug('forecast unsubscribed');
			unsubscribe?.();
		}

		try {
			unsubscribe = await $connection?.subscribeMessage(
				(data: any) => {
					$forecasts[sel?.id] = { ...data, entity_id: $entity_id, subscribed: Date.now() };
					if (debug) console.debug('forecast subscribed');
				},
				{
					type: 'weather/subscribe_forecast',
					entity_id: $entity_id,
					forecast_type: $forecast_type || defaultForecastType
				}
			);
		} catch (err) {
			console.error(err);
		} finally {
			busy = false;
		}
	}

	let iconSet: WeatherIconSet;
	$: {
		if (sel?.icon_pack === 'materialsymbolslight') {
			iconSet = iconMapMaterialSymbolsLight;
		} else if (sel?.icon_pack === 'meteocons') {
			iconSet = iconMapMeteocons;
		} else if (sel?.icon_pack === 'weathericons') {
			iconSet = iconMapWeatherIcons;
		} else {
			iconSet = iconMapMeteocons;
		}
	}

	$: calculated = Math.min(sel?.days_to_show ?? 7, 7);

	interface Forecast {
		condition: string;
		icon: WeatherIconMapping | undefined;
		date: string;
		temperature: number;
		templow?: number;
		precipitation_probability?: number;
	}

	// Use subscription data when available, fall back to attributes.forecast (Yandex legacy)
	$: rawForecast = $forecasts?.[sel?.id]?.forecast ?? attributes?.forecast;

	let forecast: Forecast[];
	$: forecast = rawForecast?.slice(0, calculated).map(function (item: any) {
		const icon: WeatherIconMapping | undefined =
			iconSet.conditions[item?.condition as keyof WeatherIconConditions];
		const x: Forecast = {
			condition: item?.condition,
			icon,
			date: item?.datetime,
			temperature: item?.temperature,
			// Yandex: templow; HA standard: temperature_low
			templow: item?.templow ?? item?.temperature_low,
			precipitation_probability: item?.precipitation_probability
		};
		return x;
	});

	// Different forecast providers choose different intervals
	$: forecast_diff =
		(new Date(forecast?.[1]?.date).valueOf() - new Date(forecast?.[0]?.date).valueOf()) / 3600000;

	// Show templow row when at least one item has it (daily forecasts from Yandex/OpenWeather etc.)
	$: showTemplow = forecast?.some((f) => f.templow !== undefined && f.templow !== null);

	// Show precip when at least one item has probability
	$: showPrecip = forecast?.some(
		(f) => f.precipitation_probability !== undefined && f.precipitation_probability !== null
	);

	// cleanup
	onDestroy(() => {
		if (unsubscribe) {
			if (debug) console.debug('forecast destroyed');
			unsubscribe?.();
		}
	});
</script>

{#if forecast}
	<div class="container" class:with-templow={showTemplow}>
		{#each forecast as item}
			<div class="item">
				<div class="day">
					{#if forecast_diff < 24}
						{new Intl.DateTimeFormat($selectedLanguage, { hour: 'numeric' }).format(
							new Date(item.date)
						)}
					{:else}
						{new Intl.DateTimeFormat($selectedLanguage, { weekday: 'short' }).format(
							new Date(item.date)
						)}
					{/if}
				</div>

				<div class="icon">
					{#if item.icon?.local}
						<icon class="ff-fill">
							<img src="{item.icon.icon_variant_day}.svg" width="100%" height="100%" alt="" />
						</icon>
					{:else if item.icon}
						<Icon icon={item.icon.icon_variant_day} width="100%" height="100%"></Icon>
					{:else}
						<!-- fallback icon for unknown conditions -->
						<Icon icon="mdi:weather-cloudy" width="100%" height="100%" />
					{/if}
				</div>

				<div class="temp">
					{Math.round(item.temperature)}{attributes?.temperature_unit || '°'}
				</div>

				{#if showTemplow}
					<div class="templow">
						{#if item.templow !== undefined && item.templow !== null}
							{Math.round(item.templow)}{attributes?.temperature_unit || '°'}
						{:else}
							–
						{/if}
					</div>
				{/if}

				{#if showPrecip && item.precipitation_probability !== undefined && item.precipitation_probability !== null}
					<div class="precip" title="Precipitation probability">
						<Icon icon="mdi:water-outline" height="9" width="9" />
						{Math.round(item.precipitation_probability)}%
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<div class="empty">
		{$lang('weather_forecast')}
	</div>
{/if}

<style>
	.item {
		display: grid;
		grid-column-gap: 0px;
		grid-row-gap: 0px;
		grid-template-areas:
			'day'
			'icon'
			'temp';
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		text-overflow: ellipsis;
		overflow: hidden;
		width: 3.6rem;
	}

	.with-templow .item {
		grid-template-areas:
			'day'
			'icon'
			'temp'
			'templow';
	}

	.container {
		padding: var(--theme-sidebar-item-padding);
		display: flex;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		text-overflow: ellipsis;
		overflow: hidden;
		justify-content: space-between;
		padding-left: 0;
		padding-right: 0.25rem;
		margin-left: -0.1rem;
		height: 7.5rem;
	}

	.with-templow.container {
		height: 9rem;
	}

	.empty {
		word-wrap: break-word;
		padding: 0.5em;
		overflow: hidden;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
		height: 7.5rem;
	}

	.day {
		grid-area: day;
		justify-content: center;
		display: flex;
		width: 3.6rem;
	}

	.icon {
		grid-area: icon;
		width: 3.6rem;
		height: 3.6rem;
		display: flex;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		justify-content: center;
		transform-origin: right;
	}

	.temp {
		grid-area: temp;
		justify-content: center;
		display: flex;
		white-space: nowrap;
		width: 3.6rem;
		overflow: hidden;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
	}

	.templow {
		grid-area: templow;
		justify-content: center;
		display: flex;
		white-space: nowrap;
		width: 3.6rem;
		overflow: hidden;
		color: rgba(255, 255, 255, 0.45);
		font-size: 0.85em;
	}

	.precip {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.15rem;
		font-size: 0.72rem;
		color: rgba(147, 197, 253, 0.8);
		white-space: nowrap;
		margin-top: 0.1rem;
	}

	.ff-fill {
		width: 3.6rem;
		height: 3.6rem;
	}
</style>
