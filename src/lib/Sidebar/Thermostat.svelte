<script lang="ts">
	import { states, connection } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: state = entity?.state;
	$: attrs = entity?.attributes || {};

	$: currentTemp = attrs.current_temperature;
	$: targetTemp = attrs.temperature;
	$: minTemp = attrs.min_temp ?? 7;
	$: maxTemp = attrs.max_temp ?? 35;
	$: unit = attrs.unit_of_measurement || '°';
	$: hvacMode = state || 'off';
	$: displayName = sel?.name || getName(undefined, entity) || entity_id || 'Thermostat';

	const modeColors: Record<string, string> = {
		heat: 'rgba(251,146,60,0.9)',
		cool: 'rgba(96,165,250,0.9)',
		heat_cool: 'rgba(167,139,250,0.9)',
		auto: 'rgba(52,211,153,0.9)',
		dry: 'rgba(251,191,36,0.9)',
		fan_only: 'rgba(147,197,253,0.9)',
		off: 'rgba(255,255,255,0.3)'
	};

	$: modeColor = modeColors[hvacMode] || 'rgba(255,255,255,0.3)';

	function step(delta: number) {
		if (!entity_id || !$connection) return;
		const newTemp = Math.min(Math.max((targetTemp ?? minTemp) + delta, minTemp), maxTemp);
		callService($connection, 'climate', 'set_temperature', {
			entity_id,
			temperature: Math.round(newTemp * 2) / 2
		});
	}
</script>

<div class="thermo-widget">
	{#if !entity_id}
		<div class="empty">
			<Icon icon="mdi:thermostat" height="18" width="18" style="opacity:0.3" />
		</div>
	{:else}
		<div class="thermo-row">
			<div class="thermo-left">
				<span class="current-temp">
					{currentTemp != null ? currentTemp + unit : '—'}
				</span>
				<span class="mode-label" style:color={modeColor}>{hvacMode}</span>
			</div>
			<div class="thermo-center">
				<Icon icon="mdi:thermostat" height="20" width="20" style="color:{modeColor}" />
			</div>
			<div class="thermo-right">
				<button class="temp-btn" on:click={() => step(0.5)}>
					<Icon icon="mdi:chevron-up" height="14" width="14" />
				</button>
				<span class="target-temp">{targetTemp != null ? targetTemp + unit : '—'}</span>
				<button class="temp-btn" on:click={() => step(-0.5)}>
					<Icon icon="mdi:chevron-down" height="14" width="14" />
				</button>
			</div>
		</div>
		<div class="thermo-name">{displayName}</div>
	{/if}
</div>

<style>
	.thermo-widget {
		padding: var(--theme-sidebar-item-padding);
	}

	.empty {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.thermo-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.thermo-left {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.current-temp {
		font-size: 1.3rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1;
	}

	.mode-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.thermo-center {
		flex-shrink: 0;
	}

	.thermo-right {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.05rem;
	}

	.target-temp {
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.75);
		line-height: 1;
	}

	.temp-btn {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.5);
		padding: 0;
		transition: background 0.15s;
	}

	.temp-btn:hover {
		background: rgba(255, 255, 255, 0.18);
		color: white;
	}

	.thermo-name {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.3);
		margin-top: 0.2rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
