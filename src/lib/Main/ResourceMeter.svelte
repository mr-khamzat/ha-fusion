<script lang="ts">
	import { states, editMode, motion } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';

	export let sel: any;

	type ResourceType = 'water' | 'gas' | 'electricity';

	$: entity_id = sel?.entity_id;
	$: entity_id_daily = sel?.entity_id_daily;
	$: entity_id_monthly = sel?.entity_id_monthly;
	$: cardName = sel?.name || getName(undefined, $states?.[entity_id]) || entity_id || 'Meter';
	$: unit = sel?.unit || $states?.[entity_id]?.attributes?.unit_of_measurement || '';
	$: resourceType = (sel?.resource_type as ResourceType) || 'electricity';

	$: mainEntity = $states?.[entity_id];
	$: dailyEntity = entity_id_daily ? $states?.[entity_id_daily] : undefined;
	$: monthlyEntity = entity_id_monthly ? $states?.[entity_id_monthly] : undefined;

	$: mainVal = mainEntity?.state ? parseFloat(mainEntity.state) : null;
	$: dailyVal = dailyEntity?.state ? parseFloat(dailyEntity.state) : null;
	$: monthlyVal = monthlyEntity?.state ? parseFloat(monthlyEntity.state) : null;

	function fmtVal(v: number | null, u: string): string {
		if (v == null || isNaN(v)) return '—';
		const rounded = v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
		return `${rounded} ${u}`.trim();
	}

	const resourceConfig: Record<ResourceType, { icon: string; color: string; monthlyMax: number }> =
		{
			water: {
				icon: 'mdi:water',
				color: 'rgba(147,197,253,0.9)',
				monthlyMax: 20
			},
			gas: {
				icon: 'mdi:gas-cylinder',
				color: 'rgba(251,191,36,0.9)',
				monthlyMax: 50
			},
			electricity: {
				icon: 'mdi:lightning-bolt',
				color: 'rgba(52,211,153,0.9)',
				monthlyMax: 200
			}
		};

	$: cfg = resourceConfig[resourceType] || resourceConfig.electricity;

	$: monthlyPct =
		monthlyVal != null && !isNaN(monthlyVal)
			? Math.min(100, Math.round((monthlyVal / cfg.monthlyMax) * 100))
			: 0;

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/ResourceMeterConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="resource-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:gauge" height="28" width="28" style="opacity:0.3" />
			<span>Настроить счётчик</span>
		</div>
	{:else}
		<div class="resource-top">
			<div class="resource-icon-wrap" style:color={cfg.color} style:background="rgba(255,255,255,0.06)">
				<Icon icon={cfg.icon} height="20" width="20" />
			</div>
			<span class="resource-name">{cardName}</span>
		</div>

		<div class="main-value" style:color={cfg.color}>
			{fmtVal(mainVal, unit)}
		</div>

		<div class="sub-row">
			{#if dailyVal != null}
				<div class="sub-item">
					<span class="sub-label">сегодня</span>
					<span class="sub-val">{fmtVal(dailyVal, unit)}</span>
				</div>
			{/if}
			{#if monthlyVal != null}
				<div class="sub-item">
					<span class="sub-label">месяц</span>
					<span class="sub-val">{fmtVal(monthlyVal, unit)}</span>
				</div>
			{/if}
		</div>

		{#if monthlyEntity && monthlyVal != null}
			<div class="progress-wrap">
				<div
					class="progress-fill"
					style:width="{monthlyPct}%"
					style:background={cfg.color}
				></div>
			</div>
			<span class="progress-label">{monthlyPct}% от лимита месяца</span>
		{/if}
	{/if}
</div>

<style>
	.resource-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
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

	.resource-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.resource-icon-wrap {
		width: 2rem;
		height: 2rem;
		border-radius: 0.45rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.resource-name {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.55);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.main-value {
		font-size: 1.65rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.sub-row {
		display: flex;
		gap: 1rem;
	}

	.sub-item {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}

	.sub-label {
		font-size: 0.62rem;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.sub-val {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.7);
		font-variant-numeric: tabular-nums;
	}

	.progress-wrap {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
		margin-top: 0.1rem;
	}

	.progress-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.5s ease;
		max-width: 100%;
		opacity: 0.75;
	}

	.progress-label {
		font-size: 0.62rem;
		color: rgba(255, 255, 255, 0.3);
		margin-top: -0.15rem;
	}
</style>
