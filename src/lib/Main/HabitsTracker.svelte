<script lang="ts">
	import { states, connection, editMode, ripple, motion } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	export let sel: any;

	$: habits = (sel?.habits as { id: string; entity_id: string; name: string; icon: string }[]) || [];

	function isActive(entity_id: string): boolean {
		if (!entity_id) return false;
		const state = $states?.[entity_id];
		if (!state) return false;
		const val = state.state;
		if (val === 'on') return true;
		const num = parseFloat(val);
		if (!isNaN(num) && num > 0) return true;
		return false;
	}

	function toggle(entity_id: string) {
		if (!entity_id || !$connection) return;
		const domain = entity_id.split('.')[0];
		if (domain === 'input_boolean') {
			callService($connection, 'input_boolean', 'toggle', { entity_id });
		} else if (domain === 'counter') {
			const active = isActive(entity_id);
			if (active) {
				callService($connection, 'counter', 'reset', { entity_id });
			} else {
				callService($connection, 'counter', 'increment', { entity_id });
			}
		} else {
			// generic toggle attempt
			callService($connection, 'homeassistant', 'toggle', { entity_id });
		}
		if ('vibrate' in navigator) navigator.vibrate(15);
	}

	function handleCardClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/HabitsConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="habits-card"
	style:transition="opacity {$motion}ms ease"
	on:click={handleCardClick}
>
	{#if sel?.name}
		<div class="habits-title">{sel.name}</div>
	{/if}

	{#if habits.length === 0}
		<div class="habits-empty">
			<Icon icon="mdi:checkbox-marked-circle-outline" height="22" width="22" style="opacity:0.3" />
			<span>Настройте привычки</span>
		</div>
	{:else}
		<div class="habits-grid">
			{#each habits as habit (habit.id)}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button
					class="habit-btn"
					class:active={isActive(habit.entity_id)}
					on:click|stopPropagation={() => {
						if (!$editMode) toggle(habit.entity_id);
					}}
					use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.15)' }}
					style:cursor={$editMode ? 'default' : 'pointer'}
					title={habit.name}
				>
					<div class="habit-icon-wrap">
						{#if habit.icon}
							<Icon icon={habit.icon} height="26" width="26" />
						{:else}
							<Icon icon="mdi:checkbox-blank-circle-outline" height="26" width="26" />
						{/if}
						{#if isActive(habit.entity_id)}
							<div class="checkmark">
								<Icon icon="mdi:check-circle" height="14" width="14" />
							</div>
						{/if}
					</div>
					<span class="habit-name">{habit.name || habit.entity_id}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.habits-card {
		background: var(--theme-button-background-color-off, rgba(0, 0, 0, 0.2));
		border-radius: 0.65rem;
		padding: 0.75rem 0.85rem;
		height: 100%;
		min-height: 4rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-sizing: border-box;
	}

	.habits-title {
		font-size: 0.72rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.habits-empty {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.78rem;
		padding: 0.25rem 0;
	}

	.habits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr));
		gap: 0.5rem;
	}

	.habit-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.6rem;
		padding: 0.55rem 0.3rem 0.45rem;
		font-family: inherit;
		color: rgba(255, 255, 255, 0.65);
		transition: background 0.15s, border-color 0.15s, color 0.15s;
		position: relative;
		overflow: hidden;
	}

	.habit-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.9);
	}

	.habit-btn.active {
		background: rgba(74, 222, 128, 0.15);
		border-color: rgba(74, 222, 128, 0.35);
		color: #4ade80;
	}

	.habit-icon-wrap {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.checkmark {
		position: absolute;
		bottom: -4px;
		right: -6px;
		color: #4ade80;
		display: flex;
	}

	.habit-name {
		font-size: 0.68rem;
		font-weight: 500;
		text-align: center;
		line-height: 1.2;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
