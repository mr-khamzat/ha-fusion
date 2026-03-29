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

	function set(key: string, event?: any) { sel = updateObj(sel, key, event); $dashboard = $dashboard; }
	$: options = $entityList('media_player');
	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Album Art</h1>

		<h2>{$lang('entity')}</h2>
		<Select computeIcons={true} {options} placeholder="media_player.*" value={sel?.entity_id} on:change={(e)=>set('entity_id', e)} />

		<h2>{$lang('mobile')}</h2>
		<div class="button-container">
			<button class:selected={sel?.hide_mobile !== true} on:click={() => set('hide_mobile')} use:Ripple={$ripple}>{$lang('visible')}</button>
			<button class:selected={sel?.hide_mobile === true} on:click={() => set('hide_mobile', true)} use:Ripple={$ripple}>{$lang('hidden')}</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}
