<script lang="ts">
	import { states } from '$lib/Stores';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: solarId = sel?.solar_entity;
	$: gridId = sel?.grid_entity;
	$: homeId = sel?.home_entity;

	$: solarW = parseFloat($states?.[solarId]?.state || '0') || 0;
	$: gridW = parseFloat($states?.[gridId]?.state || '0') || 0;
	$: homeW = parseFloat($states?.[homeId]?.state || '0') || 0;

	function fmt(w: number) {
		if (Math.abs(w) >= 1000) return (w / 1000).toFixed(1) + ' kW';
		return Math.round(w) + ' W';
	}

	// Flow directions: positive gridW = exporting, negative = importing
	$: exporting = gridW > 0;
	$: gridLabel = exporting ? 'Export' : 'Import';
	$: gridColor = exporting ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)';
	$: solarColor = solarW > 0 ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.2)';
</script>

<div class="solar-widget">
	{#if !solarId && !gridId}
		<div class="empty">
			<Icon icon="mdi:solar-power" height="18" width="18" style="opacity:0.3" />
			<span>Configure Solar</span>
		</div>
	{:else}
		<div class="flow-diagram">
			<!-- Solar -->
			<div class="node solar">
				<Icon icon="mdi:solar-panel" height="16" width="16" style="color:{solarColor}" />
				<span class="node-val" style:color={solarColor}>{fmt(solarW)}</span>
				<span class="node-label">Solar</span>
			</div>

			<!-- Arrow solar → home -->
			<div class="arrow">
				<Icon icon="mdi:arrow-right" height="12" width="12" style="opacity:0.4" />
			</div>

			<!-- Home -->
			<div class="node home">
				<Icon icon="mdi:home-lightning-bolt" height="16" width="16" style="color:rgba(147,197,253,0.8)" />
				<span class="node-val" style:color="rgba(147,197,253,0.9)">{fmt(homeW)}</span>
				<span class="node-label">Home</span>
			</div>

			<!-- Arrow home → grid -->
			<div class="arrow">
				<Icon
					icon={exporting ? 'mdi:arrow-right' : 'mdi:arrow-left'}
					height="12"
					width="12"
					style="color:{gridColor};opacity:0.7"
				/>
			</div>

			<!-- Grid -->
			<div class="node grid">
				<Icon icon="mdi:transmission-tower" height="16" width="16" style="color:{gridColor}" />
				<span class="node-val" style:color={gridColor}>{fmt(Math.abs(gridW))}</span>
				<span class="node-label" style:color={gridColor}>{gridLabel}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.solar-widget {
		padding: var(--theme-sidebar-item-padding);
	}

	.empty {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.flow-diagram {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		justify-content: space-between;
	}

	.node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		flex-shrink: 0;
	}

	.node-val {
		font-size: 0.72rem;
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
	}

	.node-label {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.arrow {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
