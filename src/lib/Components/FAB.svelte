<script lang="ts">
	import { connection, editMode, motion, ripple } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Ripple from 'svelte-ripple';

	let expanded = false;

	interface QuickAction {
		emoji: string;
		label: string;
		handler: () => void;
	}

	function handleTurnOffAll() {
		if (!$connection) return;
		callService($connection, 'homeassistant', 'turn_off', {});
		expanded = false;
	}

	function handleLightOn() {
		if (!$connection) return;
		callService($connection, 'light', 'turn_on', {});
		expanded = false;
	}

	function handleLockAll() {
		if (!$connection) return;
		callService($connection, 'lock', 'lock', {});
		expanded = false;
	}

	function handleNightMode() {
		// placeholder — show a transient notification
		nightToast = true;
		expanded = false;
		setTimeout(() => {
			nightToast = false;
		}, 2000);
	}

	let nightToast = false;

	const actions: QuickAction[] = [
		{ emoji: '\u{1F3E0}', label: '\u0412\u0441\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C', handler: handleTurnOffAll },
		{ emoji: '\u{1F4A1}', label: '\u0421\u0432\u0435\u0442 \u0432\u0435\u0437\u0434\u0435', handler: handleLightOn },
		{ emoji: '\u{1F512}', label: '\u0417\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u0442\u044C', handler: handleLockAll },
		{ emoji: '\u{1F319}', label: '\u041D\u043E\u0447\u043D\u043E\u0439 \u0440\u0435\u0436\u0438\u043C', handler: handleNightMode }
	];

	function toggleExpanded() {
		expanded = !expanded;
	}

	function closeBackdrop() {
		expanded = false;
	}
</script>

{#if !$editMode}
	<!-- backdrop -->
	{#if expanded}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="backdrop"
			on:click={closeBackdrop}
			style:transition="opacity {$motion}ms ease"
		></div>
	{/if}

	<!-- night mode toast -->
	{#if nightToast}
		<div class="toast" style:transition="opacity {$motion}ms ease">
			\u{1F319} \u041D\u043E\u0447\u043D\u043E\u0439 \u0440\u0435\u0436\u0438\u043C \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D
		</div>
	{/if}

	<div class="fab-container">
		<!-- action buttons, fan upward -->
		{#each actions as action, i}
			<div
				class="action-wrap"
				style:transform={expanded
					? `translateY(${-(i + 1) * 3.6}rem) scale(1)`
					: 'translateY(0) scale(0)'}
				style:opacity={expanded ? '1' : '0'}
				style:transition="transform {$motion}ms ease {expanded
					? i * 40
					: (actions.length - 1 - i) * 30}ms,
					opacity {$motion}ms ease {expanded ? i * 40 : (actions.length - 1 - i) * 30}ms"
			>
				<span class="action-label" class:visible={expanded}>{action.label}</span>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<button
					class="action-btn"
					on:click={action.handler}
					use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.2)' }}
					title={action.label}
					tabindex={expanded ? 0 : -1}
				>
					{action.emoji}
				</button>
			</div>
		{/each}

		<!-- main FAB -->
		<button
			class="fab"
			class:expanded
			on:click={toggleExpanded}
			use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.2)' }}
			aria-label="Quick actions"
		>
			<span
				class="fab-icon"
				style:transform={expanded ? 'rotate(45deg)' : 'rotate(0deg)'}
				style:transition="transform {$motion}ms ease"
			>+</span>
		</button>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 19;
		background: rgba(0, 0, 0, 0.35);
	}

	.fab-container {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.fab {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background: rgba(96, 165, 250, 0.9);
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		outline: none;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
	}

	.fab:hover {
		background: rgba(96, 165, 250, 1);
	}

	.fab-icon {
		font-size: 1.8rem;
		line-height: 1;
		display: block;
		margin-top: -1px;
	}

	.action-wrap {
		position: absolute;
		bottom: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		pointer-events: none;
	}

	.action-wrap:has(button:focus-visible),
	.action-wrap {
		pointer-events: none;
	}

	/* enable pointer events only when visible */
	.action-wrap[style*='scale(1)'] {
		pointer-events: auto;
	}

	.action-label {
		background: rgba(20, 20, 20, 0.85);
		backdrop-filter: blur(6px);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.72rem;
		white-space: nowrap;
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s ease;
	}

	.action-label.visible {
		opacity: 1;
	}

	.action-btn {
		width: 2.8rem;
		height: 2.8rem;
		border-radius: 50%;
		background: rgba(30, 30, 30, 0.88);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: white;
		font-size: 1.15rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
		outline: none;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
	}

	.action-btn:hover {
		background: rgba(50, 50, 50, 0.92);
	}

	.toast {
		position: fixed;
		bottom: 6rem;
		right: 1.5rem;
		z-index: 21;
		background: rgba(20, 20, 20, 0.9);
		backdrop-filter: blur(8px);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.8rem;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		pointer-events: none;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
