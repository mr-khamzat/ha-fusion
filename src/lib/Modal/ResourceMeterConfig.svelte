<script lang="ts">
	import { dashboard, record, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';
	let entity_id: string = sel?.entity_id || '';
	let entity_id_daily: string = sel?.entity_id_daily || '';
	let entity_id_monthly: string = sel?.entity_id_monthly || '';
	let resource_type: string = sel?.resource_type || 'water';
	let unit: string = sel?.unit || '';

	$: options = $entityList('sensor').sort((a, b) => a.label.localeCompare(b.label));

	function save() {
		sel.name = name;
		sel.unit = unit;
		sel.resource_type = resource_type;
		sel.entity_id = entity_id;
		sel.entity_id_daily = entity_id_daily;
		sel.entity_id_monthly = entity_id_monthly;
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Счётчик ресурса</h1>

		<h2>Тип ресурса</h2>
		<div class="type-row">
			{#each [['water','💧 Вода'], ['gas','🔥 Газ'], ['electricity','⚡ Электричество']] as [val, label]}
				<button class="type-btn" class:active={resource_type === val} on:click={() => { resource_type = val; save(); }}>{label}</button>
			{/each}
		</div>

		<h2>Название</h2>
		<input class="input" type="text" bind:value={name} on:change={save} autocomplete="off" placeholder="Холодная вода" />

		<h2>Единица измерения</h2>
		<input class="input" type="text" bind:value={unit} on:change={save} autocomplete="off" placeholder="м³" />

		<h2>Основной сенсор (общий счётчик)</h2>
		<Select {options} value={entity_id} placeholder="sensor.water_total" on:change={(e) => { entity_id = e.detail; save(); }} />

		<h2>Сенсор за сегодня</h2>
		<Select {options} value={entity_id_daily} placeholder="sensor.water_daily" on:change={(e) => { entity_id_daily = e.detail; save(); }} />

		<h2>Сенсор за месяц</h2>
		<Select {options} value={entity_id_monthly} placeholder="sensor.water_monthly" on:change={(e) => { entity_id_monthly = e.detail; save(); }} />

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.type-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
	.type-btn { flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; color: rgba(255,255,255,0.6); cursor: pointer; font-family: inherit; font-size: 0.8rem; transition: all 0.15s; }
	.type-btn.active { background: rgba(96,165,250,0.15); border-color: rgba(96,165,250,0.4); color: rgba(147,197,253,0.95); }
</style>
