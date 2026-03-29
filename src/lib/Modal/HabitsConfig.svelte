<script lang="ts">
	import { dashboard, record, lang, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';

	export let isOpen: boolean;
	export let sel: any;

	type Habit = { id: string; entity_id: string; name: string; icon: string };

	let habits: Habit[] = sel?.habits ? JSON.parse(JSON.stringify(sel.habits)) : [];
	let cardName: string = sel?.name || '';

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	function saveHabits() {
		sel.habits = habits.length > 0 ? JSON.parse(JSON.stringify(habits)) : [];
		$dashboard = $dashboard;
	}

	function addHabit() {
		habits = [
			...habits,
			{
				id: String(Date.now()),
				entity_id: '',
				name: '',
				icon: 'mdi:checkbox-marked-circle-outline'
			}
		];
		saveHabits();
	}

	function removeHabit(index: number) {
		habits = habits.filter((_, i) => i !== index);
		saveHabits();
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Трекер привычек</h1>

		<h2>{$lang('name')}</h2>
		<input
			type="text"
			class="input"
			bind:value={cardName}
			placeholder="Мои привычки"
			on:change={(e) => set('name', e)}
			autocomplete="off"
			spellcheck="false"
		/>

		<h2>Привычки</h2>

		<div class="habits-list">
			{#each habits as habit, i (habit.id)}
				<div class="habit-item">
					<div class="habit-row">
						<input
							type="text"
							class="input"
							placeholder="Название"
							bind:value={habit.name}
							on:change={saveHabits}
							autocomplete="off"
							spellcheck="false"
						/>
						<input
							type="text"
							class="input icon-input"
							placeholder="mdi:star"
							bind:value={habit.icon}
							on:change={saveHabits}
							autocomplete="off"
							spellcheck="false"
						/>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<button class="remove-btn" on:click={() => removeHabit(i)}>×</button>
					</div>
					<div class="habit-row">
						<input
							type="text"
							class="input"
							placeholder="entity_id (input_boolean.*, counter.*)"
							bind:value={habit.entity_id}
							on:change={saveHabits}
							autocomplete="off"
							spellcheck="false"
						/>
					</div>
				</div>
			{/each}

			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="add-btn" on:click={addHabit} use:Ripple={$ripple}>+ Добавить привычку</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.habits-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 0.25rem;
	}

	.habit-item {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.habit-row {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.habit-row .input {
		flex: 1;
		min-width: 0;
	}

	.icon-input {
		max-width: 9rem;
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
		position: relative;
		overflow: hidden;
	}

	.add-btn:hover {
		background: rgba(255, 255, 255, 0.14);
		color: white;
	}
</style>
