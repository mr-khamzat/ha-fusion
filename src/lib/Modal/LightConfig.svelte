<script lang="ts">
	import { states, dashboard, lang, record, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import { updateObj, getName } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	$: entity = $states?.[sel?.entity_id];
	$: defaultName = getName(undefined, entity) || sel?.entity_id || '';

	// Combine light + switch + input_boolean into one list
	$: options = [
		...$entityList('light'),
		...$entityList('switch'),
		...$entityList('input_boolean')
	].sort((a, b) => a.label.localeCompare(b.label));

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('light') || 'Light'}</h1>

		<h2>{$lang('entity')}</h2>

		<Select
			computeIcons={true}
			{options}
			placeholder="light / switch / input_boolean"
			value={entity?.entity_id}
			on:change={(event) => set('entity_id', event)}
		/>

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			on:clear={() => { name = ''; set('name'); }}
			let:padding
		>
			<input
				class="input"
				type="text"
				bind:value={name}
				placeholder={defaultName}
				on:change={(event) => set('name', event)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<ConfigButtons {sel} />
	</Modal>
{/if}
