<script lang="ts">
	import { states, connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attrs = (entity?.attributes || {}) as Record<string, any>;
	$: name = sel?.name || getName(undefined, entity) || entity_id || 'To-Do';

	// Items may be in attributes, or we fall back to empty
	// The entity state is the count of items needing action
	$: itemCount = parseInt(entity?.state || '0') || 0;
	$: rawItems = (attrs.items as any[]) || [];
	$: items = rawItems
		.filter((it: any) => it?.status !== 'completed')
		.slice(0, 6)
		.map((it: any) => ({
			uid: (it?.uid as string) || (it?.summary as string) || '',
			summary: (it?.summary as string) || (it?.name as string) || '(без названия)',
			status: (it?.status as string) || 'needs_action'
		}));

	// Add-item input
	let showInput = false;
	let newItem = '';

	function toggleInput() {
		if ($editMode) return;
		showInput = !showInput;
		if (!showInput) newItem = '';
	}

	async function addItem() {
		const trimmed = newItem.trim();
		if (!trimmed || !entity_id) return;
		newItem = '';
		showInput = false;
		await callService($connection, 'todo', 'add_item', { entity_id, item: trimmed });
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addItem();
		} else if (e.key === 'Escape') {
			showInput = false;
			newItem = '';
		}
	}

	function completeItem(itemName: string) {
		if ($editMode) return;
		callService($connection, 'todo', 'update_item', {
			entity_id,
			item: itemName,
			status: 'completed'
		});
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'todo',
				title: 'To-Do List'
			});
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="todo-card"
	on:click={handleClick}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.03)' }}
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
>
	{#if !entity_id}
		<div class="empty-state">
			<Icon icon="mdi:checkbox-marked-outline" height="28" width="28" style="opacity:0.3" />
			<span>Настроить список дел</span>
		</div>
	{:else}
		<!-- Header -->
		<div class="todo-header">
			<Icon icon="mdi:format-list-checks" height="15" width="15" style="color:rgba(147,197,253,0.7);flex-shrink:0" />
			<span class="todo-name">{name}</span>
			{#if itemCount > 0}
				<span class="item-badge">{itemCount}</span>
			{/if}
		</div>

		<!-- Items list -->
		{#if items.length > 0}
			<div class="items-list">
				{#each items as item (item.uid || item.summary)}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="todo-item"
						on:click|stopPropagation={() => !$editMode && completeItem(item.summary)}
						use:Ripple={!$editMode ? $ripple : { color: 'transparent' }}
						style:cursor={$editMode ? 'default' : 'pointer'}
					>
						<div class="item-check">
							<Icon icon="mdi:checkbox-blank-circle-outline" height="14" width="14" style="color:rgba(255,255,255,0.25)" />
						</div>
						<span class="item-text">{item.summary}</span>
					</div>
				{/each}
			</div>
		{:else if itemCount === 0}
			<div class="all-done">
				<Icon icon="mdi:check-all" height="18" width="18" style="color:rgba(52,211,153,0.6)" />
				<span>Всё готово!</span>
			</div>
		{/if}

		<!-- Add item -->
		{#if !$editMode}
			<div class="add-row">
				{#if showInput}
					<!-- svelte-ignore a11y-autofocus -->
					<input
						class="add-input"
						type="text"
						placeholder="Новый пункт..."
						bind:value={newItem}
						on:keydown={onKeydown}
						on:click|stopPropagation
						autofocus
					/>
					<button class="add-confirm" on:click|stopPropagation={addItem} use:Ripple={$ripple}>
						<Icon icon="mdi:check" height="14" width="14" />
					</button>
					<button class="add-cancel" on:click|stopPropagation={toggleInput} use:Ripple={$ripple}>
						<Icon icon="mdi:close" height="14" width="14" />
					</button>
				{:else}
					<button class="add-btn" on:click|stopPropagation={toggleInput} use:Ripple={$ripple}>
						<Icon icon="mdi:plus" height="14" width="14" />
						<span>Добавить</span>
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.todo-card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.85rem 1rem;
		height: 100%;
		min-height: 5rem;
		box-sizing: border-box;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.8rem;
	}

	.todo-header {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.todo-name {
		flex: 1;
		font-size: 0.78rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.65);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-badge {
		background: rgba(147, 197, 253, 0.15);
		color: rgba(147, 197, 253, 0.9);
		border-radius: 999px;
		padding: 0.05rem 0.4rem;
		font-size: 0.68rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.todo-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.4rem;
		border-radius: 0.35rem;
		transition: background 0.15s;
		position: relative;
		overflow: hidden;
	}

	.todo-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.item-check {
		flex-shrink: 0;
		display: flex;
	}

	.item-text {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}

	.all-done {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: rgba(52, 211, 153, 0.5);
		padding: 0.3rem 0;
	}

	.add-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: auto;
		padding-top: 0.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.3);
		font-family: inherit;
		font-size: 0.72rem;
		cursor: pointer;
		padding: 0.2rem 0.3rem;
		border-radius: 0.3rem;
		transition: color 0.15s;
		position: relative;
		overflow: hidden;
	}

	.add-btn:hover {
		color: rgba(255, 255, 255, 0.55);
	}

	.add-input {
		flex: 1;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.35rem;
		color: rgba(255, 255, 255, 0.85);
		font-family: inherit;
		font-size: 0.75rem;
		padding: 0.3rem 0.5rem;
		outline: none;
		min-width: 0;
	}

	.add-input::placeholder {
		color: rgba(255, 255, 255, 0.25);
	}

	.add-input:focus {
		border-color: rgba(147, 197, 253, 0.35);
	}

	.add-confirm {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(52, 211, 153, 0.15);
		color: rgba(52, 211, 153, 0.9);
		border: none;
		border-radius: 0.35rem;
		width: 26px;
		height: 26px;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
		position: relative;
		overflow: hidden;
	}

	.add-confirm:hover {
		background: rgba(52, 211, 153, 0.25);
	}

	.add-cancel {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.4);
		border: none;
		border-radius: 0.35rem;
		width: 26px;
		height: 26px;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
		position: relative;
		overflow: hidden;
	}

	.add-cancel:hover {
		background: rgba(255, 255, 255, 0.12);
	}
</style>
