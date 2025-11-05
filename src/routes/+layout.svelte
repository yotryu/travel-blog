<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import fullscreenIcon from '$lib/assets/fullscreen_icon.svg';
	import exitFullscreenIcon from '$lib/assets/exit_fullscreen_icon.svg';

	let { children } = $props();
	
	// state
	let fullscreenElement = $state(null);
	let inFullscreen = $derived(!!fullscreenElement);


	// Helper to toggle fullscreen mode.
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

<!-- Bind to the fullscreenElement so we can get state updates when it changes -->
<svelte:document bind:fullscreenElement={fullscreenElement}/>

<!-- favicon -->
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Render child content -->
{@render children?.()}

<!-- Overlay our fullscreen request / exit button, showing appropriate icon for current state -->
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
		padding-top: 3px;
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
		height: 80%;
	}
</style>