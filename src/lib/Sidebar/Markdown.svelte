<script lang="ts">
	export let sel: any;

	$: text = sel?.text || '';
	$: fontSize = sel?.font_size || '0.82rem';
</script>

<div class="markdown-widget" style:font-size={fontSize}>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html text || '<span style="opacity:0.3">No text configured</span>'}
</div>

<style>
	.markdown-widget {
		padding: var(--theme-sidebar-item-padding);
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.5;
		word-break: break-word;
	}

	.markdown-widget :global(a) {
		color: rgba(147, 197, 253, 0.9);
	}

	.markdown-widget :global(b),
	.markdown-widget :global(strong) {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
	}

	.markdown-widget :global(p) {
		margin: 0 0 0.4rem;
	}

	.markdown-widget :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
