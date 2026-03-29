<script lang="ts">
	import { dashboard, lang, record, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let threshold: number = sel?.threshold ?? 20;
	let maxItems: number = sel?.max_items ?? 8;

	function set(key: string, event?: any) { sel = updateObj(sel, key, event); $dashboard = $dashboard; }
	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Battery Monitor</h1>

		<h2>Show</h2>
		<div class="button-container">
			<button class:selected={sel?.show_all !== false} on:click={()=>set('show_all', true)} use:Ripple={$ripple}>All batteries</button>
			<button class:selected={sel?.show_all === false} on:click={()=>set('show_all', false)} use:Ripple={$ripple}>Low only</button>
		</div>

		<h2>Low battery threshold (%)</h2>
		<input type="number" class="input" min="5" max="50" bind:value={threshold} on:change={()=>{sel.threshold=threshold;$dashboard=$dashboard;}} autocomplete="off" />

		<h2>Max items</h2>
		<input type="number" class="input" min="1" max="20" bind:value={maxItems} on:change={()=>{sel.max_items=maxItems;$dashboard=$dashboard;}} autocomplete="off" />

		<h2>{$lang('mobile')}</h2>
		<div class="button-container">
			<button class:selected={sel?.hide_mobile !== true} on:click={() => set('hide_mobile')} use:Ripple={$ripple}>{$lang('visible')}</button>
			<button class:selected={sel?.hide_mobile === true} on:click={() => set('hide_mobile', true)} use:Ripple={$ripple}>{$lang('hidden')}</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}
