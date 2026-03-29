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
	$: attrs = entity?.attributes || {};
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'Number';
	$: rawVal = parseFloat(entity?.state || '0');
	$: value = isNaN(rawVal) ? 0 : rawVal;
	$: min = attrs.min ?? 0;
	$: max = attrs.max ?? 100;
	$: step = attrs.step ?? 1;
	$: unit = attrs.unit_of_measurement || '';
	$: mode = attrs.mode || 'slider'; // 'slider' or 'box'
	$: pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
	$: domain = entity_id?.split('.')?.[0] || 'input_number';

	let debounce: ReturnType<typeof setTimeout>;

	function setValue(v: number) {
		clearTimeout(debounce);
		debounce = setTimeout(() => {
			callService($connection, domain === 'number' ? 'number' : 'input_number', 'set_value', {
				entity_id,
				value: v
			});
		}, 200);
	}

	function step_up() { setValue(Math.min(value + step, max)); }
	function step_down() { setValue(Math.max(value - step, min)); }
	function handleSlider(e: Event) { setValue(parseFloat((e.target as HTMLInputElement).value)); }

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'input_number',
				title: 'Number'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="num-card"
	on:click={handleEdit}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:numeric" height="28" width="28" style="opacity:0.3" />
			<span>Configure Number</span>
		</div>
	{:else}
		<div class="num-top">
			<div class="num-info">
				<span class="num-name">{name}</span>
				<span class="num-range">{min} – {max}</span>
			</div>
			<div class="num-val-wrap">
				{#if !$editMode}
					<button class="step-btn" on:click|stopPropagation={step_down} use:Ripple={$ripple}>
						<Icon icon="mdi:minus" height="14" width="14" />
					</button>
				{/if}
				<span class="num-val">{value}<span class="num-unit">{unit}</span></span>
				{#if !$editMode}
					<button class="step-btn" on:click|stopPropagation={step_up} use:Ripple={$ripple}>
						<Icon icon="mdi:plus" height="14" width="14" />
					</button>
				{/if}
			</div>
		</div>

		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="slider-wrap" on:click|stopPropagation>
			<input
				type="range"
				{min}
				{max}
				{step}
				{value}
				on:input={handleSlider}
				class="num-slider"
				style:--fill-pct="{pct}%"
				aria-label={name}
				disabled={$editMode}
			/>
		</div>
	{/if}
</div>

<style>
	.num-card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
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

	.num-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.num-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.num-name {
		font-size: 0.88rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.num-range {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.num-val-wrap {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.num-val {
		font-size: 1.2rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		min-width: 2.5rem;
		text-align: center;
	}

	.num-unit {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 400;
		margin-left: 0.1rem;
	}

	.step-btn {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.6);
		padding: 0;
		font-family: inherit;
		transition: background 0.15s;
	}

	.step-btn:hover {
		background: rgba(255, 255, 255, 0.18);
		color: white;
	}

	.slider-wrap { padding: 0 0.1rem; }

	.num-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 5px;
		border-radius: 3px;
		background: linear-gradient(
			to right,
			rgba(147,197,253,0.8) 0%,
			rgba(147,197,253,0.8) var(--fill-pct, 50%),
			rgba(255,255,255,0.12) var(--fill-pct, 50%),
			rgba(255,255,255,0.12) 100%
		);
		outline: none;
		cursor: pointer;
	}

	.num-slider:disabled { cursor: default; opacity: 0.5; }

	.num-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 16px; height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 1px 5px rgba(0,0,0,0.4);
	}

	.num-slider::-moz-range-thumb {
		width: 16px; height: 16px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 1px 5px rgba(0,0,0,0.4);
	}
</style>
