<script lang="ts">
	import { dashboard, record, lang, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Ripple from 'svelte-ripple';
	import { updateObj } from '$lib/Utils';
	import type { ViewItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: ViewItem;

	let name = sel?.name;

	let icon: string | undefined = sel?.icon;
	let background_url: string | undefined = sel?.background_url;
	let background_blur: boolean = sel?.background_blur ?? false;

	const nameConst = name;

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('edit_view')}</h1>

		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<div class="inline-preview">
				<div class="view_item">{name || nameConst}</div>
			</div>
		</div>

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			on:clear={() => {
				name = '';
				set('name', nameConst);
			}}
			let:padding
		>
			<input
				class="input"
				type="text"
				bind:value={name}
				placeholder={nameConst}
				on:change={(event) => set('name', event)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<h2>{$lang('icon')} ({$lang('sidebar')?.toLocaleLowerCase()})</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={icon}
				on:clear={() => {
					icon = undefined;
					set('icon');
				}}
				let:padding
			>
				<input
					class="input"
					type="text"
					placeholder={'fluent:tab-add-24-filled'}
					bind:value={icon}
					on:change={(event) => set('icon', event)}
					style:padding
					autocomplete="off"
					spellcheck="false"
				/>
			</InputClear>

			<button
				class="icon-gallery"
				on:click={() => {
					window.open('https://icon-sets.iconify.design/', '_blank');
				}}
				title={$lang('icon')}
				use:Ripple={$ripple}
			>
				<Icon icon="vaadin:grid-small" height="none" />
			</button>
		</div>

		<h2>{$lang('auto_switch') || 'Auto-switch condition'}</h2>
		<p class="hint">{$lang('auto_switch_hint') || 'Switch to this view automatically when entity state matches'}</p>

		{#if sel?.auto_switch?.length}
			{#each sel.auto_switch as cond, i}
				<div class="auto-switch-row">
					<input
						class="input input-small"
						type="text"
						placeholder="entity_id (e.g. person.john)"
						value={cond.entity || ''}
						on:change={(e) => {
							sel.auto_switch[i].entity = e.target.value;
							$dashboard = $dashboard;
						}}
					/>
					<input
						class="input input-small"
						type="text"
						placeholder="state (e.g. home)"
						value={cond.state || ''}
						on:change={(e) => {
							sel.auto_switch[i].state = e.target.value;
							sel.auto_switch[i].condition = 'state';
							$dashboard = $dashboard;
						}}
					/>
					<button
						class="remove-btn"
						on:click={() => {
							sel.auto_switch.splice(i, 1);
							$dashboard = $dashboard;
						}}
					>×</button>
				</div>
			{/each}
		{/if}

		<button
			class="add-condition-btn"
			on:click={() => {
				if (!sel.auto_switch) sel.auto_switch = [];
				sel.auto_switch = [...sel.auto_switch, { condition: 'state', entity: '', state: '' }];
				$dashboard = $dashboard;
			}}
		>+ {$lang('add_condition') || 'Add condition'}</button>

		<h2>{$lang('background')} URL</h2>

		<InputClear
			condition={background_url}
			on:clear={() => {
				background_url = undefined;
				set('background_url');
			}}
			let:padding
		>
			<input
				class="input"
				type="text"
				bind:value={background_url}
				placeholder="https://..."
				on:change={(event) => set('background_url', event)}
				style:padding
				autocomplete="off"
				spellcheck="false"
			/>
		</InputClear>

		<label class="blur-label">
			<input
				type="checkbox"
				bind:checked={background_blur}
				on:change={() => set('background_blur', { target: { value: background_blur } })}
			/>
			{$lang('blur') || 'Blur background'}
		</label>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.inline-preview {
		width: fit-content;
		padding: 0.6rem 0;
	}

	.view_item {
		border-bottom: 3px solid white;
		color: white;
		font-weight: 700;
		font-size: 1.2rem;
		padding-bottom: 3px;
		white-space: nowrap;
	}

	.blur-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: var(--theme-button-name-color-off, rgba(255, 255, 255, 0.7));
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	.blur-label input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		accent-color: var(--theme-button-icon-color-on, #5294e2);
	}

	.hint {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
		margin: 0 0 0.6rem;
	}

	.auto-switch-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.4rem;
	}

	.input-small {
		flex: 1;
		font-size: 0.82rem !important;
	}

	.remove-btn {
		background: rgba(239, 68, 68, 0.2);
		border: none;
		border-radius: 4px;
		color: #ef4444;
		cursor: pointer;
		width: 24px;
		height: 24px;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		font-family: inherit;
	}

	.add-condition-btn {
		background: rgba(255, 255, 255, 0.07);
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		padding: 0.4rem 0.8rem;
		font-size: 0.82rem;
		font-family: inherit;
		width: 100%;
		margin-bottom: 1rem;
		transition: background 0.15s;
	}

	.add-condition-btn:hover {
		background: rgba(255, 255, 255, 0.12);
	}
</style>
