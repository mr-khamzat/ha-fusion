<script lang="ts">
	import { lang } from '$lib/Stores';
	import { closeModal } from 'svelte-modals';
	import Modal from '$lib/Modal/Index.svelte';
	import type { SidebarItem } from '$lib/Types';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';

	export let isOpen: boolean;
	export let sel: SidebarItem;
</script>

<svelte:window on:keydown|capture={(e) => { if (e.key === 'Escape') { e.stopPropagation(); closeModal(); } }} />

{#if isOpen}
	<Modal size="large">
		<h1 slot="title">{$lang('options')}</h1>

		<ConfigButtons {sel} disableChangeType={true} />
	</Modal>
{/if}
