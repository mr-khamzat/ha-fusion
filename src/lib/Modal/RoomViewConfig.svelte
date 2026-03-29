<script lang="ts">
	import { dashboard, record, lang, ripple, states, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Select from '$lib/Components/Select.svelte';
	import { updateObj } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';
	let areaId: string = sel?.area_id || '';
	let tempEntity: string = sel?.temp_entity || '';
	let entityIds: string[] = sel?.entity_ids || [];
	let addingEntity = '';

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function setEntityIds() {
		sel.entity_ids = [...entityIds];
		$dashboard = $dashboard;
	}

	function addEntity(entity_id: string) {
		if (entity_id && !entityIds.includes(entity_id)) {
			entityIds = [...entityIds, entity_id];
			setEntityIds();
		}
		addingEntity = '';
	}

	function removeEntity(id: string) {
		entityIds = entityIds.filter((e) => e !== id);
		setEntityIds();
	}

	$: allOptions = $entityList('');
	$: sensorOptions = $entityList('sensor');
	$: lightOptions = $entityList('light');

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Вид комнаты</h1>

		<h2>{$lang('name')}</h2>
		<InputClear
			condition={name}
			on:clear={() => { name = ''; set('name'); }}
			let:padding
		>
			<input
				class="input"
				type="text"
				bind:value={name}
				placeholder="Гостиная"
				on:change={(event) => set('name', event)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<h2>Area ID <span class="hint">(необязательно)</span></h2>
		<InputClear
			condition={areaId}
			on:clear={() => { areaId = ''; set('area_id'); }}
			let:padding
		>
			<input
				class="input"
				type="text"
				bind:value={areaId}
				placeholder="living_room"
				on:change={(event) => set('area_id', event)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<h2>Датчик температуры <span class="hint">(необязательно)</span></h2>
		<Select
			computeIcons={true}
			options={sensorOptions}
			placeholder="sensor.temperature..."
			value={tempEntity}
			on:change={(e) => {
				const val = e?.detail?.value ?? e?.target?.value;
				tempEntity = val || '';
				if (val) {
					sel.temp_entity = val;
				} else {
					delete sel.temp_entity;
				}
				$dashboard = $dashboard;
			}}
		/>

		<h2>Объекты <span class="hint">(переопределяет area_id)</span></h2>

		{#if entityIds.length > 0}
			<div class="entity-list">
				{#each entityIds as id}
					<div class="entity-chip">
						<span class="chip-id">{id}</span>
						<button class="chip-remove" on:click={() => removeEntity(id)} aria-label="Remove">×</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="add-entity">
			<Select
				computeIcons={true}
				options={allOptions}
				placeholder={$lang('add_entity') || 'Добавить объект...'}
				value={addingEntity}
				on:change={(e) => {
					const val = e?.detail?.value ?? e?.target?.value;
					if (val) addEntity(val);
				}}
			/>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.hint {
		font-size: 0.75rem;
		font-weight: 400;
		opacity: 0.5;
	}

	.entity-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
	}

	.entity-chip {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		padding: 0.25rem 0.25rem 0.25rem 0.65rem;
		gap: 0.3rem;
		max-width: 100%;
	}

	.chip-id {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.8);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip-remove {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 50%;
		width: 18px;
		height: 18px;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		flex-shrink: 0;
		font-family: inherit;
		line-height: 1;
	}

	.chip-remove:hover {
		background: rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.add-entity {
		margin-top: 0.25rem;
	}
</style>
