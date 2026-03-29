<script lang="ts">
	import { states, editMode, motion, ripple, selectedLanguage } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: sensors = (sel?.entity_ids as string[]) || [];

	$: items = sensors.map((id) => {
		const e = $states?.[id];
		if (!e) return { id, name: id, value: '—', unit: '', icon: 'mdi:help-circle-outline' };
		const attrs = e.attributes || {};
		const val = parseFloat(e.state);
		return {
			id,
			name: getName(undefined, e) || id,
			value: isNaN(val)
				? e.state
				: Intl.NumberFormat($selectedLanguage, { maximumFractionDigits: 1 }).format(val),
			unit: attrs.unit_of_measurement || '',
			icon: attrs.icon || iconForClass(attrs.device_class || '')
		};
	});

	function iconForClass(dc: string): string {
		const map: Record<string, string> = {
			temperature: 'mdi:thermometer',
			humidity: 'mdi:water-percent',
			pressure: 'mdi:gauge',
			illuminance: 'mdi:brightness-5',
			power: 'mdi:lightning-bolt',
			energy: 'mdi:lightning-bolt-circle',
			voltage: 'mdi:sine-wave',
			current: 'mdi:current-ac',
			battery: 'mdi:battery',
			co2: 'mdi:molecule-co2',
			pm25: 'mdi:air-filter',
			speed: 'mdi:speedometer',
			moisture: 'mdi:water',
			signal_strength: 'mdi:wifi'
		};
		return map[dc] || 'mdi:gauge';
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/SensorGridConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="grid-card"
	on:click={handleEdit}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.03)' }}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if sensors.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:view-grid-outline" height="28" width="28" style="opacity:0.3" />
			<span>Configure Sensor Grid</span>
		</div>
	{:else}
		{#if sel?.title}
			<div class="grid-title">{sel.title}</div>
		{/if}
		<div class="sensor-grid" style:grid-template-columns="repeat({Math.min(Math.ceil(items.length / 2), 3)}, 1fr)">
			{#each items as item}
				<div class="sensor-cell">
					<Icon icon={item.icon} height="14" width="14" style="color:rgba(147,197,253,0.7);flex-shrink:0" />
					<span class="cell-val">{item.value}<span class="cell-unit">{item.unit}</span></span>
					<span class="cell-name">{item.name}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.grid-card {
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

	.grid-title {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.sensor-grid {
		display: grid;
		gap: 0.5rem;
		flex: 1;
	}

	.sensor-cell {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 0.4rem;
		padding: 0.4rem 0.5rem;
		min-width: 0;
	}

	.cell-val {
		font-size: 1rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cell-unit {
		font-size: 0.62rem;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 400;
		margin-left: 0.1rem;
	}

	.cell-name {
		font-size: 0.62rem;
		color: rgba(255, 255, 255, 0.35);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
