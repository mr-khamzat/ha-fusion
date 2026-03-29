<script lang="ts">
	import { states, dashboard, lang, record, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	let name: string = sel?.name || '';
	let actions: { id: string; label: string; icon: string; entity_id: string; domain: string; service: string }[] =
		sel?.actions ? JSON.parse(JSON.stringify(sel.actions)) : [];

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function saveActions() {
		sel.actions = actions.length > 0 ? JSON.parse(JSON.stringify(actions)) : undefined;
		$dashboard = $dashboard;
	}

	function addAction() {
		actions = [...actions, { id: String(Date.now()), label: '', icon: 'mdi:toggle-switch', entity_id: '', domain: 'switch', service: 'toggle' }];
		saveActions();
	}

	function removeAction(i: number) {
		actions = actions.filter((_, idx) => idx !== i);
		saveActions();
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Quick Actions</h1>

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
				placeholder="Quick Actions"
				on:change={(event) => set('name', event)}
				autocomplete="off"
				spellcheck="false"
				style:padding
			/>
		</InputClear>

		<h2>Actions</h2>

		<div class="actions-list">
			{#each actions as action, i}
				<div class="action-item">
					<div class="action-row">
						<input
							type="text"
							class="input"
							placeholder="Label"
							bind:value={action.label}
							on:change={saveActions}
							autocomplete="off"
						/>
						<input
							type="text"
							class="input icon-input"
							placeholder="mdi:toggle-switch"
							bind:value={action.icon}
							on:change={saveActions}
							autocomplete="off"
						/>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<button class="remove-btn" on:click={() => removeAction(i)}>×</button>
					</div>
					<div class="action-row">
						<input
							type="text"
							class="input"
							placeholder="entity_id"
							bind:value={action.entity_id}
							on:change={saveActions}
							autocomplete="off"
						/>
						<input
							type="text"
							class="input domain-input"
							placeholder="domain"
							bind:value={action.domain}
							on:change={saveActions}
							autocomplete="off"
						/>
						<input
							type="text"
							class="input service-input"
							placeholder="service"
							bind:value={action.service}
							on:change={saveActions}
							autocomplete="off"
						/>
					</div>
				</div>
			{/each}

			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="add-btn" on:click={addAction} use:Ripple={$ripple}>+ Add action</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.actions-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 0.25rem;
	}

	.action-item {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.action-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.action-row .input {
		flex: 1;
		min-width: 0;
	}

	.icon-input {
		max-width: 10rem;
	}

	.domain-input, .service-input {
		max-width: 5.5rem;
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
