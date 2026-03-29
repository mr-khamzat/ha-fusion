<script lang="ts">
	import { connection, states, selectedLanguage, editMode, motion } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { onDestroy } from 'svelte';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';

	export let sel: any;

	$: entityIds = (sel?.entity_ids as string[]) || [];
	$: maxEvents = sel?.max_events || 20;
	$: period = sel?.period || 'hour';

	interface LogEvent {
		entity_id: string;
		state: string;
		last_changed: string;
		name: string;
	}

	let events: LogEvent[] = [];
	let unsubscribe: (() => void) | undefined;

	function getMs(p: string): number {
		const map: Record<string, number> = {
			hour: 3600000,
			'3hour': 10800000,
			'12hour': 43200000,
			day: 86400000,
			week: 604800000
		};
		return map[p] || 3600000;
	}

	$: if (entityIds.length) {
		if (unsubscribe) { unsubscribe(); unsubscribe = undefined; }
		events = [];
		const start_time = new Date(Date.now() - getMs(period));
		const end_time = new Date();
		connection.subscribe((conn) => {
			if (!conn || !entityIds.length) return;
			conn
				?.subscribeMessage(
					(res: any) => {
						if (!res?.states) return;
						const all: LogEvent[] = [];
						for (const [entity_id, hist] of Object.entries(res.states) as [string, any[]][]) {
							const friendly = $states?.[entity_id]?.attributes?.friendly_name || entity_id;
							for (const entry of hist) {
								all.push({
									entity_id,
									state: entry.s ?? entry.state ?? '?',
									last_changed: new Date((entry.lu ?? entry.last_updated ?? 0) * 1000).toISOString(),
									name: friendly
								});
							}
						}
						all.sort((a, b) => new Date(b.last_changed).getTime() - new Date(a.last_changed).getTime());
						events = all.slice(0, maxEvents);
					},
					{
						type: 'history/stream',
						entity_ids: entityIds,
						start_time,
						end_time,
						minimal_response: true,
						no_attributes: true
					}
				)
				.then((innerUnsub) => {
					unsubscribe = innerUnsub;
				})
				.catch((e) => console.error('EventTimeline:', e));
		});
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	function formatTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleTimeString($selectedLanguage, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		if (d.toDateString() === now.toDateString()) return formatTime(iso);
		return d.toLocaleDateString($selectedLanguage, { month: 'short', day: 'numeric' }) + ' ' + formatTime(iso);
	}

	function stateColor(state: string): string {
		if (state === 'on' || state === 'home' || state === 'playing') return 'var(--theme-button-background-color-on, rgba(99,102,241,0.8))';
		if (state === 'off' || state === 'not_home' || state === 'idle') return 'rgba(255,255,255,0.15)';
		if (state === 'unavailable' || state === 'unknown') return 'rgba(239,68,68,0.6)';
		return 'rgba(255,193,7,0.6)';
	}

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EventTimelineConfig.svelte'), { sel });
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="timeline-card"
	style:transition="opacity {$motion}ms ease"
	on:click={handleClick}
>
	{#if sel?.name}
		<div class="timeline-title">{sel.name}</div>
	{/if}

	{#if events.length === 0}
		<div class="empty">
			{#if entityIds.length === 0}
				<Icon icon="mdi:timeline-clock-outline" width="32" style="opacity:0.3" />
				<span>Нет сущностей</span>
			{:else}
				<Icon icon="mdi:timeline-clock-outline" width="32" style="opacity:0.3" />
				<span>Загрузка...</span>
			{/if}
		</div>
	{:else}
		<div class="timeline-list">
			{#each events as ev}
				<div class="event-row">
					<div class="dot" style:background={stateColor(ev.state)}></div>
					<div class="event-info">
						<span class="event-name">{ev.name}</span>
						<span class="event-state" style:color={stateColor(ev.state)}>{ev.state}</span>
					</div>
					<span class="event-time">{formatDate(ev.last_changed)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.timeline-card {
		background: var(--theme-button-background-color-off, rgba(255,255,255,0.05));
		border-radius: var(--theme-border-radius, 0.75rem);
		padding: 0.8rem 1rem;
		min-height: 8rem;
		max-height: 28rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		overflow: hidden;
	}

	.timeline-title {
		font-size: 0.85rem;
		font-weight: 600;
		opacity: 0.7;
		margin-bottom: 0.3rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.timeline-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.timeline-list::-webkit-scrollbar {
		display: none;
	}

	.event-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid rgba(255,255,255,0.04);
	}

	.event-row:last-child {
		border-bottom: none;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.event-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.event-name {
		font-size: 0.8rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.9;
	}

	.event-state {
		font-size: 0.72rem;
		opacity: 0.75;
	}

	.event-time {
		font-size: 0.7rem;
		opacity: 0.45;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex: 1;
		opacity: 0.5;
		font-size: 0.85rem;
	}
</style>
