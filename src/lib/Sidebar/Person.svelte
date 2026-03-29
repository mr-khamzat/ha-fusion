<script lang="ts">
	import { states, lang, motion } from '$lib/Stores';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entity = $states?.[sel?.entity_id];
	$: attributes = entity?.attributes;
	$: state = entity?.state;

	$: isHome = state === 'home';
	$: entityPicture = attributes?.entity_picture;

	$: displayName = sel?.name || attributes?.friendly_name || sel?.entity_id?.split('.')?.[1] || '';

	$: initials = displayName
		.split(' ')
		.map((w: string) => w[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	$: stateLabel =
		state === 'home'
			? $lang('home') || 'Home'
			: state === 'not_home'
				? $lang('away') || 'Away'
				: state || '';
</script>

<div class="person-widget" style:transition="opacity {$motion}ms ease">
	<!-- avatar -->
	<div class="avatar" class:home={isHome}>
		{#if entityPicture}
			<img src={entityPicture} alt={displayName} />
		{:else}
			<span class="initials">{initials}</span>
		{/if}

		<!-- status dot -->
		<span class="status-dot" class:home={isHome}></span>
	</div>

	<!-- info -->
	<div class="person-info">
		<div class="person-name">{displayName}</div>
		<div class="person-state" class:home={isHome}>
			<Icon
				icon={isHome ? 'mdi:home' : 'mdi:map-marker'}
				height="12"
				width="12"
				style="vertical-align: middle; margin-right: 2px;"
			/>
			{stateLabel}
		</div>
	</div>
</div>

<style>
	.person-widget {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.5rem 0.25rem;
		width: 100%;
	}

	.avatar {
		position: relative;
		flex-shrink: 0;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #3730a3, #6366f1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}

	.avatar.home {
		background: linear-gradient(135deg, #065f46, #10b981);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}

	.initials {
		font-size: 0.8rem;
		font-weight: 700;
		color: white;
		letter-spacing: 0.02em;
	}

	.status-dot {
		position: absolute;
		bottom: 1px;
		right: 1px;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: #6b7280;
		border: 1.5px solid var(--theme-navigate-background-color, #1a1a2e);
	}

	.status-dot.home {
		background: #10b981;
	}

	.person-info {
		overflow: hidden;
		flex: 1;
	}

	.person-name {
		font-size: 0.88rem;
		font-weight: 500;
		color: var(--theme-sensor-name-color, rgba(255, 255, 255, 0.9));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.person-state {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 1px;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.person-state.home {
		color: #10b981;
	}
</style>
