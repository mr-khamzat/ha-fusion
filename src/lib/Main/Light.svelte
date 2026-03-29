<script lang="ts">
	import { states, connection, motion, editMode, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import { onDestroy } from 'svelte';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attributes = entity?.attributes;
	$: entityDomain = entity_id?.split('.')?.[0] || 'light';
	$: isOn = entity?.state === 'on';
	$: brightness = attributes?.brightness ? Math.round((attributes.brightness / 255) * 100) : 0;
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Light';
	$: hsColor = attributes?.hs_color as [number, number] | undefined;
	$: colorTemp = attributes?.color_temp_kelvin as number | undefined;
	$: supportedFeatures = attributes?.supported_features ?? 0;
	$: supportsColor = !!(supportedFeatures & 16);
	$: supportsColorTemp = !!(supportedFeatures & 2);
	$: supportsBrightness = !!(supportedFeatures & 1) || brightness > 0;

	$: iconColor = hsColor
		? `hsl(${hsColor[0]}, ${Math.min(hsColor[1], 90)}%, 65%)`
		: isOn
			? '#fde68a'
			: 'rgba(255,255,255,0.3)';

	$: glowColor = hsColor
		? `hsla(${hsColor[0]}, ${Math.min(hsColor[1], 80)}%, 55%, 0.35)`
		: isOn
			? 'rgba(253,230,138,0.25)'
			: 'transparent';

	let rangeValue = 0;
	let debounce = false;
	let debounceTimeout: ReturnType<typeof setTimeout>;

	$: if (!debounce) rangeValue = brightness;

	function handleBrightness(event: Event) {
		const val = parseInt((event.target as HTMLInputElement).value);
		rangeValue = val;
		debounce = true;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			if (val === 0) {
				callService($connection, 'light', 'turn_off', { entity_id });
			} else {
				callService($connection, 'light', 'turn_on', { entity_id, brightness_pct: val });
			}
			debounce = false;
		}, 150);
	}

	function toggleLight(e: MouseEvent) {
		e.stopPropagation();
		callService($connection, entityDomain, isOn ? 'turn_off' : 'turn_on', { entity_id });
		if ('vibrate' in navigator) navigator.vibrate(30);
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/LightConfig.svelte'), { sel });
		} else if (entityDomain === 'light') {
			openModal(() => import('$lib/Modal/LightModal.svelte'), { sel });
		}
	}

	onDestroy(() => clearTimeout(debounceTimeout));
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="light-card"
	class:on={isOn}
	on:click={handleClick}
	use:Ripple={{ ...$ripple, color: isOn ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)' }}
	style:transition="all {$motion}ms ease"
	style:--glow={glowColor}
	style:--icon-color={iconColor}
>
	<!-- Ambient glow blob -->
	{#if isOn}
		<div
			class="glow-blob"
			style:background="radial-gradient(circle at 20% 50%, {glowColor} 0%, transparent 70%)"
			style:opacity={brightness / 100}
		></div>
	{/if}

	<!-- Top: toggle + name + brightness % -->
	<div class="light-top">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="icon-btn"
			class:on={isOn}
			on:click={toggleLight}
			style:background={isOn ? `${iconColor}22` : 'rgba(255,255,255,0.07)'}
			style:box-shadow={isOn ? `0 0 12px ${glowColor}` : 'none'}
		>
			<Icon
				icon={isOn ? 'mdi:lightbulb' : 'mdi:lightbulb-outline'}
				height="22"
				width="22"
				style="color: {iconColor}"
			/>
		</div>

		<div class="light-info">
			<span class="light-name">{name}</span>
			{#if isOn}
				<span class="light-sub">
					{#if hsColor && supportsColor}
						<span class="color-dot" style:background={iconColor}></span>
					{/if}
					{brightness}%
				</span>
			{:else}
				<span class="light-sub off-label">Off</span>
			{/if}
		</div>
	</div>

	<!-- Brightness slider (when on) -->
	{#if isOn && supportsBrightness && entityDomain === 'light'}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="slider-wrap" on:click|stopPropagation>
			<input
				type="range"
				min="1"
				max="100"
				value={rangeValue}
				on:input={handleBrightness}
				class="brightness-slider"
				style:--fill-pct="{rangeValue}%"
				style:--fill-color={iconColor}
				aria-label="Brightness"
			/>
		</div>
	{/if}
</div>

<style>
	.light-card {
		background: var(--theme-button-background-color-off, rgba(0, 0, 0, 0.2));
		border-radius: 0.65rem;
		padding: 0.85rem 1rem 0.8rem;
		cursor: pointer;
		height: 100%;
		min-height: 5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.6rem;
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.light-card.on {
		border-color: rgba(255, 255, 255, 0.1);
	}

	.glow-blob {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		transition: opacity 0.4s ease;
	}

	.light-top {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.icon-btn {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.2s, box-shadow 0.3s;
		cursor: pointer;
	}

	.light-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.light-name {
		font-size: 0.88rem;
		font-weight: 500;
		color: var(--theme-button-name-color-off, rgba(255, 255, 255, 0.85));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.light-sub {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.45);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.light-sub.off-label {
		color: rgba(255, 255, 255, 0.3);
	}

	.color-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.slider-wrap {
		position: relative;
		z-index: 1;
		padding: 0 0.1rem;
	}

	.brightness-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 5px;
		border-radius: 3px;
		background: linear-gradient(
			to right,
			var(--fill-color, #fde68a) 0%,
			var(--fill-color, #fde68a) var(--fill-pct, 50%),
			rgba(255, 255, 255, 0.12) var(--fill-pct, 50%),
			rgba(255, 255, 255, 0.12) 100%
		);
		outline: none;
		cursor: pointer;
	}

	.brightness-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
	}

	.brightness-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
	}
</style>
