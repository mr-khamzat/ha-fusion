<script lang="ts">
	/**
	 * Generic config modal for entity-based main cards:
	 * climate, light, media_player
	 */
	import { states, dashboard, lang, record, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import { updateObj, getName } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;
	/** domain filter e.g. 'climate', 'light', 'media_player' */
	export let domain: string = '';
	/** display title */
	export let title: string = '';

	let name: string = sel?.name || '';

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	$: entity = $states?.[sel?.entity_id];
	$: options = domain ? $entityList(domain) : [];
	$: defaultName = getName(undefined, entity) || sel?.entity_id || '';

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{title || $lang(domain) || domain}</h1>

		<h2>{$lang('entity')}</h2>

		<Select
			computeIcons={true}
			{options}
			placeholder={domain}
			value={entity?.entity_id}
			on:change={(event) => set('entity_id', event)}
		/>

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			on:clear={() => {
				name = '';
				set('name');
			}}
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
