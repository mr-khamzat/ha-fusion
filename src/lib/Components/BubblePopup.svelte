<script lang="ts">
	import { motion } from '$lib/Stores';
	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	export let isOpen: boolean = false;
	export let title: string = '';
	export let maxWidth: string = '480px';

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}
</script>

{#if isOpen}
	<!-- backdrop -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="bubble-backdrop"
		on:click={handleBackdrop}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: $motion }}
	>
		<!-- popup -->
		<div
			class="bubble-popup"
			style:max-width={maxWidth}
			transition:fly={{ y: 100, duration: $motion }}
		>
			<div class="bubble-header">
				{#if title}
					<span class="bubble-title">{title}</span>
				{/if}
				<button class="bubble-close" on:click={close} aria-label="Close">
					<svg viewBox="0 0 24 24" width="18" height="18">
						<path
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
							fill="currentColor"
						/>
					</svg>
				</button>
			</div>
			<div class="bubble-content">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.bubble-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 0;
	}

	.bubble-popup {
		background: var(--theme-navigate-background-color, rgba(30, 30, 50, 0.97));
		border-radius: 24px 24px 0 0;
		width: 100%;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-bottom: none;
	}

	@media (min-width: 768px) {
		.bubble-backdrop {
			align-items: center;
			padding: 1rem;
		}

		.bubble-popup {
			border-radius: 24px;
			max-height: 80vh;
			border: 1px solid rgba(255, 255, 255, 0.08);
		}
	}

	.bubble-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem 0.5rem;
		position: sticky;
		top: 0;
		background: inherit;
		z-index: 1;
	}

	.bubble-title {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--theme-button-name-color-off, rgba(255, 255, 255, 0.9));
	}

	.bubble-close {
		background: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.7);
		transition: background 0.15s;
		padding: 0;
		margin-left: auto;
		flex-shrink: 0;
	}

	.bubble-close:hover {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.bubble-content {
		padding: 0.5rem 1.25rem 1.5rem;
	}
</style>
