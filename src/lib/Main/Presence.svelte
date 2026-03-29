<script lang="ts">
	import { states, editMode, motion, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';

	function openPersonDetail(entity_id: string) {
		if ($editMode) return;
		openModal(() => import('$lib/Modal/PersonDetailModal.svelte'), { entity_id });
	}


	export let sel: any;

	// All person entities or configured list
	$: allPersons = Object.values($states ?? {}).filter((e) =>
		e.entity_id.startsWith('person.')
	);

	$: persons = allPersons.map((e) => ({
		entity_id: e.entity_id,
		state: e.state,
		isHome: e.state === 'home',
		entityPicture: e.attributes?.entity_picture as string | undefined,
		name: (e.attributes?.friendly_name as string) || e.entity_id.split('.')[1] || ''
	}));

	$: homeCount = persons.filter((p) => p.isHome).length;

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((w) => w[0] || '')
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function handleEdit() {
		if (!$editMode) return;
		openModal(() => import('$lib/Modal/MainItemConfig.svelte'), { sel });
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="presence-card"
	style:transition="opacity {$motion}ms ease"
	on:click={handleEdit}
	use:Ripple={{ ...$ripple, color: 'rgba(255,255,255,0.04)' }}
>
	<!-- Header -->
	<div class="presence-header">
		<span class="header-label">
			<Icon icon="mdi:account-group" height="14" width="14" />
			Home
		</span>
		<span class="home-count" class:all-away={homeCount === 0}>
			{homeCount}/{persons.length}
		</span>
	</div>

	<!-- Person grid -->
	{#if persons.length > 0}
		<div class="persons-grid">
			{#each persons as person}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="person-item"
					on:click|stopPropagation={() => openPersonDetail(person.entity_id)}
					style:cursor={$editMode ? 'default' : 'pointer'}
				>
					<div class="avatar" class:home={person.isHome}>
						{#if person.entityPicture}
							<img src={person.entityPicture} alt={person.name} />
						{:else}
							<span class="initials">{getInitials(person.name)}</span>
						{/if}
						<span class="status-dot" class:home={person.isHome}></span>
					</div>
					<span class="person-name">{person.name.split(' ')[0]}</span>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<Icon icon="mdi:account-off" height="24" width="24" style="opacity:0.3" />
			<span>No person entities</span>
		</div>
	{/if}
</div>

<style>
	.presence-card {
		background: var(--theme-button-background-color-off, rgba(0, 0, 0, 0.2));
		border-radius: 0.65rem;
		padding: 0.8rem 1rem;
		height: 100%;
		min-height: 5rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-sizing: border-box;
	}

	.presence-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 500;
	}

	.home-count {
		font-size: 0.78rem;
		font-weight: 700;
		color: #10b981;
		background: rgba(16, 185, 129, 0.12);
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
	}

	.home-count.all-away {
		color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.06);
	}

	.persons-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		align-items: flex-start;
	}

	.person-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-width: 2.8rem;
	}

	.avatar {
		position: relative;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #3730a3, #6366f1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
		border: 2px solid rgba(255, 255, 255, 0.08);
		transition: border-color 0.2s;
	}

	.avatar.home {
		background: linear-gradient(135deg, #065f46, #10b981);
		border-color: rgba(16, 185, 129, 0.4);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}

	.initials {
		font-size: 0.78rem;
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
		border: 2px solid var(--theme-navigate-background-color, #1a1a2e);
		transition: background 0.2s;
	}

	.status-dot.home {
		background: #10b981;
	}

	.person-name {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.55);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 3.5rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		flex: 1;
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.78rem;
	}
</style>
