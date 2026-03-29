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

	$: options = $entityList('cover');
	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Cover / Shutter</h1>

		<h2>{$lang('entity')}</h2>
		<Select computeIcons={true} {options} placeholder="cover.*" value={sel?.entity_id}
			on:change={(event) => set('entity_id', event)} />

		<h2>{$lang('name')}</h2>
		<InputClear condition={name} on:clear={() => { name = ''; set('name'); }} let:padding>
			<input type="text" class="input" bind:value={name} placeholder="Cover" on:change={(event) => set('name', event)} autocomplete="off" spellcheck="false" style:padding />
		</InputClear>

		<ConfigButtons {sel} />
	</Modal>
{/if}
