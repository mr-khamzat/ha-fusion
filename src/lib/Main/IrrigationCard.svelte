<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_ids = (sel?.entity_ids as string[] | undefined) || [];
	$: cardName = sel?.name || 'Полив';

	interface Zone {
		entity_id: string;
		name: string;
		state: string;
		domain: string;
		isOn: boolean;
	}

	$: zones = entity_ids.map((eid): Zone => {
		const entity = $states?.[eid];
		const domain = eid.split('.')[0];
		const s = entity?.state || 'unknown';
		return {
			entity_id: eid,
			name: entity?.attributes?.friendly_name || getName(undefined, entity) || eid.split('.')[1]?.replace(/_/g, ' ') || eid,
			state: s,
			domain,
			isOn: s === 'on'
		};
	});

	$: activeCount = zones.filter((z) => z.isOn).length;

	function toggleZone(zone: Zone) {
		if (!$connection) return;
		const service = zone.isOn ? 'turn_off' : 'turn_on';
		callService($connection, zone.domain, service, { entity_id: zone.entity_id });
	}

	function turnOffAll() {
		if (!$connection) return;
		zones
			.filter((z) => z.isOn)
			.forEach((z) => {
				callService($connection, z.domain, 'turn_off', { entity_id: z.entity_id });
			});
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/IrrigationConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="irrigation-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	<div class="irr-header">
		<div class="irr-icon-wrap" class:irr-active={activeCount > 0}>
			<Icon icon="mdi:sprinkler" height="18" width="18" />
		</div>
		<div class="irr-title-block">
			<span class="irr-title">{cardName}</span>
			<span class="irr-subtitle">
				{#if activeCount > 0}
					<span class="active-badge">{activeCount} активно</span>
				{:else}
					<span class="idle-text">Все выключены</span>
				{/if}
			</span>
		</div>
	</div>

	{#if entity_ids.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:sprinkler-variant" height="22" width="22" style="opacity:0.25" />
			<span>Нет зон</span>
		</div>
	{:else}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="zones-list" on:click|stopPropagation>
			{#each zones as zone}
				<div class="zone-row" class:zone-on={zone.isOn}>
					{#if zone.isOn}
						<span class="pulse-dot"></span>
					{:else}
						<span class="idle-dot"></span>
					{/if}
					<span class="zone-name">{zone.name}</span>
					<button
						class="zone-btn"
						class:zone-btn-on={zone.isOn}
						on:click={() => toggleZone(zone)}
						use:Ripple={$ripple}
						aria-label={zone.isOn ? 'Turn off' : 'Turn on'}
					>
						<Icon icon={zone.isOn ? 'mdi:stop-circle-outline' : 'mdi:play-circle-outline'} height="15" width="15" />
					</button>
				</div>
			{/each}
		</div>

		{#if activeCount > 0 && !$editMode}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div on:click|stopPropagation>
				<button class="turn-off-all" on:click={turnOffAll} use:Ripple={$ripple}>
					<Icon icon="mdi:stop" height="13" width="13" />
					Выключить все
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.irrigation-card {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
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

	.irr-header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.irr-icon-wrap {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.07);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: rgba(255, 255, 255, 0.4);
		transition:
			background 0.3s,
			color 0.3s;
	}

	.irr-active {
		background: rgba(96, 165, 250, 0.15);
		color: rgba(96, 165, 250, 0.9);
	}

	.irr-title-block {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.irr-title {
		font-size: 0.88rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
	}

	.irr-subtitle {
		font-size: 0.72rem;
	}

	.active-badge {
		color: rgba(96, 165, 250, 0.9);
		font-weight: 500;
	}

	.idle-text {
		color: rgba(255, 255, 255, 0.35);
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

	.zones-list {
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
	}

	.zone-row {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.3rem 0.45rem;
		border-radius: 0.4rem;
		background: rgba(255, 255, 255, 0.03);
		transition: background 0.2s;
	}

	.zone-on {
		background: rgba(96, 165, 250, 0.08);
	}

	.pulse-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: rgba(96, 165, 250, 0.9);
		flex-shrink: 0;
		animation: pulse-zone 1.4s ease-in-out infinite;
	}

	.idle-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.18);
		flex-shrink: 0;
	}

	@keyframes pulse-zone {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.45;
			transform: scale(0.75);
		}
	}

	.zone-name {
		flex: 1;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.zone-btn {
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 0.35rem;
		border: none;
		background: rgba(255, 255, 255, 0.07);
		cursor: pointer;
		color: rgba(255, 255, 255, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background 0.15s,
			color 0.15s;
		font-family: inherit;
	}

	.zone-btn:hover {
		background: rgba(255, 255, 255, 0.13);
		color: rgba(255, 255, 255, 0.85);
	}

	.zone-btn-on {
		background: rgba(96, 165, 250, 0.18);
		color: rgba(96, 165, 250, 0.9);
	}

	.zone-btn-on:hover {
		background: rgba(96, 165, 250, 0.28);
	}

	.turn-off-all {
		width: 100%;
		padding: 0.35rem 0.7rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.2);
		border-radius: 0.4rem;
		cursor: pointer;
		color: rgba(248, 113, 113, 0.85);
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		transition:
			background 0.15s,
			color 0.15s;
		font-family: inherit;
	}

	.turn-off-all:hover {
		background: rgba(248, 113, 113, 0.18);
		color: rgba(248, 113, 113, 1);
	}
</style>
