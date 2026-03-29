<script lang="ts">
	import { states, motion, editMode, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getDomain } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: name = sel?.name || 'Area';
	$: icon = sel?.icon || 'mdi:home-outline';
	$: entityIds = (sel?.entity_ids as string[]) || [];

	// Group entity_ids into domains
	$: entities = entityIds
		.map((id) => ({ id, entity: $states?.[id] }))
		.filter((e) => e.entity);

	$: lights = entities.filter((e) => getDomain(e.id) === 'light');
	$: switches = entities.filter((e) => ['switch', 'input_boolean'].includes(getDomain(e.id)));
	$: sensors = entities.filter((e) => ['sensor', 'binary_sensor'].includes(getDomain(e.id)));
	$: climate = entities.filter((e) => getDomain(e.id) === 'climate');

	$: lightsOn = lights.filter((e) => e.entity?.state === 'on').length;
	$: switchesOn = switches.filter((e) => e.entity?.state === 'on').length;
	$: tempSensor = sensors.find((e) => e.entity?.attributes?.unit_of_measurement?.includes('°'));
	$: temp = tempSensor?.entity?.state;
	$: tempUnit = tempSensor?.entity?.attributes?.unit_of_measurement || '°C';
	$: motionActive = sensors.find(
		(e) => getDomain(e.id) === 'binary_sensor' && e.entity?.state === 'on' &&
			e.entity?.attributes?.device_class === 'motion'
	);

	$: climateEntity = climate[0]?.entity;
	$: climateTemp = climateEntity?.attributes?.current_temperature;

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/ButtonConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="area-card"
	on:click={handleClick}
	use:Ripple={$ripple}
	style:transition="opacity {$motion}ms ease"
>
	<div class="area-header">
		<div class="area-icon">
			<Icon {icon} width="20" height="20" />
		</div>
		<span class="area-name">{name}</span>
		{#if motionActive}
			<span class="motion-badge" title="Motion detected">
				<Icon icon="mdi:motion-sensor" width="12" height="12" />
			</span>
		{/if}
	</div>

	<div class="area-stats">
		{#if lights.length > 0}
			<div class="stat" class:active={lightsOn > 0}>
				<Icon icon="mdi:lightbulb" width="14" height="14" />
				<span>{lightsOn}/{lights.length}</span>
			</div>
		{/if}

		{#if switches.length > 0}
			<div class="stat" class:active={switchesOn > 0}>
				<Icon icon="mdi:toggle-switch" width="14" height="14" />
				<span>{switchesOn}/{switches.length}</span>
			</div>
		{/if}

		{#if temp}
			<div class="stat active">
				<Icon icon="mdi:thermometer" width="14" height="14" />
				<span>{temp}{tempUnit}</span>
			</div>
		{:else if climateTemp}
			<div class="stat active">
				<Icon icon="mdi:thermometer" width="14" height="14" />
				<span>{climateTemp}°</span>
			</div>
		{/if}
	</div>

	{#if entityIds.length === 0}
		<div class="empty-hint">Configure entity_ids</div>
	{/if}
</div>

<style>
	.area-card {
		background: var(--theme-button-background-color-off, rgba(0, 0, 0, 0.2));
		border-radius: 0.65rem;
		padding: 0.9rem 1rem;
		cursor: default;
		height: 100%;
		min-height: 80px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.6rem;
		position: relative;
		overflow: hidden;
	}

	.area-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.area-icon {
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.7);
		flex-shrink: 0;
	}

	.area-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.motion-badge {
		color: #10b981;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.area-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 999px;
		padding: 0.2rem 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		transition: background 0.2s, color 0.2s;
	}

	.stat.active {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.85);
	}

	.empty-hint {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.25);
		font-style: italic;
	}
</style>
