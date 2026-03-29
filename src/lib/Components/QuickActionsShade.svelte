<script lang="ts">
	/**
	 * Quick Actions Shade — swipe-down control center overlay.
	 * Activated by swiping down from the top of the screen.
	 * Shows quick toggles for configured entities.
	 */
	import { connection, states, dashboard, motion } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { fade, fly } from 'svelte/transition';
	import Icon from '@iconify/svelte';

	export let open = false;

	$: quickEntities = ($dashboard?.quick_shade_entities as string[]) || [];

	function getIcon(entity_id: string): string {
		const s = $states?.[entity_id];
		if (!s) return 'mdi:toggle-switch-outline';
		const domain = entity_id.split('.')[0];
		const icon = s.attributes?.icon;
		if (icon) return icon;
		const map: Record<string, string> = {
			light: 'mdi:lightbulb',
			switch: 'mdi:toggle-switch',
			input_boolean: 'mdi:checkbox-marked-circle',
			fan: 'mdi:fan',
			cover: 'mdi:window-shutter',
			lock: 'mdi:lock',
			automation: 'mdi:robot',
			script: 'mdi:script-text',
			scene: 'mdi:palette'
		};
		return map[domain] || 'mdi:power';
	}

	function getName(entity_id: string): string {
		return $states?.[entity_id]?.attributes?.friendly_name || entity_id.split('.')[1]?.replace(/_/g, ' ') || entity_id;
	}

	function isOn(entity_id: string): boolean {
		return $states?.[entity_id]?.state === 'on';
	}

	function toggle(entity_id: string) {
		if (!$connection) return;
		const domain = entity_id.split('.')[0];
		const service = domain === 'cover' ? (isOn(entity_id) ? 'close_cover' : 'open_cover') : 'toggle';
		const svcDomain = ['cover', 'lock'].includes(domain) ? domain : 'homeassistant';
		callService($connection, svcDomain, service, { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(15);
	}

	// Brightness shortcut — find first 'on' light
	$: mainLight = quickEntities.find((e) => e.startsWith('light.') && isOn(e));
	$: brightness = mainLight
		? Math.round((($states?.[mainLight]?.attributes?.brightness ?? 0) / 255) * 100)
		: 0;

	function setBrightness(e: Event) {
		if (!mainLight || !$connection) return;
		const val = parseInt((e.target as HTMLInputElement).value);
		callService($connection, 'light', 'turn_on', { entity_id: mainLight, brightness_pct: val });
	}

	function close() {
		open = false;
	}
</script>

{#if open}
	<!-- backdrop -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="backdrop"
		on:click={close}
		transition:fade={{ duration: $motion }}
	></div>

	<div
		class="shade"
		transition:fly={{ y: -60, duration: $motion }}
	>
		<div class="handle"></div>

		{#if quickEntities.length === 0}
			<div class="empty">Нет быстрых кнопок. Добавьте в настройках (Внешний вид).</div>
		{:else}
			<div class="tiles">
				{#each quickEntities as entity_id}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="tile"
						class:on={isOn(entity_id)}
						on:click={() => toggle(entity_id)}
					>
						<Icon icon={getIcon(entity_id)} width="22" />
						<span class="tile-name">{getName(entity_id)}</span>
					</div>
				{/each}
			</div>

			{#if mainLight}
				<div class="brightness-row">
					<Icon icon="mdi:brightness-5" width="18" style="opacity:0.6" />
					<input
						type="range"
						min="1"
						max="100"
						value={brightness}
						class="brightness-slider"
						on:change={setBrightness}
					/>
					<span class="brightness-val">{brightness}%</span>
				</div>
			{/if}
		{/if}

		<button class="close-btn" on:click={close}>✕</button>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 8900;
		background: rgba(0,0,0,0.3);
	}

	.shade {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9000;
		background: rgba(15,15,25,0.92);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom-left-radius: 1.5rem;
		border-bottom-right-radius: 1.5rem;
		padding: 0.5rem 1.2rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.handle {
		width: 2.5rem;
		height: 4px;
		background: rgba(255,255,255,0.2);
		border-radius: 2px;
		margin: 0.3rem auto 0;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
		gap: 0.6rem;
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.75rem 0.5rem;
		border-radius: 0.9rem;
		background: rgba(255,255,255,0.07);
		cursor: pointer;
		transition: background 0.15s, transform 0.1s;
		user-select: none;
	}

	.tile:active {
		transform: scale(0.94);
	}

	.tile.on {
		background: var(--theme-button-background-color-on, rgba(99,102,241,0.7));
	}

	.tile-name {
		font-size: 0.7rem;
		text-align: center;
		line-height: 1.2;
		opacity: 0.85;
		max-width: 5rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.brightness-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.brightness-slider {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 5px;
		border-radius: 3px;
		background: rgba(255,255,255,0.2);
		outline: none;
		cursor: pointer;
	}

	.brightness-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #fff;
		cursor: pointer;
	}

	.brightness-val {
		font-size: 0.8rem;
		opacity: 0.6;
		min-width: 2.5rem;
		text-align: right;
	}

	.close-btn {
		position: absolute;
		top: 0.8rem;
		right: 1rem;
		background: transparent;
		border: none;
		color: rgba(255,255,255,0.4);
		cursor: pointer;
		font-size: 1rem;
	}

	.empty {
		font-size: 0.85rem;
		opacity: 0.5;
		text-align: center;
		padding: 1rem 0;
	}
</style>
