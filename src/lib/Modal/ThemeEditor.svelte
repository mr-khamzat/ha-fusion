<script lang="ts">
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';

	export let isOpen: boolean;
	export let theme: any = undefined;

	$: themeYaml = theme ? formatTheme(theme) : '';

	function formatTheme(t: any): string {
		if (!t) return '';
		const lines = [`title: ${t.title || ''}`, `author: ${t.author || ''}`];
		if (t.theme && typeof t.theme === 'object') {
			lines.push('theme:');
			for (const [key, val] of Object.entries(t.theme)) {
				lines.push(`  ${key}: ${val}`);
			}
		}
		return lines.join('\n');
	}

	function copyToClipboard() {
		if (themeYaml) navigator.clipboard?.writeText(themeYaml);
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Тема: {theme?.title || '—'}</h1>

		<p class="hint">
			Темы хранятся как YAML-файлы. Для редактирования скопируй содержимое, измени нужные параметры и замени файл темы.
		</p>

		{#if themeYaml}
			<div class="yaml-block">
				<pre>{themeYaml}</pre>
			</div>
			<button class="copy-btn" on:click={copyToClipboard}>
				Скопировать YAML
			</button>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.hint {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		margin: 0 0 1rem;
		line-height: 1.5;
	}

	.yaml-block {
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		max-height: 18rem;
		overflow-y: auto;
		margin-bottom: 0.75rem;
	}

	pre {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.72rem;
		color: rgba(147, 197, 253, 0.9);
		margin: 0;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.copy-btn {
		width: 100%;
		padding: 0.5rem;
		background: rgba(96, 165, 250, 0.12);
		border: 1px solid rgba(96, 165, 250, 0.2);
		border-radius: 0.5rem;
		color: rgba(147, 197, 253, 0.85);
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		margin-bottom: 0.5rem;
		transition: background 0.15s;
	}

	.copy-btn:hover {
		background: rgba(96, 165, 250, 0.22);
	}
</style>
