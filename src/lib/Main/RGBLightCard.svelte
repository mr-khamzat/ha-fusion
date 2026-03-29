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
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Light';

	$: isOn = state === 'on';
	$: rgbColor = attrs.rgb_color as [number, number, number] | undefined;
	$: hsColor = attrs.hs_color as [number, number] | undefined;
	$: brightness = attrs.brightness as number | undefined;
	$: brightnessPct = brightness != null ? Math.round((brightness / 255) * 100) : 0;
	$: colorTempKelvin = attrs.color_temp_kelvin as number | undefined;
	$: minColorTempKelvin = attrs.min_color_temp_kelvin as number | undefined;
	$: maxColorTempKelvin = attrs.max_color_temp_kelvin as number | undefined;
	$: colorMode = attrs.color_mode as string | undefined;
	$: supportedColorModes = (attrs.supported_color_modes as string[] | undefined) || [];

	$: supportsColor = supportedColorModes.some((m) =>
		['hs', 'xy', 'rgb', 'rgbw', 'rgbww'].includes(m)
	);
	$: supportsColorTemp = supportedColorModes.includes('color_temp');
	$: supportsBrightness =
		supportsColor ||
		supportsColorTemp ||
		supportedColorModes.some((m) => ['brightness', 'white'].includes(m));

	function circleColor(): string {
		if (!isOn) return 'rgba(255,255,255,0.08)';
		if (rgbColor) {
			const [r, g, b] = rgbColor;
			const alpha = brightnessPct > 0 ? 0.5 + (brightnessPct / 100) * 0.5 : 0.6;
			return `rgba(${r},${g},${b},${alpha})`;
		}
		const a = brightnessPct > 0 ? 0.5 + (brightnessPct / 100) * 0.5 : 0.6;
		return `rgba(255,220,150,${a})`;
	}

	$: circleStyle = circleColor();

	const swatches: Array<{ label: string; hue: number; display: string }> = [
		{ label: 'Red', hue: 0, display: '#f87171' },
		{ label: 'Orange', hue: 30, display: '#fb923c' },
		{ label: 'Yellow', hue: 55, display: '#fbbf24' },
		{ label: 'Green', hue: 120, display: '#4ade80' },
		{ label: 'Cyan', hue: 185, display: '#22d3ee' },
		{ label: 'Blue', hue: 230, display: '#60a5fa' },
		{ label: 'Purple', hue: 270, display: '#a78bfa' },
		{ label: 'Pink', hue: 320, display: '#f472b6' }
	];

	function pickSwatch(hue: number) {
		if (!$connection) return;
		callService($connection, 'light', 'turn_on', { entity_id, hs_color: [hue, 100] });
	}

	function setWhite() {
		if (!$connection) return;
		callService($connection, 'light', 'turn_on', { entity_id, color_temp_kelvin: 4000 });
	}

	let brightDebounce: ReturnType<typeof setTimeout>;
	function handleBrightness(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		clearTimeout(brightDebounce);
		brightDebounce = setTimeout(() => {
			if (!$connection) return;
			callService($connection, 'light', 'turn_on', { entity_id, brightness_pct: val });
		}, 150);
	}

	let tempDebounce: ReturnType<typeof setTimeout>;
	function handleColorTemp(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		clearTimeout(tempDebounce);
		tempDebounce = setTimeout(() => {
			if (!$connection) return;
			callService($connection, 'light', 'turn_on', { entity_id, color_temp_kelvin: val });
		}, 150);
	}

	function toggle() {
		if (!$connection) return;
		callService($connection, 'light', state === 'on' ? 'turn_off' : 'turn_on', { entity_id });
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/LightConfig.svelte'), { sel });
		}
	}

	$: colorTempPct =
		colorTempKelvin != null && minColorTempKelvin != null && maxColorTempKelvin != null
			? Math.round(
					((colorTempKelvin - minColorTempKelvin) /
						(maxColorTempKelvin - minColorTempKelvin)) *
						100
				)
			: 50;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="rgb-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:lightbulb-outline" height="28" width="28" style="opacity:0.3" />
			<span>Настроить RGB свет</span>
		</div>
	{:else}
		<div class="top-row">
			<div class="color-circle" style:background={circleStyle} style:box-shadow={isOn ? `0 0 18px 4px ${circleStyle}` : 'none'}>
				<Icon icon={isOn ? 'mdi:lightbulb' : 'mdi:lightbulb-outline'} height="22" width="22" style="color:rgba(255,255,255,0.85)" />
			</div>
			<div class="light-info">
				<span class="light-name">{name}</span>
				<span class="light-state" style:color={isOn ? 'rgba(255,220,150,0.9)' : 'rgba(255,255,255,0.35)'}>
					{isOn ? (brightnessPct > 0 ? `${brightnessPct}%` : 'On') : 'Off'}
					{#if colorMode && isOn}
						<span class="color-mode-badge">{colorMode}</span>
					{/if}
				</span>
			</div>
			{#if !$editMode}
				<button
					class="toggle-btn"
					class:toggle-on={isOn}
					on:click|stopPropagation={toggle}
					use:Ripple={$ripple}
					aria-label="Toggle"
				>
					<Icon icon="mdi:power" height="16" width="16" />
				</button>
			{/if}
		</div>

		{#if !$editMode}
			{#if supportsBrightness}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="slider-section" on:click|stopPropagation>
					<div class="slider-label">
						<Icon icon="mdi:brightness-6" height="11" width="11" style="opacity:0.5" />
						<span>Яркость</span>
						<span class="slider-val">{brightnessPct}%</span>
					</div>
					<input
						type="range"
						min="0"
						max="100"
						value={brightnessPct}
						on:input={handleBrightness}
						class="light-slider brightness-slider"
						style:--fill-pct="{brightnessPct}%"
						aria-label="Brightness"
					/>
				</div>
			{/if}

			{#if supportsColorTemp && colorTempKelvin != null && minColorTempKelvin != null && maxColorTempKelvin != null}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="slider-section" on:click|stopPropagation>
					<div class="slider-label">
						<Icon icon="mdi:thermometer" height="11" width="11" style="opacity:0.5" />
						<span>Температура</span>
						<span class="slider-val">{colorTempKelvin}K</span>
					</div>
					<input
						type="range"
						min={minColorTempKelvin}
						max={maxColorTempKelvin}
						value={colorTempKelvin}
						on:input={handleColorTemp}
						class="light-slider temp-slider"
						style:--fill-pct="{colorTempPct}%"
						aria-label="Color temperature"
					/>
				</div>
			{/if}

			{#if supportsColor}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="swatches-section" on:click|stopPropagation>
					<button class="swatch white-swatch" on:click={setWhite} title="White" aria-label="White">
						<Icon icon="mdi:weather-sunny" height="11" width="11" />
					</button>
					{#each swatches as sw}
						<button
							class="swatch"
							style:background={sw.display}
							style:box-shadow={hsColor && Math.round(hsColor[0]) === sw.hue ? `0 0 0 2px white` : 'none'}
							on:click={() => pickSwatch(sw.hue)}
							title={sw.label}
							aria-label={sw.label}
						></button>
					{/each}
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.rgb-card {
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

	.top-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.color-circle {
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background 0.4s ease,
			box-shadow 0.4s ease;
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
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.light-state {
		font-size: 0.72rem;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		transition: color 0.3s;
	}

	.color-mode-badge {
		font-size: 0.62rem;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 0.25rem;
		padding: 0.05rem 0.3rem;
		color: rgba(255, 255, 255, 0.45);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.toggle-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
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

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.13);
		color: rgba(255, 255, 255, 0.85);
	}

	.toggle-on {
		background: rgba(255, 220, 100, 0.18);
		color: rgba(255, 220, 100, 0.9);
	}

	.toggle-on:hover {
		background: rgba(255, 220, 100, 0.28);
		color: rgba(255, 230, 130, 1);
	}

	.slider-section {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.slider-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.slider-label span:first-of-type {
		flex: 1;
	}

	.slider-val {
		font-variant-numeric: tabular-nums;
		color: rgba(255, 255, 255, 0.55);
	}

	.light-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 5px;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}

	.brightness-slider {
		background: linear-gradient(
			to right,
			rgba(255, 220, 100, 0.75) 0%,
			rgba(255, 220, 100, 0.75) var(--fill-pct, 50%),
			rgba(255, 255, 255, 0.12) var(--fill-pct, 50%),
			rgba(255, 255, 255, 0.12) 100%
		);
	}

	.temp-slider {
		background: linear-gradient(
			to right,
			rgba(180, 210, 255, 0.7) 0%,
			rgba(255, 220, 100, 0.75) var(--fill-pct, 50%),
			rgba(255, 150, 60, 0.7) 100%
		);
	}

	.light-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
	}

	.light-slider::-moz-range-thumb {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
	}

	.swatches-section {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		padding-top: 0.1rem;
	}

	.swatch {
		width: 1.35rem;
		height: 1.35rem;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
		padding: 0;
	}

	.swatch:hover {
		transform: scale(1.18);
	}

	.white-swatch {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: inherit;
	}

	.white-swatch:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.18);
	}
</style>
