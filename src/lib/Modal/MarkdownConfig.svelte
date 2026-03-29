<script lang="ts">
	import { dashboard, lang, record, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let text: string = sel?.text || '';

	function set(key: string, event?: any) { sel = updateObj(sel, key, event); $dashboard = $dashboard; }
	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Text / Markdown</h1>

		<h2>Content (HTML supported)</h2>
		<textarea
			class="input textarea"
			bind:value={text}
			placeholder="Hello <b>World</b>&#10;&#10;Any HTML here..."
			on:change={() => { sel.text = text; $dashboard = $dashboard; }}
			rows="6"
			spellcheck="false"
		></textarea>

		<h2>Font size</h2>
		<div class="button-container">
			{#each [['Small', '0.72rem'], ['Normal', '0.82rem'], ['Large', '0.95rem']] as [label, size]}
				<button class:selected={sel?.font_size === size} on:click={() => set('font_size', size)} use:Ripple={$ripple}>{label}</button>
			{/each}
		</div>

		<h2>{$lang('mobile')}</h2>
		<div class="button-container">
			<button class:selected={sel?.hide_mobile !== true} on:click={() => set('hide_mobile')} use:Ripple={$ripple}>{$lang('visible')}</button>
			<button class:selected={sel?.hide_mobile === true} on:click={() => set('hide_mobile', true)} use:Ripple={$ripple}>{$lang('hidden')}</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.textarea {
		resize: vertical;
		font-family: monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		min-height: 7rem;
	}
</style>
