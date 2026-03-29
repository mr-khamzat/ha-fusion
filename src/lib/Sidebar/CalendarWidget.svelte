<script lang="ts">
	import { connection, selectedLanguage } from '$lib/Stores';
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';

	export let sel: any;

	interface CalEvent {
		title: string;
		start: string;
		end: string;
		allDay: boolean;
	}

	let events: CalEvent[] = [];
	let loading = true;
	let timer: ReturnType<typeof setInterval>;

	async function fetchEvents() {
		const entity_id = sel?.entity_id;
		if (!entity_id || !$connection) return;

		const now = new Date();
		const end = new Date();
		end.setDate(now.getDate() + (sel?.days_ahead ?? 7));

		const params = encodeURI(`?start=${now.toISOString()}&end=${end.toISOString()}`);
		const url = `${base}/api/calendars/${entity_id}${params}`;
		const token = ($connection as any)?.options?.auth?.data?.access_token;

		try {
			const res = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			events = data
				.map((e: any) => ({
					title: e.summary,
					start: e.start?.dateTime || e.start?.date,
					end: e.end?.dateTime || e.end?.date,
					allDay: !e.start?.dateTime
				}))
				.sort((a: CalEvent, b: CalEvent) => new Date(a.start).getTime() - new Date(b.start).getTime())
				.slice(0, sel?.max_events ?? 5);
		} catch {
			events = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchEvents();
		timer = setInterval(fetchEvents, 5 * 60 * 1000);
	});

	onDestroy(() => clearInterval(timer));

	$: sel && fetchEvents();

	function relativeTime(dateStr: string): string {
		const now = new Date();
		const d = new Date(dateStr);
		const diffMs = d.getTime() - now.getTime();
		const diffH = diffMs / 3600000;
		const diffD = Math.floor(diffH / 24);

		if (diffH < 0 && diffH > -24) return 'Today';
		if (diffH >= 0 && diffH < 1) return `in ${Math.round(diffH * 60)}m`;
		if (diffH >= 1 && diffH < 24) return `in ${Math.round(diffH)}h`;
		if (diffD === 1) return 'Tomorrow';
		if (diffD < 7) return new Intl.DateTimeFormat($selectedLanguage, { weekday: 'short' }).format(d);
		return new Intl.DateTimeFormat($selectedLanguage, { month: 'short', day: 'numeric' }).format(d);
	}

	function formatTime(dateStr: string, allDay: boolean): string {
		if (allDay) return 'All day';
		return new Intl.DateTimeFormat($selectedLanguage, { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
	}

	// Dot color by day proximity
	function dotColor(dateStr: string): string {
		const diffH = (new Date(dateStr).getTime() - Date.now()) / 3600000;
		if (diffH < 2) return '#f87171';
		if (diffH < 24) return '#fbbf24';
		return 'rgba(99,102,241,0.8)';
	}
</script>

<div class="cal-widget">
	{#if loading}
		<div class="loading">
			<Icon icon="mdi:calendar-clock" height="16" width="16" style="opacity:0.4" />
		</div>
	{:else if events.length === 0}
		<div class="empty">
			<Icon icon="mdi:calendar-check-outline" height="16" width="16" style="opacity:0.35" />
			<span>No upcoming events</span>
		</div>
	{:else}
		<div class="events">
			{#each events as event}
				<div class="event-row">
					<div class="event-dot" style:background={dotColor(event.start)}></div>
					<div class="event-body">
						<span class="event-title">{event.title}</span>
						<span class="event-time">{formatTime(event.start, event.allDay)}</span>
					</div>
					<span class="event-rel">{relativeTime(event.start)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.cal-widget {
		padding: var(--theme-sidebar-item-padding);
		pointer-events: none;
	}

	.loading, .empty {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.3);
		padding: 0.25rem 0;
	}

	.events {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.event-row {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
	}

	.event-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 0.3rem;
	}

	.event-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.event-title {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.event-time {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.35);
	}

	.event-rel {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.3);
		white-space: nowrap;
		flex-shrink: 0;
		padding-top: 0.2rem;
	}
</style>
