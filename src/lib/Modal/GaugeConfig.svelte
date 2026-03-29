<script lang="ts">
	import { states, dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Gauge from '$lib/Sidebar/Gauge.svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj, getName } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let name = sel?.name;
	let min: number = sel?.min ?? 0;
	let maxVal: number = sel?.max ?? 100;
	let unit: string = sel?.unit || '';
	let thresholds: { value: number; color: string }[] = sel?.thresholds || [];

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function saveThresholds() {
		sel.thresholds = thresholds.length > 0 ? [...thresholds] : undefined;
		$dashboard = $dashboard;
	}

	function addThreshold() {
		thresholds = [...thresholds, { value: 0, color: '#ffffff' }];
		saveThresholds();
	}

	function removeThreshold(i: number) {
		thresholds = thresholds.filter((_, idx) => idx !== i);
		saveThresholds();
	}

	$: entity_id = sel?.entity_id;
	$: options = $entityList('sensor');

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Gauge</h1>

		<h2>{$lang('preview')}</h2>
		<div class="preview">
			<Gauge {entity_id} {name} {min} max={maxVal} {unit} {thresholds} />
		</div>

		<h2>{$lang('entity')}</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder={$lang('entity')}
			value={entity_id}
			on:change={(event) => set('entity_id', event)}
		/>

		<h2>{$lang('name')}</h2>
		<InputClear
			condition={name}
			on:clear={() => { name = undefined; set('name'); }}
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

		<h2>Min / Max</h2>
		<div class="row">
			<input
				type="number"
				class="input"
				placeholder="0"
				bind:value={min}
				on:change={() => { sel.min = min; $dashboard = $dashboard; }}
				autocomplete="off"
			/>
			<input
				type="number"
				class="input"
				placeholder="100"
				bind:value={maxVal}
				on:change={() => { sel.max = maxVal; $dashboard = $dashboard; }}
				autocomplete="off"
			/>
		</div>

		<h2>Unit</h2>
		<InputClear
			condition={unit}
			on:clear={() => { unit = ''; set('unit'); }}
			let:padding
		>
			<input
				type="text"
				class="input"
				bind:value={unit}
				placeholder="auto"
				on:change={(event) => set('unit', event)}
				autocomplete="off"
				style:padding
			/>
		</InputClear>

		<h2>Color Thresholds</h2>
		<div class="thresholds">
			{#each thresholds as threshold, i}
				<div class="threshold-row">
					<span class="threshold-at">≥</span>
					<input
						type="number"
						class="input threshold-val"
						bind:value={threshold.value}
						on:change={saveThresholds}
						placeholder="0"
					/>
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
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="add-threshold" on:click={addThreshold} use:Ripple={$ripple}>+ Add threshold</button>
		</div>

		<h2>{$lang('mobile')}</h2>
		<div class="button-container">
			<button class:selected={sel?.hide_mobile !== true} on:click={() => set('hide_mobile')} use:Ripple={$ripple}>
				{$lang('visible')}
			</button>
			<button class:selected={sel?.hide_mobile === true} on:click={() => set('hide_mobile', true)} use:Ripple={$ripple}>
				{$lang('hidden')}
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.preview {
		margin-bottom: 0.5rem;
		display: flex;
		justify-content: center;
	}

	.row {
		display: flex;
		gap: 0.5rem;
	}

	.row .input {
		flex: 1;
	}

	.thresholds {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.25rem;
	}

	.threshold-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.threshold-at {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.9rem;
		width: 1rem;
		text-align: center;
	}

	.threshold-val {
		width: 4.5rem;
		padding: 0.4rem 0.5rem;
	}

	.color-picker {
		width: 2.2rem;
		height: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.35rem;
		background: none;
		cursor: pointer;
		padding: 0.1rem;
	}

	.remove-threshold {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.5);
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
		background: rgba(239, 68, 68, 0.25);
		color: #ef4444;
	}

	.add-threshold {
		background: rgba(255, 255, 255, 0.08);
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.82rem;
		padding: 0.4rem 0.8rem;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}

	.add-threshold:hover {
		background: rgba(255, 255, 255, 0.14);
		color: white;
	}
</style>
