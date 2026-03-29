<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attributes = entity?.attributes;
	$: isOn = entity?.state === 'on';
	$: percentage = attributes?.percentage ?? 0;
	$: oscillating = attributes?.oscillating ?? false;
	$: presetMode = attributes?.preset_mode;
	$: presetModes = (attributes?.preset_modes as string[]) ?? [];
	$: percentageStep = attributes?.percentage_step ?? 33;
	$: name = getName(sel, entity) || entity_id || 'Fan';

	// Spin duration: 100% → 0.4s, 33% → 1.2s, 0% → stopped
	$: spinDuration = percentage > 0 ? Math.max(0.4, 1.8 - percentage / 100 * 1.4) : 0;

	function toggle(e: MouseEvent) {
		e.stopPropagation();
		callService($connection, 'fan', isOn ? 'turn_off' : 'turn_on', { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(30);
	}

	function setSpeed(pct: number, e: MouseEvent) {
		e.stopPropagation();
		if (pct === 0) {
			callService($connection, 'fan', 'turn_off', { entity_id });
		} else {
			callService($connection, 'fan', 'set_percentage', { entity_id, percentage: pct });
		}
	}

	function toggleOscillate(e: MouseEvent) {
		e.stopPropagation();
		callService($connection, 'fan', 'oscillate', { entity_id, oscillating: !oscillating });
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'fan',
				title: 'Fan'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fan-card"
	class:on={isOn}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'default' : 'default'}
	on:click={handleClick}
>
	<!-- Fan SVG -->
	<div class="fan-visual">
		<svg viewBox="0 0 100 100" class="fan-svg">
			<style>
				.fan-blades {
					transform-origin: 50px 50px;
					animation-name: fan-spin;
					animation-timing-function: linear;
					animation-iteration-count: infinite;
					animation-play-state: var(--fan-play-state, paused);
					animation-duration: var(--fan-duration, 1s);
				}
				@keyframes fan-spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			</style>
			<g
				class="fan-blades"
				style:--fan-play-state={isOn && percentage > 0 ? 'running' : 'paused'}
				style:--fan-duration="{spinDuration}s"
			>
				<!-- Blade 1 -->
				<ellipse cx="50" cy="22" rx="11" ry="20" fill="currentColor" opacity="0.85" rx-origin="50" />
				<!-- Blade 2 (rotated 120°) -->
				<ellipse
					cx="50" cy="22" rx="11" ry="20"
					fill="currentColor" opacity="0.85"
					transform="rotate(120 50 50)"
				/>
				<!-- Blade 3 (rotated 240°) -->
				<ellipse
					cx="50" cy="22" rx="11" ry="20"
					fill="currentColor" opacity="0.85"
					transform="rotate(240 50 50)"
				/>
				<!-- Hub -->
				<circle cx="50" cy="50" r="8" fill="currentColor" />
				<circle cx="50" cy="50" r="4" fill="rgba(0,0,0,0.3)" />
			</g>
		</svg>
	</div>

	<!-- Info + controls -->
	<div class="fan-info">
		<div class="fan-name">{name}</div>
		<div class="fan-state">
			{#if isOn}
				{#if presetMode}
					{presetMode}
				{:else}
					{percentage}%
				{/if}
			{:else}
				{entity?.state || 'off'}
			{/if}
		</div>

		<!-- Speed buttons (if no preset modes) -->
		{#if !$editMode && isOn && presetModes.length === 0}
			<div class="speed-buttons">
				<button
					class="speed-btn"
					class:active={percentage <= 33 && percentage > 0}
					on:click={(e) => setSpeed(33, e)}
					use:Ripple={$ripple}
					title="Low"
				>
					<Icon icon="mdi:fan-speed-1" height="14" />
				</button>
				<button
					class="speed-btn"
					class:active={percentage > 33 && percentage <= 66}
					on:click={(e) => setSpeed(66, e)}
					use:Ripple={$ripple}
					title="Medium"
				>
					<Icon icon="mdi:fan-speed-2" height="14" />
				</button>
				<button
					class="speed-btn"
					class:active={percentage > 66}
					on:click={(e) => setSpeed(100, e)}
					use:Ripple={$ripple}
					title="High"
				>
					<Icon icon="mdi:fan-speed-3" height="14" />
				</button>
			</div>
		{/if}
	</div>

	<!-- Toggle + oscillate -->
	<div class="fan-actions">
		{#if isOn}
			<button
				class="action-btn oscillate"
				class:active={oscillating}
				on:click={toggleOscillate}
				title="Oscillate"
				use:Ripple={$ripple}
			>
				<Icon icon="mdi:rotate-360" height="16" />
			</button>
		{/if}
		<button
			class="action-btn toggle"
			class:on={isOn}
			on:click={toggle}
			use:Ripple={$ripple}
			title={isOn ? 'Turn off' : 'Turn on'}
		>
			<Icon icon="mdi:power" height="18" />
		</button>
	</div>
</div>

<style>
	.fan-card {
		display: grid;
		grid-template-columns: 5rem 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 0.85rem 0.85rem 0.75rem;
		width: 100%;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
	}

	.fan-visual {
		width: 4.5rem;
		height: 4.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.fan-svg {
		width: 100%;
		height: 100%;
		color: var(--theme-button-background-color-on, rgba(255, 255, 255, 0.8));
		opacity: 0.4;
		transition: opacity 0.3s ease, color 0.3s ease;
	}

	.on .fan-svg {
		opacity: 1;
		color: rgba(147, 197, 253, 1);
	}

	.fan-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		overflow: hidden;
		min-width: 0;
	}

	.fan-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--theme-button-name-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fan-state {
		font-size: 0.78rem;
		color: var(--theme-button-state-color-off);
		opacity: 0.7;
		text-transform: capitalize;
	}

	.speed-buttons {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.3rem;
	}

	.speed-btn {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 0.35rem;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		padding: 0.2rem 0.4rem;
		display: flex;
		align-items: center;
		transition: background 0.15s;
	}

	.speed-btn.active {
		background: rgba(147, 197, 253, 0.25);
		color: rgba(147, 197, 253, 1);
	}

	.fan-actions {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		align-items: center;
	}

	.action-btn {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 2.2rem;
		height: 2.2rem;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}

	.action-btn.toggle.on {
		background: rgba(147, 197, 253, 0.2);
		color: rgba(147, 197, 253, 1);
	}

	.action-btn.oscillate.active {
		background: rgba(167, 243, 208, 0.2);
		color: rgba(167, 243, 208, 1);
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
