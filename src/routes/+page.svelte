<script lang="ts">
	import type { PageProps } from './$types';
    import { fade, fly } from 'svelte/transition';
    import { resolve } from '$app/paths';

    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);
    let isUltrawide = $derived(innerWidth / innerHeight >= 2);
    let postClass = $derived(isPortrait ? "image-button-portrait" : "image-button");

    let { data }: PageProps = $props();
    let selected = $state(0);
    let hoverIndex = $state(-1);
</script>

<svelte:window bind:innerWidth bind:innerHeight />


<div class="overlay">
{#each data.collections as collection}
    <div class="collection-page">
        <img class="collection-image" src={collection.titleImage} alt={collection.titleImage}/>
        <div class="header">
            <h1 class="title">{collection.title}</h1>
        </div>
    </div>
{/each}
    <div class="overlay-bottom">
        {#each data.collections as collection, i}
            {@const dotClass = selected == i ? "item-dot-selected" : "item-dot"}
            <div class={dotClass} onmouseenter={() => hoverIndex = i} onmouseleave={() => hoverIndex = -1}>
                {#if hoverIndex == i}
                    <div transition:fade class="preview">
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>


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
        padding: 0;
        margin: 0;
    }

    .overlay {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        color: #f5f5dc;
        white-space: nowrap;
    }

    .collection-line {
        width: 100%;
        height: 100px;
        position: relative;
        overflow: hidden;
    }

    .line-image {
        width: 200px;
        height: 100%;
        object-fit: cover;
        display: inline-block;
    }

    .collection-page {
        width: 100%;
        height: 100%;
        display: inline-block;
        position: relative;
    }

    .collection-image {
        width: 100%;
        height: 100%;
        display: inline-block;
        object-fit: cover;
        background-color: #777;
        position: relative;
        /* filter: brightness(0.5); */
    }

    .overlay-bottom {
        height: 100;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding-top: 0.7em;
        padding-bottom: 0.5em;
        color: #f5f5dc;
        /* text-shadow: 0 2px 6px #000; */
        background-color: #0005;
        text-align: center;
        vertical-align: middle;
    }

    .item-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 1em;
        margin-bottom: 0.1em;
        border: 2px solid beige;
        position: relative;
    }

    .item-dot-selected {
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        margin-right: 1em;
        background-color: beige;
        position: relative;
    }

    .preview {
        position: absolute;
        display: inline-block;
        left: -100px;
        top: -100px;
        width: 200px;
        height: 100px;
        background-color: beige;
    }

    .small {
        font-size: smaller;
        margin-bottom: 0.5em;
        margin-top: 0;
        /* text-shadow: 0 0 4px #000; */
    }

    .header {
        position: absolute;
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
        left: 65%;
        right: 0;
    }

    .expanded-ultrawide {
        left: 60%;
        right: 0;
    }

    .expanded-portrait {
        max-height: 70vh;
    }

    .edge-container,
    .edge-container-portrait {
        right: 0;
        width: 30px;
        background: #111C;
        padding: unset;
        display: flex;
        justify-content: center;
        align-items: center;
        color: grey;
        cursor: pointer;
        font-family: Fira-Regular;
        font-size: large;
    }

    .edge-container-portrait {
        width: unset;
        height: 40px;
    }

    .content {
        overflow: scroll;
        scrollbar-width: none;
        /* position: relative; */
        /* bottom: 100px; */
        /* top: 0; */
        /* bottom: 3em; */
        padding-right: 1em;
        border-bottom: 1px solid beige;
    }

    .content-bottom {
        position: fixed;
        bottom: 1em;
    }

    .left-align {
        text-align: left;
    }

    .right-align {
        text-align: right;
        width: 100%;
    }

    .nav-button-prev,
    .nav-button-next {
		border: none;
        border-radius: 6px;
		background: none;
		width:100%;
        height:50px;
        overflow:hidden;
        display:flex;
		/* margin: auto; */
        padding: 0;
		text-align: left;
        justify-content: left;
        vertical-align: middle;
		cursor: pointer;
	}

    .nav-button-next {
        text-align: right;
        justify-content: right;
    }

    .nav-title-prev,
    .nav-title-next {
        position: absolute;
        color: beige;
		padding-top: 10px;
		padding-left: 10px;
		font-family: Fira-Regular;
		text-decoration: none;
    }

    .nav-title-next {
        padding-right: 10px;
    }

    .nav-bg {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: brightness(0.65);
    }

    a {
        text-decoration: none;
        color: beige;
        font-family: Fira-Regular;
    }
</style>