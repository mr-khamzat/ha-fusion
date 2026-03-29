<script lang="ts">
	import { states } from '$lib/Stores';
	import { base } from '$app/paths';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attrs = entity?.attributes || {};
	$: state = entity?.state || 'idle';
	$: isPlaying = state === 'playing';
	$: isPaused = state === 'paused';
	$: title = attrs.media_title || '';
	$: artist = attrs.media_artist || '';
	$: entityPicture = attrs.entity_picture || '';
	$: artUrl = entityPicture ? `${base}${entityPicture}` : '';
</script>

<div class="album-widget">
	{#if !entity_id}
		<div class="empty">
			<Icon icon="mdi:music-box-outline" height="16" width="16" style="opacity:0.3" />
		</div>
	{:else if !isPlaying && !isPaused}
		<div class="idle">
			<Icon icon="mdi:music-note-off" height="14" width="14" style="opacity:0.3" />
			<span>Not playing</span>
		</div>
	{:else}
		<div class="album-row">
			<div class="art-wrap">
				{#if artUrl}
					<img src={artUrl} alt="Album art" class="art-img" />
				{:else}
					<div class="art-placeholder">
						<Icon icon="mdi:music-note" height="20" width="20" style="opacity:0.4" />
					</div>
				{/if}
				{#if isPlaying}
					<div class="playing-dot"></div>
				{/if}
			</div>
			<div class="track-info">
				<span class="track-title">{title || 'Unknown'}</span>
				{#if artist}<span class="track-artist">{artist}</span>{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.album-widget {
		padding: var(--theme-sidebar-item-padding);
	}

	.empty, .idle {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.album-row {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	.art-wrap {
		position: relative;
		flex-shrink: 0;
		width: 2.8rem;
		height: 2.8rem;
		border-radius: 0.3rem;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.07);
	}

	.art-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.art-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.playing-dot {
		position: absolute;
		bottom: 3px;
		right: 3px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(52, 211, 153, 0.9);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	.track-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.track-title {
		font-size: 0.8rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-artist {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
