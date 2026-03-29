<script lang="ts">
	import {
		states,
		dashboard,
		lang,
		history,
		historyIndex,
		record,
		ripple,
		entityList
	} from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Radial from '$lib/Sidebar/Radial.svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj, getName } from '$lib/Utils';
	import Ripple from 'svelte-ripple';
	import type { RadialItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: RadialItem;

	export let demo: string | undefined = undefined;

	if (demo) {
		// replace history entry with demo
		$history.splice($historyIndex, 1);
		set('entity_id', demo);
	}

	let name = sel?.name;
	let stroke = sel?.stroke;
	let thresholds: { value: number; color: string }[] = sel?.thresholds || [];

	const defaultThresholds = [
		{ value: 0, color: '#22c55e' },
		{ value: 60, color: '#eab308' },
		{ value: 85, color: '#ef4444' }
	];

	function addThreshold() {
		thresholds = [...thresholds, { value: 0, color: '#ffffff' }];
		saveThresholds();
	}

	function removeThreshold(i: number) {
		thresholds = thresholds.filter((_, idx) => idx !== i);
		saveThresholds();
	}

	function saveThresholds() {
		sel.thresholds = thresholds.length > 0 ? [...thresholds] : undefined;
		$dashboard = $dashboard;
	}

	function useDefaults() {
		thresholds = [...defaultThresholds];
		saveThresholds();
	}

	let numberElement: HTMLInputElement;

	$: entity_id = sel?.entity_id;

	const range = {
		min: 1,
		max: 15
	};

	$: options = $entityList('sensor');

	function minMax(key: string | number | undefined) {
		return Math.min(Math.max(parseInt(key as string), range.min), range.max);
	}

	function handleNumberRange(event: any) {
		const value = minMax(event?.target?.value);
		set('stroke', value);
		if (numberElement) numberElement.value = String(value);
	}

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Radial</h1>

		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Radial {entity_id} {name} strokeWidth={minMax(stroke)} {thresholds} />
		</div>

		<h2>{$lang('entity')}</h2>

		{#if sel && options && entity_id}
			<Select
				value={entity_id}
				placeholder={$lang('entity')}
				on:change={(event) => set('entity_id', event)}
				{options}
				computeIcons={true}
			/>
		{/if}

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			on:clear={() => {
				name = undefined;
				set('name');
			}}
			let:padding
		>
			<input
				type="text"
				class="input"
				class:placeholder={!name}
				bind:value={name}
				placeholder={getName(sel, (sel?.entity_id && $states[sel.entity_id]) || undefined)}
				on:change={(event) => set('name', event)}
				autocomplete="off"
				spellcheck="false"
				style:padding
			/>
		</InputClear>

		<h2>{$lang('size')}</h2>

		<input
			type="number"
			class="input"
			bind:value={stroke}
			bind:this={numberElement}
			placeholder="9"
			min={range.min}
			max={range.max}
			on:input={handleNumberRange}
			autocomplete="off"
		/>

		<h2>Color Thresholds</h2>

		<div class="thresholds">
			{#each thresholds as threshold, i}
				<div class="threshold-row">
					<span class="threshold-at">≥</span>
					<input
						type="number"
						class="input threshold-val"
						min="0"
						max="100"
						bind:value={threshold.value}
						on:change={saveThresholds}
						placeholder="0"
					/>
					<span class="threshold-pct">%</span>
					<input
						type="color"
						class="color-picker"
						bind:value={threshold.color}
						on:change={saveThresholds}
					/>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<button class="remove-threshold" on:click={() => removeThreshold(i)}>×</button>
				</div>
			{/each}

			<div class="threshold-actions">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button class="add-threshold" on:click={addThreshold} use:Ripple={$ripple}>
					+ Add threshold
				</button>
				{#if thresholds.length === 0}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<button class="add-threshold" on:click={useDefaults} use:Ripple={$ripple}>
						Use defaults
					</button>
				{/if}
			</div>
		</div>

		<h2>{$lang('mobile')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.hide_mobile !== true}
				on:click={() => set('hide_mobile')}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_mobile === true}
				on:click={() => set('hide_mobile', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.preview {
		margin-bottom: 0.5rem;
	}

	.thresholds {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.threshold-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.threshold-at {
		color: rgba(255,255,255,0.5);
		font-size: 0.9rem;
		width: 1rem;
		text-align: center;
	}

	.threshold-val {
		width: 4.5rem;
		padding: 0.4rem 0.5rem;
	}

	.threshold-pct {
		color: rgba(255,255,255,0.4);
		font-size: 0.85rem;
	}

	.color-picker {
		width: 2.2rem;
		height: 2rem;
		border: 1px solid rgba(255,255,255,0.2);
		border-radius: 0.35rem;
		background: none;
		cursor: pointer;
		padding: 0.1rem;
	}

	.remove-threshold {
		background: rgba(255,255,255,0.08);
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		cursor: pointer;
		color: rgba(255,255,255,0.5);
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		font-family: inherit;
		line-height: 1;
		margin-left: auto;
	}

	.remove-threshold:hover {
		background: rgba(239,68,68,0.25);
		color: #ef4444;
	}

	.threshold-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.add-threshold {
		background: rgba(255,255,255,0.08);
		border: 1px dashed rgba(255,255,255,0.2);
		border-radius: 0.5rem;
		color: rgba(255,255,255,0.6);
		font-size: 0.82rem;
		padding: 0.4rem 0.8rem;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}

	.add-threshold:hover {
		background: rgba(255,255,255,0.14);
		color: white;
	}
</style>
