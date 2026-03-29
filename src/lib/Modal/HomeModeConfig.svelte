<script lang="ts">
	import { dashboard, record, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';

	export let isOpen: boolean;
	export let sel: any;

	let entity_id: string = sel?.entity_id || '';

	$: options = [
		...$entityList('input_select'),
		...$entityList('select')
	].sort((a, b) => a.label.localeCompare(b.label));

	function save() {
		sel.entity_id = entity_id;
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Режим дома</h1>

		<p class="hint">Выбери input_select объект для отслеживания режима дома. Если не выбрать — используются кнопки-сцены по умолчанию.</p>

		<h2>Объект режима (input_select)</h2>
		<Select {options} value={entity_id} placeholder="input_select.home_mode" on:change={(e) => { entity_id = e.detail; save(); }} />

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.hint { font-size: 0.75rem; color: rgba(255,255,255,0.35); margin: 0 0 1rem; line-height: 1.4; }
</style>
