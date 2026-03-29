<script lang="ts">
	import { dashboard, record, lang, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Select from '$lib/Components/Select.svelte';
	import { updateObj } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';
	let addingScene = '';
	let entityIds: string[] = sel?.entity_ids || [];

	$: sceneOptions = $entityList('scene');

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function setEntityIds() {
		sel.entity_ids = [...entityIds];
		$dashboard = $dashboard;
	}

	function addScene(entity_id: string) {
		if (entity_id && !entityIds.includes(entity_id)) {
			entityIds = [...entityIds, entity_id];
			setEntityIds();
		}
		addingScene = '';
	}

	function removeScene(id: string) {
		entityIds = entityIds.filter((e) => e !== id);
		setEntityIds();
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('scenes') || 'Scenes'}</h1>

		<h2>{$lang('name') || 'Name'}</h2>
		<InputClear
			condition={name}
			on:clear={() => { name = ''; set('name'); }}
			let:padding
		>
			<input
				class="input"
				type="text"
				bind:value={name}
				placeholder="Scenes"
				on:change={(e) => set('name', e)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<h2>{$lang('scenes') || 'Scenes'}</h2>

		{#if entityIds.length > 0}
			<div class="chip-list">
				{#each entityIds as id}
					<div class="chip">
						<span class="chip-dot"></span>
						<span class="chip-label">{id.split('.')[1]}</span>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<button class="chip-remove" on:click={() => removeScene(id)}>×</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="add-row">
			<Select
				computeIcons={true}
				options={sceneOptions}
				placeholder={$lang('add_entity') || 'Add scene...'}
				value={addingScene}
				on:change={(e) => {
					const val = e?.detail?.value ?? e?.target?.value;
					if (val) addScene(val);
				}}
			/>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.chip-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
	}

	.chip {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		padding: 0.25rem 0.25rem 0.25rem 0.6rem;
		gap: 0.3rem;
	}

	.chip-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: rgba(251, 191, 36, 0.7);
		flex-shrink: 0;
	}

	.chip-label {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.8);
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

	.add-row {
		margin-top: 0.25rem;
	}
</style>
