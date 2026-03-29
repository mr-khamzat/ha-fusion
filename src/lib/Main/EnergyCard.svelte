<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: powerEntity = sel?.power_entity && $states?.[sel.power_entity];
	$: energyEntity = sel?.energy_entity && $states?.[sel.energy_entity];
	$: solarEntity = sel?.solar_entity && $states?.[sel.solar_entity];

	$: powerVal = parseFloat(powerEntity?.state) || 0;
	$: energyVal = parseFloat(energyEntity?.state) || 0;
	$: solarVal = parseFloat(solarEntity?.state) || 0;

	$: powerUnit = powerEntity?.attributes?.unit_of_measurement || 'W';
	$: energyUnit = energyEntity?.attributes?.unit_of_measurement || 'kWh';
	$: solarUnit = solarEntity?.attributes?.unit_of_measurement || 'W';

	$: powerDisplay =
		powerUnit === 'W' && powerVal >= 1000
			? `${(powerVal / 1000).toFixed(2)} kW`
			: `${powerVal.toFixed(powerVal < 10 ? 2 : 0)} ${powerUnit}`;

	$: solarDisplay =
		solarUnit === 'W' && solarVal >= 1000
			? `${(solarVal / 1000).toFixed(2)} kW`
			: `${solarVal.toFixed(solarVal < 10 ? 2 : 0)} ${solarUnit}`;

	// self-sufficiency when solar is configured
	$: selfSufficiency =
		solarEntity && powerVal > 0
			? Math.min(100, Math.round((solarVal / powerVal) * 100))
			: undefined;

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EnergyCardConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="energy-card"
	on:click={handleClick}
	use:Ripple={$ripple}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !sel?.power_entity}
		<div class="empty-state">
			<Icon icon="mdi:lightning-bolt" height="28" width="28" style="opacity:0.3" />
			<span>Configure Energy</span>
		</div>
	{:else}
		<!-- Header -->
		<div class="card-header">
			<Icon icon="mdi:lightning-bolt" height="16" width="16" style="color:rgba(251,191,36,0.8)" />
			<span class="card-title">{sel?.name || 'Energy'}</span>
		</div>

		<!-- Main power value -->
		<div class="main-value">
			<span class="power-number">{powerDisplay}</span>
			<span class="power-label">now</span>
		</div>

		<!-- Details row -->
		<div class="details-row">
			{#if energyEntity}
				<div class="detail">
					<Icon icon="mdi:chart-bar" height="13" width="13" />
					<span>{energyVal.toFixed(2)} {energyUnit}</span>
					<span class="detail-label">today</span>
				</div>
			{/if}

			{#if solarEntity}
				<div class="detail solar">
					<Icon icon="mdi:solar-power" height="13" width="13" />
					<span>{solarDisplay}</span>
					{#if selfSufficiency !== undefined}
						<span class="badge">{selfSufficiency}%</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Solar bar -->
		{#if solarEntity && powerVal > 0}
			<div class="solar-bar-track">
				<div
					class="solar-bar-fill"
					style:width="{Math.min(100, (solarVal / powerVal) * 100)}%"
				></div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.energy-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
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

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.45);
		font-weight: 500;
	}

	.card-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.main-value {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	.power-number {
		font-size: 1.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.power-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.35);
		align-self: flex-end;
		padding-bottom: 0.15rem;
	}

	.details-row {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.detail.solar {
		color: rgba(251, 191, 36, 0.75);
	}

	.detail-label {
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.72rem;
	}

	.badge {
		background: rgba(251, 191, 36, 0.15);
		color: rgba(251, 191, 36, 0.9);
		border-radius: 999px;
		padding: 0.05rem 0.35rem;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.solar-bar-track {
		height: 3px;
		background: rgba(255, 255, 255, 0.07);
		border-radius: 2px;
		margin-top: auto;
	}

	.solar-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, rgba(251, 191, 36, 0.6), rgba(251, 191, 36, 0.9));
		border-radius: 2px;
		transition: width 0.5s ease;
	}
</style>
