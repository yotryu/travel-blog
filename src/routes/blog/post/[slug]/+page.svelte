<script lang="ts">
	import type { PageProps } from './$types';
    import { fly } from 'svelte/transition';
    import { swipe, type SwipeCustomEvent } from 'svelte-gestures';
    import ImageCollage from '$lib/image-collage.svelte';
    import PostNavigation from '$lib/post-navigation.svelte';

    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);
    let flyData = $derived(isPortrait ? { duration: 200, y: 100, opactiy: 0 } : { duration: 200, x: 100, opacity: 0 });
    let containerClass = $derived(isPortrait ? "content-container-portrait" : "content-container");
    let edgeClass = $derived(isPortrait ? "edge-container-portrait" : "edge-container");
    let isExpanded = $state(false);
    let expandedClass = $derived(isExpanded ? (isPortrait ? "expanded-portrait" : "expanded") : "");
    let expandArrow = $derived(isPortrait ? "^" : "<");

    function swipeHandler(event: SwipeCustomEvent)
    {
        if (!isExpanded && event.detail.direction == 'top')
        {
            isExpanded = true;
        }
        else if (isExpaned && event.detail.direction == 'bottom')
        {
            isExpanded = false;
        }
    }

    let { data }: PageProps = $props();
    let images = $derived(data.post.images);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<ImageCollage imagesData={images}/>

<div class="header">
    <h1 class="title">{data.post.title}</h1>
    <p class="small">{data.post.date}</p>
</div>

{#if isExpanded}
<div class="overlay" onclickcapture={() => isExpanded = false}>
    <div transition:fly="{flyData}" class="{containerClass} {expandedClass}">
        <div use:swipe={() => ({timeframe: 300, minSwipeDistance: 100})} onswipe={swipeHandler}>
        {#each data.post.contentParagraphs as para}
            <p>{para}</p>
        {/each}
        </div>
    </div>
</div>
{:else}
<div transition:fly="{flyData}" class="{edgeClass}" onclick={() => isExpanded = true}>{expandArrow}</div>
{/if}
<PostNavigation postNavData={data} />

<style>
    @font-face {
        font-family: Fira-ExtraLight;
        src: url(/FiraSans-ExtraLight.ttf);
    }
    @font-face {
        font-family: Fira-Regular;
        src: url(/FiraSans-Regular.ttf);
    }

    div {
        font-family: Fira-ExtraLight;
    }

    .overlay {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        color: beige;
    }

    .overlay-bottom {
        width: 100%;
        height: 50%;
        position: absolute;
        top: 50%;
        left: 0;
    }

    .small {
        font-size: smaller;
        margin-bottom: 0.5em;
        margin-top: 0;
        text-shadow: 0 0 4px #000;
    }

    .header {
        position: absolute;
        top: 0;
        left: 0;
        color: beige;
        margin-left: 1em;
        margin-top: 2em;
    }

    .title {
        margin-top: 0;
        margin-bottom: 0;
        font-family: Fira-Regular;
        text-shadow: 0 2px 6px #000;
    }

    .content-container,
    .content-container-portrait,
    .edge-container,
    .edge-container-portrait {
        position: absolute;
        bottom: 0;
        top: 0;
        padding: 0.5em 2em;
        overflow: scroll;
        scrollbar-width: none;
        background: #111E;
        border-radius: 10px 0 0 10px;
        transition: ease-out 200ms;
    }

    .content-container-portrait,
    .edge-container-portrait {
        top: unset;
        left: 0;
        right: 0;
        border-radius: 10px 10px 0 0;
    }

    .expanded {
        left: 70%;
        right: 0;
    }

    .expanded-portrait {
        max-height: 75vh;
    }

    .edge-container,
    .edge-container-portrait {
        right: 0;
        width: 30px;
        padding: unset;
        display: flex;
        justify-content: center;
        align-items: center;
        color: grey;
        cursor: pointer;
        font-family: Fira-Regular;
    }

    .edge-container-portrait {
        width: unset;
        height: 30px;
    }
</style>