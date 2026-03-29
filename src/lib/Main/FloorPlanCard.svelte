<script lang="ts">
	import { states, connection, editMode, motion } from '$lib/Stores';
	import { callService, type HassEntity } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';

	export let sel: any;

	interface Overlay {
		entity_id: string;
		x_pct: number;
		y_pct: number;
		icon?: string;
		label?: string;
	}

	$: imageUrl = (() => {
		const url = sel?.image_url as string | undefined;
		if (!url?.startsWith('/_api/')) return url;
		const ingressBase = typeof window !== 'undefined'
			? (window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/)?.[0] ?? '')
			: '';
		return ingressBase + url;
	})();
	$: overlays = (sel?.overlays || []) as Overlay[];

	function getEntity(entity_id: string): HassEntity | undefined {
		return $states?.[entity_id];
	}

	function getOverlayColor(entity_id: string): string {
		const entity = getEntity(entity_id);
		if (!entity) return 'rgba(255,255,255,0.25)';
		const s = entity.state;
		const domain = entity_id.split('.')[0];
		if (['unavailable', 'unknown'].includes(s)) return 'rgba(255,255,255,0.2)';
		if (domain === 'binary_sensor') {
			const dc = entity.attributes?.device_class as string | undefined;
			if (s === 'on' && dc && ['smoke', 'gas', 'moisture'].includes(dc))
				return 'rgba(239,68,68,0.9)';
			if (s === 'on') return 'rgba(251,191,36,0.9)';
			return 'rgba(255,255,255,0.25)';
		}
		if (s === 'on' || s === 'open' || s === 'unlocked' || s === 'playing')
			return 'rgba(251,191,36,0.95)';
		return 'rgba(255,255,255,0.3)';
	}

	function getDefaultIcon(entity_id: string): string {
		const domain = entity_id.split('.')[0];
		const entity = getEntity(entity_id);
		const dc = entity?.attributes?.device_class as string | undefined;

		const map: Record<string, string> = {
			light: 'mdi:lightbulb',
			switch: 'mdi:toggle-switch',
			sensor: 'mdi:gauge',
			binary_sensor: 'mdi:circle',
			climate: 'mdi:thermostat',
			lock: 'mdi:lock',
			cover: 'mdi:garage',
			media_player: 'mdi:speaker',
			fan: 'mdi:fan',
			camera: 'mdi:cctv'
		};

		if (domain === 'binary_sensor' && dc) {
			const dcIcons: Record<string, string> = {
				motion: 'mdi:motion-sensor',
				door: 'mdi:door',
				window: 'mdi:window-open',
				smoke: 'mdi:smoke-detector',
				moisture: 'mdi:water'
			};
			if (dcIcons[dc]) return dcIcons[dc];
		}

		return map[domain] || 'mdi:help-circle-outline';
	}

	function getTooltip(overlay: Overlay): string {
		const entity = getEntity(overlay.entity_id);
		const name =
			overlay.label ||
			(entity?.attributes?.friendly_name as string | undefined) ||
			overlay.entity_id;
		const state = entity?.state ?? 'unknown';
		return `${name}: ${state}`;
	}

	function toggleEntity(overlay: Overlay) {
		if ($editMode || !$connection) return;
		const entity = getEntity(overlay.entity_id);
		if (!entity) return;
		const domain = overlay.entity_id.split('.')[0];
		const service = entity.state === 'on' || entity.state === 'open' ? 'turn_off' : 'turn_on';
		callService($connection, domain, service, { entity_id: overlay.entity_id });
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/FloorPlanConfig.svelte'), { sel });
		}
	}

	// tooltip hover state
	let hoveredId: string | null = null;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="floor-card"
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
	on:click={handleClick}
>
	{#if imageUrl}
		<div class="image-container">
			<img src={imageUrl} alt="Floor plan" class="floor-image" draggable="false" />

			{#each overlays as overlay (overlay.entity_id)}
				{@const color = getOverlayColor(overlay.entity_id)}
				{@const icon = overlay.icon || getDefaultIcon(overlay.entity_id)}
				{@const isOn =
					getEntity(overlay.entity_id)?.state === 'on' ||
					getEntity(overlay.entity_id)?.state === 'open'}

				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="overlay-pin"
					style:left="{overlay.x_pct}%"
					style:top="{overlay.y_pct}%"
					style:color={color}
					style:filter={isOn ? `drop-shadow(0 0 6px ${color})` : 'none'}
					style:transition="color {$motion}ms ease, filter {$motion}ms ease"
					style:cursor={!$editMode ? 'pointer' : 'default'}
					title={getTooltip(overlay)}
					on:click|stopPropagation={() => toggleEntity(overlay)}
					on:mouseenter={() => {
						hoveredId = overlay.entity_id;
					}}
					on:mouseleave={() => {
						hoveredId = null;
					}}
				>
					<Icon {icon} width="20" height="20" />

					{#if hoveredId === overlay.entity_id}
						<div class="pin-tooltip">
							{getTooltip(overlay)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<!-- empty state -->
		<div class="empty-state">
			<Icon icon="mdi:floor-plan" width="48" height="48" style="opacity:0.25" />
			<span class="empty-label">
				{$editMode ? 'Нажмите для настройки плана' : 'План не настроен'}
			</span>
		</div>
	{/if}
</div>

<style>
	.floor-card {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 12rem;
		border-radius: 0.65rem;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.07);
		box-sizing: border-box;
	}

	.image-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 12rem;
	}

	.floor-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		border-radius: 0.65rem;
		pointer-events: none;
		user-select: none;
	}

	.overlay-pin {
		position: absolute;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		z-index: 2;
	}

	.pin-tooltip {
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		background: rgba(15, 15, 20, 0.92);
		backdrop-filter: blur(8px);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.68rem;
		white-space: nowrap;
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		pointer-events: none;
		border: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 10;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		height: 100%;
		min-height: 12rem;
		color: rgba(255, 255, 255, 0.35);
	}

	.empty-label {
		font-size: 0.8rem;
	}
</style>
