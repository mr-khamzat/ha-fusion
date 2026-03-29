<script lang="ts">
	import { dashboard, lang, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';
	let maxDevices: number = sel?.max_devices ?? 8;
	let entityIds: string[] = sel?.entity_ids ? [...sel.entity_ids] : [];

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function saveEntityIds() {
		sel.entity_ids = entityIds.filter(Boolean);
		$dashboard = $dashboard;
	}

	function addEntity() {
		entityIds = [...entityIds, ''];
		saveEntityIds();
	}

	function removeEntity(i: number) {
		entityIds = entityIds.filter((_, idx) => idx !== i);
		saveEntityIds();
	}

	$: options = $entityList('device_tracker');

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Device Tracker</h1>

		<h2>{$lang('name')}</h2>
		<InputClear
			condition={name}
			on:clear={() => { name = ''; set('name'); }}
			let:padding
		>
			<input
				type="text"
				class="input"
				bind:value={name}
				placeholder="Devices"
				on:change={(event) => set('name', event)}
				autocomplete="off"
				spellcheck="false"
				style:padding
			/>
		</InputClear>

		<h2>Max devices shown</h2>
		<input
			type="number"
			class="input"
			placeholder="8"
			min="1"
			max="50"
			bind:value={maxDevices}
			on:change={() => { sel.max_devices = maxDevices; $dashboard = $dashboard; }}
			autocomplete="off"
		/>

		<h2>Filter devices (leave empty for all)</h2>
		<div class="entities-list">
			{#each entityIds as eid, i}
				<div class="entity-row">
					<div class="entity-select">
						<Select
							computeIcons={true}
							{options}
							placeholder="device_tracker.*"
							value={eid}
							on:change={(event) => {
								entityIds[i] = event.detail;
								saveEntityIds();
							}}
						/>
					</div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<button class="remove-btn" on:click={() => removeEntity(i)}>×</button>
				</div>
			{/each}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="add-btn" on:click={addEntity} use:Ripple={$ripple}>+ Add device</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.entities-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.entity-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.entity-select {
		flex: 1;
	}

	.remove-btn {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		font-family: inherit;
		line-height: 1;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.25);
		color: #ef4444;
	}

	.add-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.82rem;
		padding: 0.4rem 0.8rem;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}

	.add-btn:hover {
		background: rgba(255, 255, 255, 0.14);
		color: white;
	}
</style>
