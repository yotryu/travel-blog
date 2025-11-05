<script lang="ts">
	import type { PageProps } from './$types';
    import { fade } from 'svelte/transition';
    import { resolve } from '$app/paths';

    // state
    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);
    let postClass = $derived(isPortrait ? "image-button-portrait" : "image-button");
    let hoverIndex = $state(-1);

    // prop data
    let { data }: PageProps = $props();
</script>

<!-- Bind innerWidth and innerHeight so we can adapt the layout based on aspect ratio -->
<svelte:window bind:innerWidth bind:innerHeight />

<!-- Main content -->
{#if data.collection}
<div class="overlay">
    <!-- Posts are simply a collection of buttons with orientation-specific class derived from our -->
    <!-- width and height / aspect ratio. -->
    {#each data.collectionPosts as post, i}
        <button class={postClass} onmouseenter={() => hoverIndex = i} onclick={() => window.location.assign(resolve(`/post/${post.id}`))}>
            <img src={post.images[0].collageSrc} alt={post.images[0].collageSrc} />
            <h4 class="title overlay-bottom" transition:fade>{post.title}</h4>
        </button>
    {/each}
</div>

<!-- Add our collection header with subtitle -->
<div class="header">
    <h1 class="title">{data.collection.title}</h1>
    <h3 class="small">{data.collection.subtitle}</h3>
</div>
{/if}

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
        color: #f5f5dc;
        white-space: nowrap;
        overflow: auto;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        background-color: #777;
    }

    .image-button, .image-button-portrait {
        background: none;
        color: inherit;
        border: none;
        padding: 4px 0px 4px 4px;
        margin: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
        width: 20%;
        height: 100%;
        display: inline-block;
        position: relative;
    }

    .image-button-portrait {
        width: 100%;
        height: 20%;
        padding: 4px 4px 0px 4px;
        display: block;
    }

    .overlay-bottom {
        height: 100;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding-left: 1em;
        padding-top: 0.5em;
        padding-bottom: 0.75em;
        color: #f5f5dc;
        text-shadow: 0 2px 6px #000;
    }

    .small {
        font-size: medium;
        margin-top: 0.5em;
        text-shadow: 0 0 4px #000;
    }

    .header {
        position: fixed;
        top: 0;
        left: 0;
        color: beige;
        margin-left: 1em;
        margin-top: 1em;
    }

    .title {
        margin-top: 0;
        margin-bottom: 0;
        font-family: Fira-Regular;
        text-shadow: 0 2px 6px #000;
        text-align: left;
    }
</style>