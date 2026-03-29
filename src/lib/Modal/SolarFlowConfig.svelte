<script lang="ts">
	import { dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	$: options = $entityList('sensor');

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Solar Flow</h1>

		<h2>Solar production sensor</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder="sensor.solar_power"
			value={sel?.solar_entity}
			on:change={(event) => set('solar_entity', event)}
		/>

		<h2>Grid power sensor</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder="sensor.grid_power"
			value={sel?.grid_entity}
			on:change={(event) => set('grid_entity', event)}
		/>

		<h2>Home consumption sensor</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder="sensor.home_power"
			value={sel?.home_entity}
			on:change={(event) => set('home_entity', event)}
		/>

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
