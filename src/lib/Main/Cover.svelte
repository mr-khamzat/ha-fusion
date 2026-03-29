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
	$: state = entity?.state || 'unknown';
	$: attrs = entity?.attributes || {};
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Cover';
	$: position = attrs.current_position as number | undefined;
	$: tiltPosition = attrs.current_tilt_position as number | undefined;
	$: supportsPosition = attrs.supported_features != null && (attrs.supported_features & 4) > 0;
	$: isOpen = state === 'open';
	$: isOpening = state === 'opening';
	$: isClosing = state === 'closing';
	$: isClosed = state === 'closed';

	$: deviceClass = attrs.device_class || 'cover';

	const icons: Record<string, { open: string; closed: string }> = {
		blind: { open: 'mdi:blinds-open', closed: 'mdi:blinds' },
		curtain: { open: 'mdi:curtains-closed', closed: 'mdi:curtains' },
		garage: { open: 'mdi:garage-open', closed: 'mdi:garage' },
		gate: { open: 'mdi:gate-open', closed: 'mdi:gate' },
		shade: { open: 'mdi:roller-shade', closed: 'mdi:roller-shade-closed' },
		shutter: { open: 'mdi:window-shutter-open', closed: 'mdi:window-shutter' },
		window: { open: 'mdi:window-open', closed: 'mdi:window-closed' },
		cover: { open: 'mdi:arrow-up-box', closed: 'mdi:arrow-down-box' }
	};

	$: icon = isOpen || isOpening
		? (icons[deviceClass] || icons.cover).open
		: (icons[deviceClass] || icons.cover).closed;

	$: stateColor = isOpen
		? 'rgba(96,165,250,0.9)'
		: isOpening || isClosing
			? 'rgba(251,191,36,0.9)'
			: 'rgba(255,255,255,0.35)';

	let debounce: ReturnType<typeof setTimeout>;

	function setPosition(pct: number) {
		clearTimeout(debounce);
		debounce = setTimeout(() => {
			callService($connection, 'cover', 'set_cover_position', { entity_id, position: pct });
		}, 200);
	}

	function open() { callService($connection, 'cover', 'open_cover', { entity_id }); }
	function stop() { callService($connection, 'cover', 'stop_cover', { entity_id }); }
	function close() { callService($connection, 'cover', 'close_cover', { entity_id }); }
	function handleSlider(e: Event) { setPosition(parseInt((e.target as HTMLInputElement).value)); }

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/CoverConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="cover-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:window-shutter" height="28" width="28" style="opacity:0.3" />
			<span>Configure Cover</span>
		</div>
	{:else}
		<div class="cover-top">
			<div class="cover-icon-wrap" style:color={stateColor}>
				<Icon {icon} height="26" width="26" />
			</div>
			<div class="cover-info">
				<span class="cover-name">{name}</span>
				<span class="cover-state" style:color={stateColor}>
					{#if isOpening}Opening…{:else if isClosing}Closing…{:else}{state}{/if}
					{#if position != null} · {position}%{/if}
				</span>
			</div>
		</div>

		{#if supportsPosition && position != null}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="slider-wrap" on:click|stopPropagation>
				<input
					type="range"
					min="0"
					max="100"
					value={position}
					on:input={handleSlider}
					class="pos-slider"
					style:--fill-pct="{position}%"
					aria-label="Position"
				/>
			</div>
		{/if}

		{#if !$editMode}
			<div class="cover-btns" on:click|stopPropagation>
				<button class="ctrl-btn" on:click={open} use:Ripple={$ripple} aria-label="Open">
					<Icon icon="mdi:arrow-up" height="16" width="16" />
				</button>
				<button class="ctrl-btn" on:click={stop} use:Ripple={$ripple} aria-label="Stop">
					<Icon icon="mdi:stop" height="16" width="16" />
				</button>
				<button class="ctrl-btn" on:click={close} use:Ripple={$ripple} aria-label="Close">
					<Icon icon="mdi:arrow-down" height="16" width="16" />
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.cover-card {
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

	.cover-top {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.cover-icon-wrap {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.07);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: color 0.3s;
	}

	.cover-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.cover-name {
		font-size: 0.88rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cover-state {
		font-size: 0.72rem;
		transition: color 0.3s;
		text-transform: capitalize;
	}

	.slider-wrap {
		padding: 0 0.1rem;
	}

	.pos-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 5px;
		border-radius: 3px;
		background: linear-gradient(
			to right,
			rgba(96, 165, 250, 0.8) 0%,
			rgba(96, 165, 250, 0.8) var(--fill-pct, 50%),
			rgba(255, 255, 255, 0.12) var(--fill-pct, 50%),
			rgba(255, 255, 255, 0.12) 100%
		);
		outline: none;
		cursor: pointer;
	}

	.pos-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
	}

	.pos-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
	}

	.cover-btns {
		display: flex;
		gap: 0.4rem;
	}

	.ctrl-btn {
		flex: 1;
		padding: 0.35rem;
		background: rgba(255, 255, 255, 0.07);
		border: none;
		border-radius: 0.4rem;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
		font-family: inherit;
	}

	.ctrl-btn:hover {
		background: rgba(255, 255, 255, 0.14);
		color: white;
	}
</style>
