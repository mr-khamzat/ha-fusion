<script lang="ts">
	import { states } from '$lib/Stores';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: threshold = sel?.threshold ?? 20;
	$: maxItems = sel?.max_items ?? 8;
	$: showAll = sel?.show_all !== false;

	$: batteries = Object.values($states ?? {})
		.filter(e => e.attributes?.device_class === 'battery' && !isNaN(parseFloat(e.state)))
		.map(e => ({
			entity_id: e.entity_id,
			name: e.attributes?.friendly_name || e.entity_id.split('.')[1]?.replace(/_/g, ' '),
			level: Math.min(100, Math.max(0, Math.round(parseFloat(e.state))))
		}))
		.filter(b => showAll || b.level <= threshold)
		.sort((a, b) => a.level - b.level)
		.slice(0, maxItems);

	function batteryIcon(level: number): string {
		if (level >= 90) return 'mdi:battery';
		if (level >= 70) return 'mdi:battery-80';
		if (level >= 50) return 'mdi:battery-60';
		if (level >= 30) return 'mdi:battery-40';
		if (level >= 15) return 'mdi:battery-20';
		return 'mdi:battery-alert';
	}

	function batteryColor(level: number): string {
		if (level >= 50) return 'rgba(52,211,153,0.8)';
		if (level >= 20) return 'rgba(251,191,36,0.9)';
		return 'rgba(248,113,113,0.9)';
	}
</script>

<div class="battery-widget">
	<div class="batt-header">
		<Icon icon="mdi:battery-heart-outline" height="13" width="13" style="opacity:0.5" />
		<span>Batteries</span>
	</div>

	{#if batteries.length === 0}
		<div class="empty">
			<Icon icon="mdi:battery-check" height="14" width="14" style="opacity:0.3" />
			<span>{showAll ? 'No batteries found' : 'All charged'}</span>
		</div>
	{:else}
		<div class="batt-list">
			{#each batteries as b}
				<div class="batt-row">
					<Icon icon={batteryIcon(b.level)} height="13" width="13" style="color:{batteryColor(b.level)};flex-shrink:0" />
					<span class="batt-name">{b.name}</span>
					<div class="batt-bar-wrap">
						<div class="batt-bar" style:width="{b.level}%" style:background={batteryColor(b.level)}></div>
					</div>
					<span class="batt-pct" style:color={batteryColor(b.level)}>{b.level}%</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.battery-widget {
		padding: var(--theme-sidebar-item-padding);
	}

	.batt-header {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
		margin-bottom: 0.4rem;
	}

	.empty {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.batt-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.batt-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
	}

	.batt-name {
		flex: 1;
		color: rgba(255, 255, 255, 0.65);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.batt-bar-wrap {
		width: 3rem;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.batt-bar {
		height: 100%;
		border-radius: 2px;
		transition: width 0.4s ease;
		max-width: 100%;
	}

	.batt-pct {
		font-size: 0.65rem;
		font-variant-numeric: tabular-nums;
		width: 2.2rem;
		text-align: right;
		flex-shrink: 0;
	}
</style>
