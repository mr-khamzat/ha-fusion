<script lang="ts">
	import { dashboard, record } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	export let isOpen: boolean;
	export let sel: any;

	let api_key: string = sel?.api_key || '';
	let model: string = sel?.model || 'claude-haiku-4-5-20251001';
	let system_prompt: string = sel?.system_prompt || 'Ты умный помощник для умного дома Home Assistant. Отвечай кратко и по делу на русском языке.';

	const MODELS = [
		{ id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (быстрый)' },
		{ id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (умный)' },
		{ id: 'claude-opus-4-6', label: 'Claude Opus 4.6 (мощный)' }
	];

	function save() {
		sel.api_key = api_key;
		sel.model = model;
		sel.system_prompt = system_prompt;
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">AI Ассистент</h1>

		<h2>Anthropic API ключ</h2>
		<input class="input" type="password" bind:value={api_key} on:change={save} placeholder="sk-ant-..." autocomplete="off" />
		<p class="hint">Получи ключ на console.anthropic.com</p>

		<h2>Модель</h2>
		<div class="model-list">
			{#each MODELS as m}
				<button class="model-btn" class:active={model === m.id} on:click={() => { model = m.id; save(); }}>
					{m.label}
				</button>
			{/each}
		</div>

		<h2>Системный промпт</h2>
		<textarea class="input textarea" bind:value={system_prompt} on:change={save} rows="4" />

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.hint { font-size: 0.72rem; color: rgba(255,255,255,0.3); margin: 0.2rem 0 0.8rem; }
	.model-list { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.5rem; }
	.model-btn { padding: 0.5rem 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; color: rgba(255,255,255,0.6); cursor: pointer; font-family: inherit; font-size: 0.8rem; text-align: left; transition: all 0.15s; }
	.model-btn.active { background: rgba(96,165,250,0.15); border-color: rgba(96,165,250,0.4); color: rgba(147,197,253,0.95); }
	.textarea { resize: vertical; min-height: 5rem; font-family: inherit; font-size: 0.8rem; }
</style>
