<script lang="ts">
	import { connection, states, editMode, motion, lang } from '$lib/Stores';
	import { getName } from '$lib/Utils';
	import { callService } from 'home-assistant-js-websocket';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entity = $states?.[sel?.entity_id];
	$: attributes = entity?.attributes;
	$: state = entity?.state;

	$: isPlaying = state === 'playing';
	$: isOff = state === 'off' || state === 'unavailable' || !state;

	$: entityPicture = attributes?.entity_picture;
	$: mediaTitle = attributes?.media_title || '';
	$: mediaArtist = attributes?.media_artist || '';
	$: volumeLevel = attributes?.volume_level ?? 0;
	$: displayName = getName(sel, entity) || sel?.entity_id;

	function mediaCall(service: string) {
		callService($connection, 'media_player', service, { entity_id: sel?.entity_id });
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/ButtonConfig.svelte'), { demo: sel?.entity_id, sel });
		} else {
			openModal(() => import('$lib/Modal/MediaPlayer.svelte'), { selected: sel });
		}
	}

	function handlePlayPause(e: MouseEvent) {
		e.stopPropagation();
		mediaCall('media_play_pause');
	}

	function handlePrev(e: MouseEvent) {
		e.stopPropagation();
		mediaCall('media_previous_track');
	}

	function handleNext(e: MouseEvent) {
		e.stopPropagation();
		mediaCall('media_next_track');
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="media-player"
	class:playing={isPlaying}
	class:off={isOff}
	style:transition="opacity {$motion}ms ease"
	style:cursor={!$editMode ? 'pointer' : 'default'}
	on:click={handleClick}
>
	<!-- album art background -->
	{#if entityPicture && !isOff}
		<div
			class="art-bg"
			style:background-image="url({entityPicture})"
		></div>
		<div class="art-overlay"></div>
	{/if}

	<!-- album art thumbnail -->
	<div class="art-thumb">
		{#if entityPicture && !isOff}
			<img src={entityPicture} alt={mediaTitle} />
		{:else}
			<div class="art-placeholder">
				<Icon icon="mdi:music" height="32" width="32" />
			</div>
		{/if}
	</div>

	<!-- info -->
	<div class="info">
		<div class="title">{isOff ? displayName : (mediaTitle || displayName)}</div>
		{#if mediaArtist && !isOff}
			<div class="artist">{mediaArtist}</div>
		{:else}
			<div class="artist">{state || ''}</div>
		{/if}
	</div>

	<!-- controls -->
	{#if !$editMode && !isOff}
		<div class="controls">
			<button class="ctrl-btn" on:click={handlePrev} title="Previous">
				<Icon icon="mdi:skip-previous" height="22" width="22" />
			</button>
			<button class="ctrl-btn play" on:click={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
				<Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} height="26" width="26" />
			</button>
			<button class="ctrl-btn" on:click={handleNext} title="Next">
				<Icon icon="mdi:skip-next" height="22" width="22" />
			</button>
		</div>
	{/if}

	<!-- volume bar -->
	{#if !isOff && volumeLevel > 0}
		<div class="volume-bar">
			<div class="volume-fill" style:width="{volumeLevel * 100}%"></div>
		</div>
	{/if}
</div>

<style>
	.media-player {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 5rem;
		border-radius: 0.65rem;
		overflow: hidden;
		display: grid;
		grid-template-columns: 4.5rem 1fr auto;
		grid-template-rows: 1fr auto;
		align-items: center;
		background-color: var(--theme-button-background-color-off);
		gap: 0;
	}

	.art-bg {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		filter: blur(20px) saturate(1.5);
		transform: scale(1.2);
		opacity: 0.35;
		z-index: 0;
	}

	.art-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%);
		z-index: 0;
	}

	.art-thumb {
		position: relative;
		z-index: 1;
		width: 4.5rem;
		height: 4.5rem;
		flex-shrink: 0;
		grid-column: 1;
		grid-row: 1;
	}

	.art-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.art-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.25);
		color: rgba(255, 255, 255, 0.4);
	}

	.info {
		position: relative;
		z-index: 1;
		padding: 0 0.75rem;
		overflow: hidden;
		grid-column: 2;
		grid-row: 1;
	}

	.title {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--theme-button-name-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		font-size: 0.8rem;
		color: var(--theme-button-state-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 2px;
		opacity: 0.75;
	}

	.controls {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 2px;
		padding-right: 0.5rem;
		grid-column: 3;
		grid-row: 1;
	}

	.ctrl-btn {
		background: none;
		border: none;
		color: var(--theme-button-name-color-off);
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
		opacity: 0.85;
	}

	.ctrl-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		opacity: 1;
	}

	.ctrl-btn.play {
		background: rgba(255, 255, 255, 0.12);
		width: 36px;
		height: 36px;
	}

	.ctrl-btn.play:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.playing .ctrl-btn {
		color: white;
	}

	.volume-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: rgba(255, 255, 255, 0.12);
		z-index: 2;
		grid-column: 1 / -1;
		grid-row: 2;
	}

	.volume-fill {
		height: 100%;
		background: rgba(75, 166, 237, 0.8);
		transition: width 0.3s ease;
	}

	.playing .volume-fill {
		background: rgba(52, 211, 153, 0.9);
	}

	.off {
		opacity: 0.6;
	}
</style>
