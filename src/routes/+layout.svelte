<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import fullscreenIcon from '$lib/assets/fullscreen_icon.svg';
	import exitFullscreenIcon from '$lib/assets/exit_fullscreen_icon.svg';

	let { children } = $props();
	let fullscreenElement = $state(null);
	let inFullscreen = $derived(!!fullscreenElement);

	function toggleFullscreen()
	{
		let elem = document.documentElement;
		if (document.fullscreenElement)
		{
			document.exitFullscreen();
		}
		else
		{
			elem.requestFullscreen();
		}
	}
</script>

<svelte:document bind:fullscreenElement={fullscreenElement}/>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<button class="fullscreen-button" onclick={toggleFullscreen}>
	{#if inFullscreen}
		<img class="button-image" src={exitFullscreenIcon} alt={exitFullscreenIcon}/>
	{:else}
		<img class="button-image" src={fullscreenIcon} alt={fullscreenIcon}/>
	{/if}
</button>


<style>
	.fullscreen-button {
		position: fixed;
		right: 0;
		bottom: 0;
		padding: 0;
		margin: 0;
		width: 40px;
		height: 38px;
		background-color: #000A;
		border: none;
		text-align: center;
		vertical-align: middle;
		border-radius: 10px 10px 0 10px;
		cursor: pointer;
		filter: beige;
	}

	.button-image {
		width: auto;
		height: 100%;
	}
</style>