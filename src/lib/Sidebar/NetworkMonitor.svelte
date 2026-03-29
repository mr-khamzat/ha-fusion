<script lang="ts">
	import { states, editMode } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: ping_entity_id = sel?.ping_entity_id;
	$: speed_down_entity_id = sel?.speed_down_entity_id;
	$: speed_up_entity_id = sel?.speed_up_entity_id;
	$: devices_entity_id = sel?.devices_entity_id;
	$: widgetName = sel?.name || 'Сеть';

	$: pingEntity = ping_entity_id ? $states?.[ping_entity_id] : undefined;
	$: speedDownEntity = speed_down_entity_id ? $states?.[speed_down_entity_id] : undefined;
	$: speedUpEntity = speed_up_entity_id ? $states?.[speed_up_entity_id] : undefined;
	$: devicesEntity = devices_entity_id ? $states?.[devices_entity_id] : undefined;

	$: pingVal = pingEntity?.state ? parseFloat(pingEntity.state) : null;
	$: pingUnit = pingEntity?.attributes?.unit_of_measurement || 'ms';
	$: speedDownVal = speedDownEntity?.state ? parseFloat(speedDownEntity.state) : null;
	$: speedDownUnit = speedDownEntity?.attributes?.unit_of_measurement || 'Mbps';
	$: speedUpVal = speedUpEntity?.state ? parseFloat(speedUpEntity.state) : null;
	$: speedUpUnit = speedUpEntity?.attributes?.unit_of_measurement || 'Mbps';
	$: devicesVal = devicesEntity?.state ? parseInt(devicesEntity.state) : null;

	$: isOnline = pingVal != null && !isNaN(pingVal) && pingVal < 200;
	$: hasAnyData = ping_entity_id || speed_down_entity_id || speed_up_entity_id || devices_entity_id;

	function pingColor(ms: number): string {
		if (ms < 50) return 'rgba(52,211,153,0.9)';
		if (ms < 100) return 'rgba(251,191,36,0.9)';
		return 'rgba(248,113,113,0.9)';
	}

	function fmtSpeed(val: number | null): string {
		if (val == null || isNaN(val)) return '—';
		return val >= 100 ? String(Math.round(val)) : String(Math.round(val * 10) / 10);
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/NetworkMonitorConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="network-widget"
	on:click={handleEdit}
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	<div class="net-header">
		<Icon icon="mdi:wifi" height="13" width="13" style="opacity:0.5" />
		<span>{widgetName}</span>
		{#if ping_entity_id}
			<span class="status-badge" class:status-online={isOnline} class:status-offline={!isOnline}>
				{isOnline ? 'Онлайн' : 'Оффлайн'}
			</span>
		{/if}
	</div>

	{#if !hasAnyData}
		<div class="empty">
			<Icon icon="mdi:wifi-off" height="14" width="14" style="opacity:0.3" />
			<span>Не настроено</span>
		</div>
	{:else}
		<div class="net-rows">
			{#if pingVal != null && !isNaN(pingVal)}
				<div class="net-row">
					<Icon icon="mdi:timer-outline" height="12" width="12" style="opacity:0.45;flex-shrink:0" />
					<span class="net-label">Пинг</span>
					<span class="net-val ping-badge" style:background="color-mix(in srgb, {pingColor(pingVal)} 15%, transparent)" style:color={pingColor(pingVal)}>
						{Math.round(pingVal)} {pingUnit}
					</span>
				</div>
			{/if}

			{#if speedDownVal != null && !isNaN(speedDownVal)}
				<div class="net-row">
					<Icon icon="mdi:arrow-down-circle-outline" height="12" width="12" style="opacity:0.45;flex-shrink:0;color:rgba(96,165,250,0.8)" />
					<span class="net-label">Загрузка</span>
					<span class="net-val" style:color="rgba(96,165,250,0.85)">
						{fmtSpeed(speedDownVal)} {speedDownUnit}
					</span>
				</div>
			{/if}

			{#if speedUpVal != null && !isNaN(speedUpVal)}
				<div class="net-row">
					<Icon icon="mdi:arrow-up-circle-outline" height="12" width="12" style="opacity:0.45;flex-shrink:0;color:rgba(52,211,153,0.8)" />
					<span class="net-label">Отдача</span>
					<span class="net-val" style:color="rgba(52,211,153,0.85)">
						{fmtSpeed(speedUpVal)} {speedUpUnit}
					</span>
				</div>
			{/if}

			{#if devicesVal != null && !isNaN(devicesVal)}
				<div class="net-row">
					<Icon icon="mdi:devices" height="12" width="12" style="opacity:0.45;flex-shrink:0" />
					<span class="net-label">Устройства</span>
					<span class="net-val">{devicesVal}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.network-widget {
		padding: var(--theme-sidebar-item-padding);
	}

	.net-header {
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

	.status-badge {
		margin-left: auto;
		text-transform: none;
		letter-spacing: 0;
		font-size: 0.65rem;
		font-weight: 500;
		padding: 0.05rem 0.35rem;
		border-radius: 0.25rem;
	}

	.status-online {
		color: rgba(52, 211, 153, 0.9);
		background: rgba(52, 211, 153, 0.1);
	}

	.status-offline {
		color: rgba(248, 113, 113, 0.9);
		background: rgba(248, 113, 113, 0.1);
	}

	.empty {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.net-rows {
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
	}

	.net-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
	}

	.net-label {
		flex: 1;
		color: rgba(255, 255, 255, 0.55);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.net-val {
		font-variant-numeric: tabular-nums;
		color: rgba(255, 255, 255, 0.75);
		text-align: right;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.ping-badge {
		padding: 0.05rem 0.35rem;
		border-radius: 0.25rem;
		font-size: 0.68rem;
	}
</style>
