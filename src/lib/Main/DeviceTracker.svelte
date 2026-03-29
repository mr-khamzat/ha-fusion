<script lang="ts">
	import { states, editMode, motion, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: configuredIds = (sel?.entity_ids as string[]) || [];

	$: allDevices = configuredIds.length > 0
		? configuredIds.map(id => $states?.[id]).filter(Boolean)
		: Object.values($states ?? {}).filter(e => e.entity_id.startsWith('device_tracker.'));

	$: devices = allDevices.map(e => ({
		entity_id: e.entity_id,
		name: (e.attributes?.friendly_name as string) || e.entity_id.split('.')[1],
		state: e.state,
		isHome: e.state === 'home',
		ip: e.attributes?.ip as string | undefined,
		source_type: e.attributes?.source_type as string | undefined,
		entityPicture: e.attributes?.entity_picture as string | undefined
	}));

	$: homeCount = devices.filter(d => d.isHome).length;

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/DeviceTrackerConfig.svelte'), { sel });
		}
	}

	function deviceIcon(d: typeof devices[0]) {
		if (d.source_type === 'router') return 'mdi:router-wireless';
		if (d.source_type === 'bluetooth') return 'mdi:bluetooth';
		if (d.source_type === 'gps') return 'mdi:crosshairs-gps';
		return 'mdi:devices';
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="tracker-card"
	on:click={handleEdit}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.03)' }}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	<div class="card-header">
		<div class="header-left">
			<Icon icon="mdi:network-outline" height="14" width="14" />
			<span class="card-title">{sel?.name || 'Devices'}</span>
		</div>
		<span class="home-badge" class:all-away={homeCount === 0}>
			{homeCount}/{devices.length} home
		</span>
	</div>

	{#if devices.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:devices" height="22" width="22" style="opacity:0.3" />
			<span>No device trackers</span>
		</div>
	{:else}
		<div class="device-list">
			{#each devices.slice(0, sel?.max_devices || 8) as device (device.entity_id)}
				<div class="device-row">
					<div class="device-dot" class:home={device.isHome}></div>
					<div class="device-icon">
						<Icon icon={deviceIcon(device)} height="14" width="14" />
					</div>
					<span class="device-name">{device.name}</span>
					{#if device.ip}
						<span class="device-ip">{device.ip}</span>
					{/if}
					<span class="device-state" class:home={device.isHome}>
						{device.isHome ? 'home' : device.state}
					</span>
				</div>
			{/each}
			{#if devices.length > (sel?.max_devices || 8)}
				<div class="more-label">+{devices.length - (sel?.max_devices || 8)} more</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tracker-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.45);
		font-weight: 500;
	}

	.card-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.home-badge {
		font-size: 0.7rem;
		font-weight: 600;
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		white-space: nowrap;
	}

	.home-badge.all-away {
		color: rgba(255, 255, 255, 0.35);
		background: rgba(255, 255, 255, 0.06);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.78rem;
	}

	.device-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.device-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
	}

	.device-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
		transition: background 0.3s;
	}

	.device-dot.home {
		background: #10b981;
	}

	.device-icon {
		color: rgba(255, 255, 255, 0.35);
		flex-shrink: 0;
		display: flex;
	}

	.device-name {
		flex: 1;
		color: rgba(255, 255, 255, 0.75);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.device-ip {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.25);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.device-state {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.25);
		flex-shrink: 0;
	}

	.device-state.home {
		color: rgba(16, 185, 129, 0.8);
	}

	.more-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.25);
		text-align: center;
		padding-top: 0.15rem;
	}
</style>
