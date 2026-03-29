<script lang="ts">
	import { editMode, motion, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import Ripple from 'svelte-ripple';
	import { tick } from 'svelte';

	export let sel: any;

	interface Message {
		role: 'user' | 'assistant';
		content: string;
	}

	$: apiKey = sel?.api_key as string | undefined;
	$: model = (sel?.model as string | undefined) || 'claude-haiku-4-5-20251001';
	$: systemPrompt = sel?.system_prompt as string | undefined;

	let messages: Message[] = [];
	let inputValue = '';
	let loading = false;
	let errorMsg = '';
	let messagesEl: HTMLDivElement;

	const MAX_HISTORY = 20;

	async function send() {
		const text = inputValue.trim();
		if (!text || loading) return;
		if (!apiKey) return;

		inputValue = '';
		errorMsg = '';

		messages = [...messages, { role: 'user', content: text }];
		if (messages.length > MAX_HISTORY) messages = messages.slice(-MAX_HISTORY);

		loading = true;
		await scrollToBottom();

		try {
			// Build history excluding the last user message (sent separately)
			const history = messages.slice(0, -1);

			const res = await fetch('/_api/ai_chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: text,
					history,
					api_key: apiKey,
					model,
					system_prompt: systemPrompt
				})
			});

			if (!res.ok) {
				const body = await res.text();
				throw new Error(body || `HTTP ${res.status}`);
			}

			const data = await res.json();
			const reply = data.reply as string;

			messages = [...messages, { role: 'assistant', content: reply }];
			if (messages.length > MAX_HISTORY) messages = messages.slice(-MAX_HISTORY);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			errorMsg = msg;
		} finally {
			loading = false;
			await scrollToBottom();
		}
	}

	async function scrollToBottom() {
		await tick();
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			send();
		}
	}

	function handleEdit() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/AIAssistantConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="ai-card"
	style:transition="opacity {$motion}ms ease"
	style:cursor={$editMode ? 'pointer' : 'default'}
	on:click={$editMode ? handleEdit : undefined}
>
	<!-- header -->
	<div class="header">
		<span class="header-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
				<path
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
				/>
			</svg>
		</span>
		<span class="header-title">AI Assistant</span>
	</div>

	{#if !apiKey}
		<!-- no api key configured -->
		<div class="setup-prompt">
			<span class="setup-icon" aria-hidden="true">&#x1F511;</span>
			<p class="setup-text">
				{#if $editMode}
					Нажмите для настройки AI ассистента
				{:else}
					API ключ не задан. Нажмите «Изменить» для настройки.
				{/if}
			</p>
		</div>
	{:else}
		<!-- messages area -->
		<div class="messages" bind:this={messagesEl}>
			{#if messages.length === 0}
				<div class="empty-hint">
					&#x1F4AC; &nbsp;\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E \u043E\u0431 \u0443\u043C\u043D\u043E\u043C \u0434\u043E\u043C\u0435\u2026
				</div>
			{/if}

			{#each messages as msg (msg.role + msg.content.slice(0, 20))}
				<div class="message" class:user={msg.role === 'user'} class:assistant={msg.role === 'assistant'}>
					<div class="bubble">
						{msg.content}
					</div>
				</div>
			{/each}

			{#if loading}
				<div class="message assistant">
					<div class="bubble thinking">
						<span class="dot"></span>
						<span class="dot"></span>
						<span class="dot"></span>
					</div>
				</div>
			{/if}

			{#if errorMsg}
				<div class="error-msg">{errorMsg}</div>
			{/if}
		</div>

		<!-- input row -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="input-row" on:click|stopPropagation>
			<textarea
				class="input-field"
				rows="1"
				placeholder="\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C\u2026"
				bind:value={inputValue}
				on:keydown={handleKeydown}
				disabled={loading}
			></textarea>

			<button
				class="send-btn"
				on:click|stopPropagation={send}
				disabled={loading || !inputValue.trim()}
				use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.2)' }}
				aria-label="Send"
			>
				{#if loading}
					<span class="send-spinner"></span>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
						<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
					</svg>
				{/if}
			</button>
		</div>
	{/if}
</div>

<style>
	.ai-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 14rem;
		border-radius: 0.65rem;
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.07);
		overflow: hidden;
		box-sizing: border-box;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 0.8rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		font-size: 0.78rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.6);
		flex-shrink: 0;
	}

	.header-icon {
		color: rgba(96, 165, 250, 0.8);
		display: flex;
		align-items: center;
	}

	.header-title {
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 0.7rem;
	}

	.setup-prompt {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
	}

	.setup-icon {
		font-size: 1.8rem;
		opacity: 0.5;
	}

	.setup-text {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
		text-align: center;
		margin: 0;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 0.6rem 0.7rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		scroll-behavior: smooth;
	}

	.messages::-webkit-scrollbar {
		width: 3px;
	}
	.messages::-webkit-scrollbar-track {
		background: transparent;
	}
	.messages::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	.empty-hint {
		color: rgba(255, 255, 255, 0.25);
		font-size: 0.78rem;
		text-align: center;
		margin: auto;
		padding: 1rem 0;
	}

	.message {
		display: flex;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message.assistant {
		justify-content: flex-start;
	}

	.bubble {
		max-width: 82%;
		padding: 0.45rem 0.7rem;
		border-radius: 1rem;
		font-size: 0.82rem;
		line-height: 1.45;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.message.user .bubble {
		background: rgba(96, 165, 250, 0.25);
		color: rgba(255, 255, 255, 0.9);
		border-bottom-right-radius: 0.25rem;
	}

	.message.assistant .bubble {
		background: rgba(255, 255, 255, 0.07);
		color: rgba(255, 255, 255, 0.82);
		border-bottom-left-radius: 0.25rem;
	}

	.bubble.thinking {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0.55rem 0.8rem;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.4);
		animation: dot-bounce 1.2s ease-in-out infinite;
	}

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes dot-bounce {
		0%,
		80%,
		100% {
			transform: translateY(0);
			opacity: 0.4;
		}
		40% {
			transform: translateY(-5px);
			opacity: 1;
		}
	}

	.error-msg {
		font-size: 0.75rem;
		color: rgba(239, 68, 68, 0.8);
		background: rgba(239, 68, 68, 0.08);
		border-radius: 0.5rem;
		padding: 0.35rem 0.6rem;
	}

	.input-row {
		display: flex;
		align-items: flex-end;
		gap: 0.4rem;
		padding: 0.45rem 0.55rem;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		flex-shrink: 0;
	}

	.input-field {
		flex: 1;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.65rem;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.82rem;
		padding: 0.45rem 0.65rem;
		resize: none;
		outline: none;
		font-family: inherit;
		line-height: 1.4;
		max-height: 5rem;
		overflow-y: auto;
		transition: border-color 0.2s ease;
	}

	.input-field:focus {
		border-color: rgba(96, 165, 250, 0.45);
	}

	.input-field::placeholder {
		color: rgba(255, 255, 255, 0.25);
	}

	.input-field:disabled {
		opacity: 0.5;
	}

	.send-btn {
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		background: rgba(96, 165, 250, 0.8);
		border: none;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
		transition: background 0.2s ease, opacity 0.2s ease;
	}

	.send-btn:hover:not(:disabled) {
		background: rgba(96, 165, 250, 1);
	}

	.send-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.send-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
