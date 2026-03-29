<script lang="ts">
	import { connected, motion } from '$lib/Stores';

	// Show disconnected state with a short delay to avoid flash
	let showDisconnected = false;
	let disconnectTimer: ReturnType<typeof setTimeout>;

	$: if ($connected === false) {
		disconnectTimer = setTimeout(() => {
			showDisconnected = true;
		}, 2000);
	} else {
		clearTimeout(disconnectTimer);
		showDisconnected = false;
	}
</script>

{#if showDisconnected}
	<div
		class="indicator disconnected"
		style:transition="opacity {$motion}ms ease"
		title="Disconnected from Home Assistant"
	>
		<span class="dot"></span>
		<span class="label">Reconnecting…</span>
	</div>
{/if}

<style>
	.indicator {
		position: fixed;
		top: 0.75rem;
		right: 0.75rem;
		z-index: 9999;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(20, 20, 20, 0.9);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 999px;
		padding: 0.35rem 0.75rem 0.35rem 0.5rem;
		font-size: 0.72rem;
		color: rgba(239, 68, 68, 0.9);
		font-weight: 500;
		letter-spacing: 0.02em;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
		pointer-events: none;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ef4444;
		animation: pulse 1.4s ease-in-out infinite;
		flex-shrink: 0;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.75); }
	}

	.label {
		white-space: nowrap;
	}
</style>
