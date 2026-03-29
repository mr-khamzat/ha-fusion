<script lang="ts">
	import { states, connection, editMode, motion, lang } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entity_id = sel?.entity_id;
	$: entity = $states?.[entity_id];
	$: attributes = entity?.attributes;
	$: state = entity?.state;
	$: isPlaying = state === 'playing';
	$: isOff = !state || state === 'off' || state === 'unavailable';
	$: entityPicture = attributes?.entity_picture as string | undefined;
	$: mediaTitle = (attributes?.media_title as string) || '';
	$: mediaArtist = (attributes?.media_artist as string) || '';
	$: displayName = sel?.name || getName(undefined, entity) || entity_id || 'Player';
	$: volumeLevel = (attributes?.volume_level as number) ?? 0;

	function call(service: string, e: MouseEvent) {
		e.stopPropagation();
		callService($connection, 'media_player', service, { entity_id });
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntityCardConfig.svelte'), {
				sel,
				domain: 'media_player',
				title: 'Mini Player'
			});
		} else {
			openModal(() => import('$lib/Modal/MediaPlayer.svelte'), { selected: sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="mini-player"
	class:playing={isPlaying}
	class:off={isOff}
	style:transition="opacity {$motion}ms ease"
	style:cursor={!$editMode ? 'pointer' : 'default'}
	on:click={handleClick}
>
	<!-- Album art or placeholder -->
	<div class="art">
		{#if entityPicture && !isOff}
			<img src={entityPicture} alt={mediaTitle} />
		{:else}
			<Icon icon="mdi:music-note" height="16" width="16" style="opacity:0.4" />
		{/if}
	</div>

	<!-- Track info -->
	<div class="track-info">
		<div class="track-title">
			{#if isOff}
				{displayName}
			{:else}
				{mediaTitle || displayName}
			{/if}
		</div>
		{#if !isOff && mediaArtist}
			<div class="track-artist">{mediaArtist}</div>
		{:else if !isOff}
			<div class="track-artist">{state}</div>
		{/if}
	</div>

	<!-- Controls -->
	{#if !$editMode && !isOff}
		<div class="controls" on:click|stopPropagation>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="ctrl" on:click={(e) => call('media_previous_track', e)} title="Previous">
				<Icon icon="mdi:skip-previous" height="16" width="16" />
			</button>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="ctrl play" on:click={(e) => call('media_play_pause', e)} title={isPlaying ? 'Pause' : 'Play'}>
				<Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} height="18" width="18" />
			</button>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<button class="ctrl" on:click={(e) => call('media_next_track', e)} title="Next">
				<Icon icon="mdi:skip-next" height="16" width="16" />
			</button>
		</div>
	{/if}

	<!-- Volume bar at bottom -->
	{#if !isOff && volumeLevel > 0}
		<div class="vol-bar">
			<div class="vol-fill" style:width="{volumeLevel * 100}%"></div>
		</div>
	{/if}
</div>

<style>
	.mini-player {
		display: grid;
		grid-template-columns: 2.4rem 1fr auto;
		grid-template-rows: 1fr 2px;
		align-items: center;
		gap: 0 0.6rem;
		padding: var(--theme-sidebar-item-padding, 0.5rem 0.75rem);
		position: relative;
		overflow: hidden;
		min-height: 3rem;
	}

	.art {
		grid-column: 1;
		grid-row: 1;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 0.35rem;
		background: rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.35rem;
	}

	.track-info {
		grid-column: 2;
		grid-row: 1;
		overflow: hidden;
		min-width: 0;
	}

	.track-title {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--theme-sensor-name-color, rgba(255, 255, 255, 0.9));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-artist {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 0.1rem;
	}

	.controls {
		grid-column: 3;
		grid-row: 1;
		display: flex;
		align-items: center;
		gap: 0;
	}

	.ctrl {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		padding: 0.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: color 0.15s, background 0.15s;
	}

	.ctrl:hover {
		color: white;
		background: rgba(255, 255, 255, 0.08);
	}

	.ctrl.play {
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.1);
		width: 28px;
		height: 28px;
		border-radius: 50%;
	}

	.ctrl.play:hover {
		background: rgba(255, 255, 255, 0.18);
	}

	.playing .ctrl.play {
		color: white;
	}

	.vol-bar {
		grid-column: 1 / -1;
		grid-row: 2;
		height: 2px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 1px;
		margin: 0 -0.75rem;
	}

	.vol-fill {
		height: 100%;
		background: rgba(75, 166, 237, 0.7);
		border-radius: 1px;
		transition: width 0.3s ease;
	}

	.playing .vol-fill {
		background: rgba(52, 211, 153, 0.8);
	}

	.off {
		opacity: 0.55;
	}
</style>
