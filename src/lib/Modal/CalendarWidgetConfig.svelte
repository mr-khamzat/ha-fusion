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

	let daysAhead: number = sel?.days_ahead ?? 7;
	let maxEvents: number = sel?.max_events ?? 5;

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	$: options = $entityList('calendar');

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Calendar</h1>

		<h2>{$lang('entity')}</h2>
		<Select
			computeIcons={true}
			{options}
			placeholder="calendar.*"
			value={sel?.entity_id}
			on:change={(event) => set('entity_id', event)}
		/>

		<h2>Days ahead</h2>
		<input
			type="number"
			class="input"
			placeholder="7"
			min="1"
			max="30"
			bind:value={daysAhead}
			on:change={() => { sel.days_ahead = daysAhead; $dashboard = $dashboard; }}
			autocomplete="off"
		/>

		<h2>Max events</h2>
		<input
			type="number"
			class="input"
			placeholder="5"
			min="1"
			max="20"
			bind:value={maxEvents}
			on:change={() => { sel.max_events = maxEvents; $dashboard = $dashboard; }}
			autocomplete="off"
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
