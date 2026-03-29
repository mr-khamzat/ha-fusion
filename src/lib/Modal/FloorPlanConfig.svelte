<script lang="ts">
	import { dashboard, record, states } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';

	export let isOpen: boolean;
	export let sel: any;

	let image_url: string = sel?.image_url || '';
	let overlays: { entity_id: string; x_pct: number; y_pct: number; icon: string }[] =
		sel?.overlays ? [...sel.overlays] : [];

	let uploading = false;
	let uploadError = '';

	$: allEntities = Object.keys($states || {}).sort();

	function save() {
		sel.image_url = image_url;
		sel.overlays = overlays;
		$dashboard = $dashboard;
	}

	function addOverlay() {
		overlays = [...overlays, { entity_id: '', x_pct: 50, y_pct: 50, icon: '' }];
	}

	function removeOverlay(i: number) {
		overlays = overlays.filter((_, idx) => idx !== i);
		save();
	}

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		uploadError = '';

		const formData = new FormData();
		formData.append('file', file);

		// Use ingress-prefixed URL when running inside HA ingress (avoids 404 to HA host)
		const ingressBase = window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/)?.[0] ?? '';
		try {
			const res = await fetch(ingressBase + '/_api/upload_image', { method: 'POST', body: formData });
			let data: any = {};
			try { data = await res.json(); } catch {}
			if (!res.ok) throw new Error(data.error || data.message || `Ошибка ${res.status}`);
			image_url = data.url;
			save();
		} catch (err: any) {
			uploadError = err.message || 'Ошибка загрузки';
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">План квартиры</h1>

		<h2>Загрузить с компьютера</h2>
		<p class="hint">PNG, JPG, SVG, WEBP — до 10 МБ. Sweet Home 3D: экспортируй план как PNG/SVG перед загрузкой.</p>
		<div class="upload-row">
			<input
				type="file"
				accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
				id="floor-upload"
				class="file-hidden"
				on:change={handleFileUpload}
				disabled={uploading}
			/>
			<label for="floor-upload" class="upload-btn" class:uploading>
				{uploading ? 'Загружаю...' : 'Выбрать файл'}
			</label>
			{#if image_url && image_url.startsWith('/_api/uploads/')}
				<span class="upload-ok">✓ Загружено</span>
			{/if}
		</div>
		{#if uploadError}
			<p class="upload-err">{uploadError}</p>
		{/if}

		<h2>URL изображения (план)</h2>
		<input class="input" type="text" bind:value={image_url} on:change={save} placeholder="https://... или /local/floor_plan.svg" autocomplete="off" />
		<p class="hint">Или укажи URL вручную — /local/filename.png из папки /config/www/</p>

		<h2>Устройства на плане</h2>
		<p class="hint">X% и Y% — позиция иконки на плане от левого верхнего угла</p>
		{#each overlays as ov, i}
			<div class="overlay-row">
				<select class="input sel" bind:value={ov.entity_id} on:change={save}>
					<option value="">— выбрать —</option>
					{#each allEntities as eid}
						<option value={eid}>{eid}</option>
					{/each}
				</select>
				<input class="input small" type="number" min="0" max="100" bind:value={ov.x_pct} on:change={save} title="X%" />
				<input class="input small" type="number" min="0" max="100" bind:value={ov.y_pct} on:change={save} title="Y%" />
				<button class="remove-btn" on:click={() => removeOverlay(i)}>✕</button>
			</div>
		{/each}
		<button class="add-btn" on:click={addOverlay}>+ Добавить устройство</button>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.hint { font-size: 0.72rem; color: rgba(255,255,255,0.3); margin: 0.2rem 0 0.8rem; line-height: 1.4; }
	.upload-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; }
	.file-hidden { display: none; }
	.upload-btn {
		padding: 0.45rem 1rem;
		background: rgba(96,165,250,0.12);
		border: 1px solid rgba(96,165,250,0.25);
		border-radius: 0.5rem;
		color: rgba(147,197,253,0.9);
		font-size: 0.8rem;
		cursor: pointer;
		transition: background 0.15s;
		white-space: nowrap;
	}
	.upload-btn:hover, .upload-btn.uploading { background: rgba(96,165,250,0.22); }
	.upload-ok { font-size: 0.75rem; color: rgba(52,211,153,0.85); }
	.upload-err { font-size: 0.72rem; color: rgba(248,113,113,0.85); margin: 0 0 0.5rem; }
	.overlay-row { display: flex; gap: 0.4rem; align-items: center; margin-bottom: 0.4rem; }
	.sel { flex: 1; }
	.small { width: 4.5rem; flex-shrink: 0; }
	.remove-btn { background: rgba(248,113,113,0.12); border: none; color: rgba(248,113,113,0.8); border-radius: 0.4rem; padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.8rem; }
	.add-btn { margin-top: 0.3rem; width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.15); border-radius: 0.5rem; color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; font-size: 0.8rem; }
	.add-btn:hover { background: rgba(255,255,255,0.08); }
</style>
