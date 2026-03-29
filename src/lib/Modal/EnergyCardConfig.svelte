<script lang="ts">
	import { dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	$: options = $entityList('sensor');

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Energy Card</h1>

		<h2>Power sensor (W/kW)</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder="sensor.power"
			value={sel?.power_entity}
			on:change={(event) => set('power_entity', event)}
		/>

		<h2>Energy sensor (kWh, optional)</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder="sensor.energy_today"
			value={sel?.energy_entity}
			on:change={(event) => set('energy_entity', event)}
		/>

		<h2>Solar sensor (W, optional)</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder="sensor.solar_power"
			value={sel?.solar_entity}
			on:change={(event) => set('solar_entity', event)}
		/>

		<h2>{$lang('name')}</h2>
		<InputClear
			condition={name}
			on:clear={() => { name = ''; set('name'); }}
			let:padding
		>
			<input
				type="text"
				class="input"
				class:placeholder={!name}
				bind:value={name}
				placeholder="Energy"
				on:change={(event) => set('name', event)}
				autocomplete="off"
				spellcheck="false"
				style:padding
			/>
		</InputClear>

		<ConfigButtons {sel} />
	</Modal>
{/if}
