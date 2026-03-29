<script lang="ts">
	import { dashboard, record, entityList, ripple } from '$lib/Stores';
	import { closeModal } from 'svelte-modals';
	import Modal from '$lib/Modal/Index.svelte';
	import Select from '$lib/Components/Select.svelte';
	import Ripple from 'svelte-ripple';
	import { onDestroy } from 'svelte';

	export let isOpen: boolean;

	$: ss = $dashboard?.screensaver || {};

	$: idleMinutes = ss.idle_timeout ?? 5;
	$: showSeconds = ss.show_seconds ?? false;
	$: showWeather = ss.show_weather !== false;
	$: weatherEntity = ss.weather_entity || '';
	$: showPersons = ss.show_persons ?? false;
	$: showPrayer = ss.show_prayer !== false;
	$: cameraEntity = ss.camera_entity || '';
	$: motionDetect = ss.motion_detect ?? false;
	$: motionSensitivity = ss.motion_sensitivity ?? 5;
	$: deepSleepMinutes = ss.deep_sleep_timeout ?? 2;
	$: tempSensors = (ss.temp_sensors || []) as string[];
	$: humiditySensors = (ss.humidity_sensors || []) as string[];

	// entityList returns {id, label, hint}[]
	$: weatherOptions = $entityList('weather');
	$: cameraOptions = $entityList('camera');
	$: tempOptions = $entityList('sensor').filter((o) =>
		o.hint?.includes('°') || o.hint?.includes('°C') || o.hint?.includes('°F') || o.id.toLowerCase().includes('temp')
	);
	$: humidityOptions = $entityList('sensor').filter((o) =>
		o.hint?.includes('%') || o.id.toLowerCase().includes('humid') || o.id.toLowerCase().includes('влаж')
	);

	function set(key: string, value: any) {
		if (!$dashboard.screensaver) $dashboard.screensaver = {};
		($dashboard.screensaver as any)[key] = value;
		$dashboard = $dashboard;
	}

	function handleTimeout(e: Event) {
		set('idle_timeout', parseInt((e.target as HTMLInputElement).value));
	}

	function addTempSensor(id: string | undefined) {
		if (!id || tempSensors.includes(id)) return;
		set('temp_sensors', [...tempSensors, id]);
	}

	function removeTempSensor(id: string) {
		set('temp_sensors', tempSensors.filter((s) => s !== id));
	}

	function addHumiditySensor(id: string | undefined) {
		if (!id || humiditySensors.includes(id)) return;
		set('humidity_sensors', [...humiditySensors, id]);
	}

	function removeHumiditySensor(id: string) {
		set('humidity_sensors', humiditySensors.filter((s) => s !== id));
	}

	function getSensorLabel(id: string): string {
		const opt = [...tempOptions, ...humidityOptions].find((o) => o.id === id);
		return opt?.label || id;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">Заставка экрана</h1>

		<!-- Idle timeout -->
		<h2>Таймер бездействия</h2>
		<div class="timeout-row">
			<input
				type="range"
				min="1"
				max="60"
				value={idleMinutes}
				on:input={handleTimeout}
				class="timeout-slider"
			/>
			<span class="timeout-val">{idleMinutes} мин</span>
		</div>

		<!-- Seconds -->
		<h2>Секунды</h2>
		<div class="toggle-row">
			<span class="toggle-label">Показывать секунды</span>
			<div class="button-container">
				<button class:selected={showSeconds} on:click={() => set('show_seconds', true)} use:Ripple={$ripple}>Да</button>
				<button class:selected={!showSeconds} on:click={() => set('show_seconds', false)} use:Ripple={$ripple}>Нет</button>
			</div>
		</div>

		<!-- Weather -->
		<h2>Погода</h2>
		<div class="toggle-row">
			<span class="toggle-label">Показывать погоду</span>
			<div class="button-container">
				<button class:selected={showWeather} on:click={() => set('show_weather', true)} use:Ripple={$ripple}>Да</button>
				<button class:selected={!showWeather} on:click={() => set('show_weather', false)} use:Ripple={$ripple}>Нет</button>
			</div>
		</div>
		{#if showWeather}
			<div class="entity-select">
				<p class="hint">Оставьте пустым для автоопределения</p>
				<Select
					value={weatherEntity || undefined}
					options={weatherOptions}
					placeholder="Выберите сущность погоды"
					clearable={true}
					on:change={(e) => set('weather_entity', e.detail || undefined)}
				/>
			</div>
		{/if}

		<!-- Temperature sensors (multi) -->
		<h2>Датчики температуры</h2>
		<p class="hint">Выберите датчики температуры для каждой комнаты (можно несколько)</p>
		{#each tempSensors as id}
			<div class="chip-row">
				<span class="chip">{getSensorLabel(id)}</span>
				<button class="chip-remove" on:click={() => removeTempSensor(id)}>✕</button>
			</div>
		{/each}
		<div class="entity-select">
			<Select
				value={undefined}
				options={tempOptions.filter((o) => !tempSensors.includes(o.id))}
				placeholder="Добавить датчик температуры..."
				clearable={false}
				on:change={(e) => addTempSensor(e.detail)}
			/>
		</div>

		<!-- Humidity sensors (multi) -->
		<h2>Датчики влажности</h2>
		<p class="hint">Выберите датчики влажности (можно несколько)</p>
		{#each humiditySensors as id}
			<div class="chip-row">
				<span class="chip">{getSensorLabel(id)}</span>
				<button class="chip-remove" on:click={() => removeHumiditySensor(id)}>✕</button>
			</div>
		{/each}
		<div class="entity-select">
			<Select
				value={undefined}
				options={humidityOptions.filter((o) => !humiditySensors.includes(o.id))}
				placeholder="Добавить датчик влажности..."
				clearable={false}
				on:change={(e) => addHumiditySensor(e.detail)}
			/>
		</div>

		<!-- Persons -->
		<h2>Члены семьи</h2>
		<div class="toggle-row">
			<span class="toggle-label">Показывать статус членов семьи</span>
			<div class="button-container">
				<button class:selected={showPersons} on:click={() => set('show_persons', true)} use:Ripple={$ripple}>Да</button>
				<button class:selected={!showPersons} on:click={() => set('show_persons', false)} use:Ripple={$ripple}>Нет</button>
			</div>
		</div>
		{#if showPersons}
			<p class="hint">Аватар, имя, статус «Дома/В пути» и уровень заряда устройства</p>
		{/if}

		<!-- Camera -->
		<h2>Камера</h2>
		<div class="entity-select">
			<p class="hint">Миниатюра камеры в правом нижнем углу. Оставьте пустым, чтобы скрыть.</p>
			<Select
				value={cameraEntity || undefined}
				options={cameraOptions}
				placeholder="Выберите камеру (необязательно)"
				clearable={true}
				on:change={(e) => set('camera_entity', e.detail || undefined)}
			/>
		</div>

		<!-- Prayer times -->
		<h2>Время намаза</h2>
		<div class="toggle-row">
			<span class="toggle-label">Показывать время до следующего намаза</span>
			<div class="button-container">
				<button class:selected={showPrayer} on:click={() => set('show_prayer', true)} use:Ripple={$ripple}>Да</button>
				<button class:selected={!showPrayer} on:click={() => set('show_prayer', false)} use:Ripple={$ripple}>Нет</button>
			</div>
		</div>
		{#if showPrayer}
			<p class="hint">Автоопределение: ищет сенсоры с именами fajr, dhuhr, asr, maghrib, isha.</p>
		{/if}

		<!-- Motion detection -->
		<h2>Датчик движения (камера)</h2>
		<p class="hint">
			Камера устройства обнаруживает движение и выводит заставку с чёрного экрана. Требует разрешения
			на использование камеры в браузере.
		</p>
		<div class="toggle-row">
			<span class="toggle-label">Включить</span>
			<div class="button-container">
				<button
					class:selected={motionDetect}
					on:click={() => set('motion_detect', true)}
					use:Ripple={$ripple}>Да</button
				>
				<button
					class:selected={!motionDetect}
					on:click={() => set('motion_detect', false)}
					use:Ripple={$ripple}>Нет</button
				>
			</div>
		</div>

		{#if motionDetect}
			<h2>Чёрный экран через (после заставки)</h2>
			<div class="timeout-row">
				<input
					type="range"
					min="1"
					max="30"
					value={deepSleepMinutes}
					on:input={(e) => set('deep_sleep_timeout', parseInt(e.currentTarget.value))}
					class="timeout-slider"
				/>
				<span class="timeout-val">{deepSleepMinutes} мин</span>
			</div>

			<h2>Чувствительность</h2>
			<div class="timeout-row">
				<input
					type="range"
					min="1"
					max="10"
					value={motionSensitivity}
					on:input={(e) => set('motion_sensitivity', parseInt(e.currentTarget.value))}
					class="timeout-slider"
				/>
				<span class="timeout-val">{motionSensitivity}/10</span>
			</div>
			<p class="hint">1 = реагирует только на сильное движение, 10 = очень чувствительно</p>
		{/if}

		<div class="buttons">
			<button class="action done" on:click={closeModal} use:Ripple={$ripple}>Готово</button>
		</div>
	</Modal>
{/if}

<style>
	h2 {
		margin: 1.2rem 0 0.5rem 0;
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.toggle-label {
		font-size: 0.9rem;
	}

	.button-container {
		display: flex;
		gap: 0.4rem;
	}

	.button-container button {
		padding: 0.35rem 0.8rem;
		border-radius: 0.4rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.85rem;
		position: relative;
		overflow: hidden;
	}

	.button-container button.selected {
		background: rgba(255, 193, 7, 0.2);
		border-color: rgba(255, 193, 7, 0.5);
		color: #ffc107;
	}

	.timeout-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.timeout-slider {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 5px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.15);
		outline: none;
		cursor: pointer;
	}

	.timeout-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #ffc107;
		cursor: pointer;
	}

	.timeout-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #ffc107;
		cursor: pointer;
		border: none;
	}

	.timeout-val {
		font-size: 0.9rem;
		min-width: 4rem;
		text-align: right;
		opacity: 0.8;
	}

	.entity-select {
		margin-top: 0.5rem;
	}

	.hint {
		font-size: 0.8rem;
		opacity: 0.5;
		margin: 0.25rem 0 0.5rem 0;
	}

	.chip-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.3rem;
	}

	.chip {
		background: rgba(255, 193, 7, 0.15);
		border: 1px solid rgba(255, 193, 7, 0.3);
		color: #ffc107;
		border-radius: 0.4rem;
		padding: 0.2rem 0.6rem;
		font-size: 0.82rem;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip-remove {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.1rem 0.3rem;
		border-radius: 0.3rem;
		flex-shrink: 0;
	}

	.chip-remove:hover {
		color: rgba(239, 68, 68, 0.8);
	}

	.buttons {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: 1.5rem;
		padding-top: 1.2rem;
		display: flex;
		justify-content: flex-end;
	}

	.action {
		padding: 0.5rem 1.2rem;
		border-radius: 0.4rem;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		position: relative;
		overflow: hidden;
	}

	.done {
		background: rgba(255, 193, 7, 0.2);
		border: 1px solid rgba(255, 193, 7, 0.4);
		color: #ffc107;
	}
</style>
