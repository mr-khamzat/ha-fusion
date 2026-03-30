<script lang="ts">
	import { states, lang } from '$lib/Stores';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entity = sel?.entity_id ? $states?.[sel?.entity_id] : undefined;
	$: attributes = entity?.attributes;
	$: below_horizon = $states?.['sun.sun']?.state === 'below_horizon';
	$: src = entity?.state
		? `weather/meteocons/${entity.state}-${below_horizon ? 'night' : 'day'}.svg`
		: undefined;

	$: temperature = attributes?.temperature;
	$: apparentTemp = attributes?.apparent_temperature;
	$: humidity = attributes?.humidity;
	$: windSpeed = attributes?.wind_speed;
	$: windSpeedUnit = attributes?.wind_speed_unit || 'м/с';
	$: pressure = attributes?.pressure;
	$: pressureUnit = attributes?.pressure_unit || 'hPa';

	// Convert hPa → mmHg if needed
	$: pressureDisplay = pressure
		? pressureUnit === 'hPa'
			? `${Math.round(pressure * 0.75006)} мм`
			: `${Math.round(pressure)} ${pressureUnit}`
		: undefined;

	$: conditionKey = entity?.state?.replace(/-/g, '_');
	$: tempUnit = attributes?.temperature_unit || '°C';
</script>

{#if entity && entity?.state !== 'unavailable'}
	<div class="container">
		<!-- Icon -->
		<div class="icon">
			{#if src}
				<img {src} width="100%" height="100%" alt="" />
			{:else}
				<Icon icon="mdi:weather-partly-cloudy" height="none" width="none" />
			{/if}
		</div>

		<!-- Temperature -->
		{#if temperature !== undefined}
			<div class="temperature">
				{Math.round(temperature)}{tempUnit}
				{#if sel?.show_apparent && apparentTemp !== undefined}
					<span class="apparent">({Math.round(apparentTemp)}{tempUnit})</span>
				{/if}
			</div>
		{/if}

		<!-- Condition label -->
		<div class="state">
			<span>
				{$lang(`weather_${conditionKey}`) || conditionKey?.replace(/_/g, ' ') || entity?.state}
			</span>
		</div>

		<!-- Details row -->
		<div class="details">
			{#if humidity !== undefined}
				<span class="detail">
					<Icon icon="mdi:water-percent" height="11" width="11" />
					{Math.round(humidity)}%
				</span>
			{/if}
			{#if windSpeed !== undefined}
				<span class="detail">
					<Icon icon="mdi:weather-windy" height="11" width="11" />
					{Math.round(windSpeed)}&nbsp;{windSpeedUnit}
				</span>
			{/if}
			{#if sel?.show_pressure && pressureDisplay}
				<span class="detail">
					<Icon icon="mdi:gauge" height="11" width="11" />
					{pressureDisplay}
				</span>
			{/if}
		</div>
	</div>
{:else}
	<div class="empty">Яндекс Погода</div>
{/if}

<style>
	.empty {
		word-wrap: break-word;
		padding: 0.5em;
		overflow: hidden;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
	}

	.container {
		padding: var(--theme-sidebar-item-padding);
		display: grid;
		grid-template-columns: min-content auto;
		grid-template-rows: auto auto auto;
		grid-template-areas:
			'icon temperature'
			'icon state'
			'icon details';
		align-items: center;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		overflow: visible;
	}

	.icon {
		grid-area: icon;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: flex-start;
		scale: 1.2;
		transform-origin: right;
		margin-right: 0.4rem;
		margin-left: 0.1rem;
	}

	img {
		height: 100%;
	}

	.temperature {
		grid-area: temperature;
		justify-self: start;
		align-self: end;
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.apparent {
		font-size: 0.8em;
		color: rgba(255, 255, 255, 0.6);
	}

	.state {
		grid-area: state;
		justify-self: start;
		align-self: start;
		width: 100%;
		overflow: hidden;
		white-space: nowrap;
	}

	.state span {
		text-overflow: ellipsis;
		overflow: hidden;
		display: block;
	}

	.state span::first-letter {
		text-transform: uppercase;
	}

	.details {
		grid-area: details;
		display: flex;
		gap: 0.6rem;
		align-items: center;
		margin-top: 0.1rem;
		flex-wrap: wrap;
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		white-space: nowrap;
	}
</style>
