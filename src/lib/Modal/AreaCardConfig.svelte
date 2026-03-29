<script lang="ts">
	import { states, dashboard, lang, record, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Select from '$lib/Components/Select.svelte';
	import { updateObj } from '$lib/Utils';
	import Icon from '@iconify/svelte';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';
	let icon: string = sel?.icon || '';
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

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('area_overview') || 'Area Overview'}</h1>

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
				placeholder="Living Room"
				on:change={(event) => set('name', event)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<h2>{$lang('icon')}</h2>
		<InputClear
			condition={icon}
			on:clear={() => { icon = ''; set('icon'); }}
			let:padding
		>
			<input
				class="input"
				type="text"
				bind:value={icon}
				placeholder="mdi:sofa"
				on:change={(event) => set('icon', event)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<h2>{$lang('entities') || 'Entities'}</h2>

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
				placeholder={$lang('add_entity') || 'Add entity...'}
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
