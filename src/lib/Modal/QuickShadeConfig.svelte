<script lang="ts">
	import { dashboard, record, ripple, entityList } from '$lib/Stores';
	import { closeModal } from 'svelte-modals';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from 'svelte-ripple';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';

	export let isOpen: boolean;

	$: entities = (($dashboard?.quick_shade_entities as string[]) || []);

	$: allOptions = $entityList('')
		.filter((e) => ['light','switch','input_boolean','fan','cover','lock','automation','script','scene'].some((d) => e.id.startsWith(d + '.')))
		.map((e) => ({ id: e.id, label: e.label || e.id }));

	function set(value: string[]) {
		$dashboard.quick_shade_entities = value;
		$dashboard = $dashboard;
	}

	function addEntity(id: string | undefined) {
		if (!id || entities.includes(id)) return;
		set([...entities, id]);
	}

	function removeEntity(id: string) {
		set(entities.filter((e) => e !== id));
	}

	function getLabel(id: string): string {
		return allOptions.find((e) => e.id === id)?.label || id;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Быстрые действия</h1>

		<p class="hint">
			Сущности, отображаемые в шторке быстрых действий (свайп вниз сверху экрана).
		</p>

		{#each entities as id, i}
			<div class="chip-row">
				<span class="order">{i + 1}</span>
				<span class="chip">{getLabel(id)}</span>
				<button class="chip-remove" on:click={() => removeEntity(id)}>✕</button>
			</div>
		{/each}

		<div class="entity-select">
			<Select
				value={undefined}
				options={allOptions.filter((e) => !entities.includes(e.id))}
				placeholder="Добавить сущность..."
				clearable={false}
				on:change={(e) => addEntity(e.detail)}
			/>
		</div>

		<div class="buttons">
			<button class="action done" on:click={closeModal} use:Ripple={$ripple}>Готово</button>
		</div>
	</Modal>
{/if}

<style>
	.hint {
		font-size: 0.82rem;
		opacity: 0.5;
		margin: 0 0 1rem;
		line-height: 1.5;
	}

	.chip-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
	}

	.order {
		font-size: 0.75rem;
		opacity: 0.4;
		min-width: 1.2rem;
		text-align: right;
	}

	.chip {
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.4rem;
		padding: 0.2rem 0.6rem;
		font-size: 0.82rem;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip-remove {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.1rem 0.3rem;
		border-radius: 0.3rem;
	}

	.chip-remove:hover {
		color: rgba(239, 68, 68, 0.8);
	}

	.entity-select {
		margin-top: 0.5rem;
	}

	.buttons {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: 1.5rem;
		padding-top: 1.2rem;
		display: flex;
		justify-content: flex-end;
	}

	.action {
		padding: 0.5rem 1.2rem;
		border-radius: 0.4rem;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		position: relative;
		overflow: hidden;
	}

	.done {
		background: rgba(255, 193, 7, 0.2);
		border: 1px solid rgba(255, 193, 7, 0.4);
		color: #ffc107;
	}
</style>
