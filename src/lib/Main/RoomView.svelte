<script lang="ts">
	import { states, connection, editMode, ripple, motion } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: areaId = sel?.area_id as string | undefined;
	$: manualIds = sel?.entity_ids as string[] | undefined;

	// Collect all entity IDs to work with: prefer manual list, fall back to area-based filter
	$: allIds = manualIds && manualIds.length > 0
		? manualIds
		: areaId
			? Object.keys($states).filter((id) => $states[id]?.area_id === areaId)
			: [];

	$: lights = allIds
		.filter((id) => id.startsWith('light.'))
		.map((id) => $states[id])
		.filter(Boolean);

	$: lightsOn = lights.filter((l) => l.state === 'on').length;
	$: lightsTotal = lights.length;

	// Temperature: prefer explicit sel.temp_entity, else auto-find in area
	$: tempEntity = sel?.temp_entity
		? $states[sel.temp_entity]
		: allIds
				.filter((id) => id.startsWith('sensor.'))
				.map((id) => $states[id])
				.find((e) => e?.attributes?.device_class === 'temperature');

	$: tempValue = tempEntity?.state && tempEntity.state !== 'unavailable' && tempEntity.state !== 'unknown'
		? Number(tempEntity.state).toFixed(1)
		: null;

	// Motion: first binary_sensor with device_class=motion that is 'on'
	$: motionEntity = allIds
		.filter((id) => id.startsWith('binary_sensor.'))
		.map((id) => $states[id])
		.find((e) => e?.attributes?.device_class === 'motion');

	$: motionActive = motionEntity?.state === 'on';

	// Door/window sensors
	$: doorWindowEntities = allIds
		.filter((id) => id.startsWith('binary_sensor.'))
		.map((id) => $states[id])
		.filter((e) => e?.attributes?.device_class === 'door' || e?.attributes?.device_class === 'window');

	$: openCount = doorWindowEntities.filter((e) => e?.state === 'on').length;

	function toggleLight(entity_id: string) {
		const entity = $states[entity_id];
		if (!entity) return;
		callService($connection, 'light', entity.state === 'on' ? 'turn_off' : 'turn_on', { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(20);
	}

	function getLightLabel(entity: any): string {
		const name: string = entity?.attributes?.friendly_name ?? entity?.entity_id ?? '';
		const parts = name.split(' ');
		return parts[parts.length - 1] || name;
	}

	function handleCardClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/RoomViewConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="room-card"
	class:edit={$editMode}
	on:click={handleCardClick}
	style:--lights-on={lightsOn}
	style:--lights-total={lightsTotal}
	style:transition="background {$motion}ms ease"
>
	<!-- Header -->
	<div class="room-header">
		<span class="room-name">{sel?.name || 'Комната'}</span>
		<div class="room-stats">
			{#if tempValue !== null}
				<span class="stat">
					<Icon icon="mdi:thermometer" height="14" width="14" />
					{tempValue}°
				</span>
			{/if}
			{#if motionActive}
				<span class="stat motion-on">
					<Icon icon="mdi:motion-sensor" height="14" width="14" />
					Движение
				</span>
			{/if}
			{#if doorWindowEntities.length > 0}
				<span class="stat" class:open={openCount > 0}>
					<Icon icon={openCount > 0 ? 'mdi:door-open' : 'mdi:door-closed'} height="14" width="14" />
					{#if openCount > 0}{openCount} откр.{:else}Закрыто{/if}
				</span>
			{/if}
		</div>
	</div>

	<!-- Lights grid -->
	{#if lights.length > 0}
		<div class="lights-grid">
			{#each lights as light (light?.entity_id)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button
					class="light-btn"
					class:on={light?.state === 'on'}
					on:click|stopPropagation={() => toggleLight(light?.entity_id)}
					use:Ripple={$ripple}
					title={light?.attributes?.friendly_name ?? light?.entity_id}
				>
					<Icon
						icon={light?.state === 'on' ? 'mdi:lightbulb' : 'mdi:lightbulb-outline'}
						height="18"
						width="18"
					/>
					<span class="light-label">{getLightLabel(light)}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if lights.length === 0 && !$editMode}
		<div class="empty">Настройте комнату</div>
	{/if}

	{#if lights.length === 0 && $editMode}
		<div class="empty edit-hint">Нажмите для настройки</div>
	{/if}
</div>

<style>
	.room-card {
		background: rgba(
			255,
			calc(180 * var(--lights-on, 0) / max(var(--lights-total, 1), 1)),
			0,
			calc(0.08 + 0.12 * var(--lights-on, 0) / max(var(--lights-total, 1), 1))
		);
		border-radius: 0.65rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.07);
		cursor: default;
		box-sizing: border-box;
	}

	.room-card.edit {
		cursor: pointer;
	}

	.room-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.room-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.room-stats {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.55);
		background: rgba(255, 255, 255, 0.07);
		border-radius: 999px;
		padding: 0.15rem 0.45rem;
		white-space: nowrap;
	}

	.stat.motion-on {
		color: #10b981;
		background: rgba(16, 185, 129, 0.12);
	}

	.stat.open {
		color: #f59e0b;
		background: rgba(245, 158, 11, 0.12);
	}

	.lights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
		gap: 0.4rem;
	}

	.light-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		padding: 0.45rem 0.25rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.35);
		cursor: pointer;
		font-family: inherit;
		position: relative;
		overflow: hidden;
		transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
		min-width: 0;
	}

	.light-btn.on {
		background: rgba(253, 230, 138, 0.15);
		border-color: rgba(253, 230, 138, 0.35);
		color: #fde68a;
	}

	.light-label {
		font-size: 0.65rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.empty {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.25);
		font-style: italic;
		text-align: center;
		padding: 0.5rem 0;
	}

	.edit-hint {
		color: rgba(255, 255, 255, 0.35);
	}
</style>
