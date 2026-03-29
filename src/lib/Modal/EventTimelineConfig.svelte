<script lang="ts">
	import { dashboard, record, ripple, entityList } from '$lib/Stores';
	import { closeModal } from 'svelte-modals';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from 'svelte-ripple';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';

	export let isOpen: boolean;
	export let sel: any;

	$: entityIds = (sel?.entity_ids as string[]) || [];
	$: maxEvents = sel?.max_events || 20;
	$: period = sel?.period || 'hour';

	const periodOptions = [
		{ id: 'hour', label: '1 час' },
		{ id: '3hour', label: '3 часа' },
		{ id: '12hour', label: '12 часов' },
		{ id: 'day', label: '24 часа' },
		{ id: 'week', label: '7 дней' }
	];

	$: allEntities = $entityList('').map((e) => ({ id: e.id, label: e.label || e.id }));

	function set(key: string, value: any) {
		if (!sel) return;
		(sel as any)[key] = value;
		$dashboard = $dashboard;
	}

	function addEntity(id: string | undefined) {
		if (!id || entityIds.includes(id)) return;
		set('entity_ids', [...entityIds, id]);
	}

	function removeEntity(id: string) {
		set('entity_ids', entityIds.filter((e) => e !== id));
	}

	function getLabel(id: string): string {
		return allEntities.find((e) => e.id === id)?.label || id;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Лента событий</h1>

		<h2>Название</h2>
		<InputClear condition={sel?.name} on:clear={() => set('name', '')}>
			<input
				type="text"
				placeholder="Необязательно"
				class="input"
				value={sel?.name || ''}
				on:input={(e) => set('name', e.currentTarget.value)}
			/>
		</InputClear>

		<h2>Период</h2>
		<div class="button-container">
			{#each periodOptions as opt}
				<button
					class:selected={period === opt.id}
					on:click={() => set('period', opt.id)}
					use:Ripple={$ripple}
				>{opt.label}</button>
			{/each}
		</div>

		<h2>Макс. событий</h2>
		<div class="timeout-row">
			<input
				type="range"
				min="5"
				max="50"
				step="5"
				value={maxEvents}
				class="slider"
				on:input={(e) => set('max_events', parseInt(e.currentTarget.value))}
			/>
			<span class="val">{maxEvents}</span>
		</div>

		<h2>Отслеживаемые сущности</h2>
		<p class="hint">Добавьте сущности, события которых нужно отображать</p>

		{#each entityIds as id}
			<div class="chip-row">
				<span class="chip">{getLabel(id)}</span>
				<button class="chip-remove" on:click={() => removeEntity(id)}>✕</button>
			</div>
		{/each}

		<div class="entity-select">
			<Select
				value={undefined}
				options={allEntities.filter((e) => !entityIds.includes(e.id))}
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
	h2 {
		margin: 1.2rem 0 0.5rem 0;
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.hint {
		font-size: 0.8rem;
		opacity: 0.5;
		margin: 0.2rem 0 0.5rem;
	}

	.button-container {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.button-container button {
		padding: 0.35rem 0.75rem;
		border-radius: 0.4rem;
		border: 1px solid rgba(255,255,255,0.15);
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.85rem;
		position: relative;
		overflow: hidden;
	}

	.button-container button.selected {
		background: rgba(255,193,7,0.2);
		border-color: rgba(255,193,7,0.5);
		color: #ffc107;
	}

	.timeout-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.slider {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 5px;
		border-radius: 3px;
		background: rgba(255,255,255,0.15);
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #ffc107;
		cursor: pointer;
	}

	.val {
		font-size: 0.9rem;
		min-width: 2rem;
		text-align: right;
		opacity: 0.8;
	}

	.chip-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.3rem;
	}

	.chip {
		background: rgba(255,193,7,0.15);
		border: 1px solid rgba(255,193,7,0.3);
		color: #ffc107;
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
		color: rgba(255,255,255,0.4);
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.1rem 0.3rem;
		border-radius: 0.3rem;
		flex-shrink: 0;
	}

	.chip-remove:hover {
		color: rgba(239,68,68,0.8);
	}

	.entity-select {
		margin-top: 0.5rem;
	}

	.buttons {
		border-top: 1px solid rgba(255,255,255,0.1);
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
		background: rgba(255,193,7,0.2);
		border: 1px solid rgba(255,193,7,0.4);
		color: #ffc107;
	}

	.input {
		width: 100%;
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 0.4rem;
		padding: 0.5rem 0.75rem;
		color: inherit;
		font-size: 0.9rem;
		outline: none;
	}
</style>
