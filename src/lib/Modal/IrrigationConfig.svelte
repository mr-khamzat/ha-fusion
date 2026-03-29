<script lang="ts">
	import { dashboard, record, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || 'Полив';
	let entity_ids: string[] = sel?.entity_ids ? [...sel.entity_ids] : [''];

	$: options = [
		...$entityList('switch'),
		...$entityList('input_boolean'),
		...$entityList('binary_sensor')
	].sort((a, b) => a.label.localeCompare(b.label));

	function save() {
		sel = updateObj(sel, 'name', { target: { value: name } });
		sel.entity_ids = entity_ids.filter(Boolean);
		$dashboard = $dashboard;
	}

	function addZone() { entity_ids = [...entity_ids, '']; }
	function removeZone(i: number) { entity_ids = entity_ids.filter((_, idx) => idx !== i); save(); }
	function setZone(i: number, val: string) { entity_ids[i] = val; save(); }

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Полив · Irrigation</h1>

		<h2>Название</h2>
		<input class="input" type="text" bind:value={name} on:change={save} autocomplete="off" />

		<h2>Зоны полива</h2>
		{#each entity_ids as zone, i}
			<div class="zone-row">
				<div class="zone-select">
					<Select {options} value={zone} placeholder="switch.zone_{i + 1}" on:change={(e) => setZone(i, e.detail)} />
				</div>
				<button class="remove-btn" on:click={() => removeZone(i)}>✕</button>
			</div>
		{/each}
		<button class="add-btn" on:click={addZone}>+ Добавить зону</button>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.zone-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.4rem; }
	.zone-select { flex: 1; }
	.remove-btn { background: rgba(248,113,113,0.12); border: none; color: rgba(248,113,113,0.8); border-radius: 0.4rem; padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.8rem; }
	.add-btn { margin-top: 0.3rem; width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.15); border-radius: 0.5rem; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; font-size: 0.8rem; }
	.add-btn:hover { background: rgba(255,255,255,0.08); }
</style>
