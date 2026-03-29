<script lang="ts">
	import { states, selectedLanguage } from '$lib/Stores';
	import { closeModal } from 'svelte-modals';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';

	export let isOpen: boolean;
	export let entity_id: string;

	$: entity = $states?.[entity_id];
	$: attrs = entity?.attributes || {};
	$: state = entity?.state || 'unknown';
	$: name = (attrs.friendly_name as string) || entity_id.split('.')[1] || '';
	$: picture = attrs.entity_picture as string | undefined;
	$: isHome = state === 'home';

	// Location data directly on person entity
	$: lat = attrs.latitude as number | undefined;
	$: lon = attrs.longitude as number | undefined;
	$: accuracy = attrs.gps_accuracy as number | undefined;
	$: battery = attrs.battery_level as number | undefined;
	$: source = attrs.source as string | undefined;
	$: deviceTrackers = (attrs.device_trackers as string[]) || [];

	// Source device tracker entity for extra data
	$: sourceEntity = source ? $states?.[source] : undefined;
	$: sourceAttrs = sourceEntity?.attributes || {};

	// Prefer person's own lat/lon; fallback to source tracker
	$: displayLat = lat ?? (sourceAttrs.latitude as number | undefined);
	$: displayLon = lon ?? (sourceAttrs.longitude as number | undefined);
	$: displayBattery = battery ?? (sourceAttrs.battery_level as number | undefined);
	$: sourceType = sourceAttrs.source_type as string | undefined;

	$: locationLabel = isHome
		? 'Дома'
		: state === 'not_home'
			? 'Не дома'
			: state || 'Неизвестно';

	$: googleMapsUrl =
		displayLat != null && displayLon != null
			? `https://maps.google.com/?q=${displayLat},${displayLon}`
			: null;

	$: lastUpdated = entity?.last_updated
		? new Intl.DateTimeFormat($selectedLanguage, {
				hour: '2-digit',
				minute: '2-digit',
				day: '2-digit',
				month: '2-digit'
			}).format(new Date(entity.last_updated))
		: null;

	$: batteryIcon =
		displayBattery == null
			? 'mdi:battery-unknown'
			: displayBattery < 10
				? 'mdi:battery-outline'
				: displayBattery < 25
					? 'mdi:battery-low'
					: displayBattery < 50
						? 'mdi:battery-30'
						: displayBattery < 75
							? 'mdi:battery-60'
							: displayBattery < 90
								? 'mdi:battery-80'
								: 'mdi:battery';

	function getInitials(n: string) {
		return n
			.split(' ')
			.map((w) => w[0] || '')
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{name}</h1>

		<div class="person-detail">
			<!-- Avatar + status -->
			<div class="avatar-section">
				<div class="avatar" class:home={isHome}>
					{#if picture}
						<img src={picture} alt={name} />
					{:else}
						<span class="initials">{getInitials(name)}</span>
					{/if}
				</div>
				<div class="status-block">
					<div class="status-badge" class:home={isHome} class:away={!isHome}>
						<Icon
							icon={isHome ? 'mdi:home' : 'mdi:map-marker'}
							height="14"
							width="14"
						/>
						<span>{locationLabel}</span>
					</div>
					{#if lastUpdated}
						<span class="last-updated">обновлено {lastUpdated}</span>
					{/if}
				</div>
			</div>

			<!-- Info rows -->
			<div class="info-grid">
				<!-- GPS -->
				{#if displayLat != null && displayLon != null}
					<div class="info-row">
						<Icon icon="mdi:crosshairs-gps" height="16" width="16" class="icon" />
						<div class="info-content">
							<span class="info-label">Координаты</span>
							<span class="info-value mono">
								{displayLat.toFixed(5)}, {displayLon.toFixed(5)}
								{#if accuracy != null}
									<span class="accuracy">±{Math.round(accuracy)}м</span>
								{/if}
							</span>
						</div>
						{#if googleMapsUrl}
							<!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
							<span
								class="map-link"
								on:click={() => window.open(googleMapsUrl, '_blank')}
							>
								<Icon icon="mdi:map-outline" height="16" width="16" />
							</span>
						{/if}
					</div>
				{/if}

				<!-- Battery -->
				{#if displayBattery != null}
					<div class="info-row">
						<Icon icon={batteryIcon} height="16" width="16" class="icon"
							style="color:{displayBattery < 20 ? 'rgba(248,113,113,0.9)' : 'rgba(255,255,255,0.5)'}" />
						<div class="info-content">
							<span class="info-label">Батарея телефона</span>
							<span class="info-value">
								<span class="battery-bar">
									<span
										class="battery-fill"
										style:width="{displayBattery}%"
										style:background={displayBattery < 20
											? 'rgba(248,113,113,0.8)'
											: displayBattery < 50
												? 'rgba(251,191,36,0.8)'
												: 'rgba(52,211,153,0.8)'}
									></span>
								</span>
								{displayBattery}%
							</span>
						</div>
					</div>
				{/if}

				<!-- Source tracker -->
				{#if source}
					<div class="info-row">
						<Icon icon="mdi:cellphone-marker" height="16" width="16" class="icon" />
						<div class="info-content">
							<span class="info-label">Источник</span>
							<span class="info-value">{source}</span>
						</div>
					</div>
				{/if}

				<!-- Source type -->
				{#if sourceType}
					<div class="info-row">
						<Icon icon={sourceType === 'gps' ? 'mdi:satellite-variant' : 'mdi:wifi'} height="16" width="16" class="icon" />
						<div class="info-content">
							<span class="info-label">Тип трекера</span>
							<span class="info-value">{sourceType.toUpperCase()}</span>
						</div>
					</div>
				{/if}

				<!-- All device trackers -->
				{#if deviceTrackers.length > 0}
					<div class="info-row align-start">
						<Icon icon="mdi:devices" height="16" width="16" class="icon" style="margin-top:0.1rem" />
						<div class="info-content">
							<span class="info-label">Устройства ({deviceTrackers.length})</span>
							<div class="tracker-list">
								{#each deviceTrackers as dt}
									{@const dtEntity = $states?.[dt]}
									{@const dtState = dtEntity?.state || '?'}
									<span class="tracker-pill" class:active={dtState === 'home'}>
										{dt.replace('device_tracker.', '')}
										<span class="tracker-state">{dtState}</span>
									</span>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Close button -->
		<div slot="footer">
			<button class="close-btn" on:click={closeModal}>Закрыть</button>
		</div>
	</Modal>
{/if}

<style>
	.person-detail {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	/* Avatar */
	.avatar-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #3730a3, #6366f1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: 3px solid rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
		transition: border-color 0.2s;
	}

	.avatar.home {
		background: linear-gradient(135deg, #065f46, #10b981);
		border-color: rgba(16, 185, 129, 0.4);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.initials {
		font-size: 1.3rem;
		font-weight: 700;
		color: white;
	}

	.status-block {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 600;
	}

	.status-badge.home {
		background: rgba(16, 185, 129, 0.15);
		color: rgba(52, 211, 153, 0.95);
		border: 1px solid rgba(16, 185, 129, 0.25);
	}

	.status-badge.away {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.last-updated {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.3);
		padding-left: 0.2rem;
	}

	/* Info grid */
	.info-grid {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.info-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.info-row.align-start {
		align-items: flex-start;
	}

	:global(.info-row .icon) {
		color: rgba(255, 255, 255, 0.4);
		flex-shrink: 0;
	}

	.info-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.info-label {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.info-value {
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mono {
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
	}

	.accuracy {
		font-size: 0.68rem;
		color: rgba(255, 255, 255, 0.35);
	}

	/* Battery bar */
	.battery-bar {
		display: inline-block;
		width: 5rem;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.battery-fill {
		display: block;
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s;
	}

	/* Map link */
	.map-link {
		color: rgba(147, 197, 253, 0.7);
		cursor: pointer;
		padding: 0.2rem;
		border-radius: 0.3rem;
		transition: color 0.15s;
	}

	.map-link:hover {
		color: rgba(147, 197, 253, 1);
	}

	/* Tracker list */
	.tracker-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: 0.2rem;
	}

	.tracker-pill {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.5);
	}

	.tracker-pill.active {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.2);
		color: rgba(52, 211, 153, 0.85);
	}

	.tracker-state {
		font-size: 0.62rem;
		opacity: 0.6;
	}

	/* Close button */
	.close-btn {
		width: 100%;
		padding: 0.65rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.6);
		font-family: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
