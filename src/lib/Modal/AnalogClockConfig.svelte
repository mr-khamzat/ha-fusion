<script lang="ts">
	import { dashboard, lang, record, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
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

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Analog Clock</h1>

		<h2>Second hand</h2>
		<div class="button-container">
			<button class:selected={sel?.show_seconds !== false} on:click={() => set('show_seconds', true)} use:Ripple={$ripple}>
				Show
			</button>
			<button class:selected={sel?.show_seconds === false} on:click={() => set('show_seconds', false)} use:Ripple={$ripple}>
				Hide
			</button>
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
