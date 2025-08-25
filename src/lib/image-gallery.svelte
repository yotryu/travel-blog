<script lang="ts">
    import Image from './image.svelte'
	let { imagesData, index, onSelect, onDismiss } = $props();
    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);
    let listClass = $derived(isPortrait ? "image-list-portrait" : "image-list");
    let buttonClass = $derived(isPortrait ? "image-button-portrait" : "image-button");
    let mainImageClass = $derived(isPortrait ? "main-image-portrait" : "main-image");
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if index >= 0}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay">
    <div class={listClass}>
    {#each imagesData as imageData, i}
        {@const selectedClass = i == index ? "selected": ""}
        <button class="{buttonClass} {selectedClass}" onclick={(e) => onSelect(i)}>
            <img class="image-preview" src={imageData.navSrc} alt={imageData.navSrc} />
        </button>
    {/each}
    </div>
    <div class={mainImageClass}>
        <Image clazz="main-image-img" src={imagesData[index].src} />
    </div>
    <div class="close">
        <button class="close-button" onclick={() => onDismiss()}>Close</button>
    </div>
</div>
{/if}

<style>
    @font-face {
        font-family: Fira-Regular;
        src: url(/FiraSans-Regular.ttf);
    }

    .overlay {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 20;
        background-color: #000D;
    }

    .close {
        position:absolute;
        left: 10px;
        top: 10px;
        height: 30px;
        border-radius: 4px;
        background-color: #555C;
        text-align: center;
        vertical-align: middle;
        justify-content: center;
    }

    .close-button {
        border: none;
        background: none;
        /* padding: 0; */
        margin: auto;
        width: 100%;
        height: 100%;
        color: beige;
        font-family: Fira-Regular;
        cursor: pointer;
    }
    
    .image-list,
    .image-list-portrait {
        position: absolute;
        /* display: block; */
        justify-content: center;
        text-align: center;
        left: 0;
        top: 0;
        width: 220px;
        height: calc(100% - 2em);
        overflow: scroll;
        scrollbar-width: none;
        margin: 1em 0;
        border-right: 1px solid beige;
    }

    .image-list-portrait {
        top: unset;
        height: unset;
        display: inline-block;
        overflow: auto;
        white-space: nowrap;
        bottom: 0;
        width: calc(100% - 2em);
        height: 20%;
        margin: 0 1em;
        border-right: unset;
        border-top: 1px solid beige;
    }

    .image-button,
    .image-button-portrait {
        border: 4px solid #FFF0;
		border-radius: 4px;
        padding: 0;
        max-width: 180px;
		background: none;
        overflow:hidden;
        display:flex;
		margin: 1em auto;
		text-align: center;
        justify-content: left;
        vertical-align: middle;
		cursor: pointer;
    }

    .image-button-portrait {
        display: inline-block;
        max-width: unset;
        max-height: 200px;
    }

    .image-preview {
        /* width: 100%; */
        height: 130px;
        margin: auto;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        /* object-fit: cover; */
    }

    .selected {
        border: 4px solid cadetblue;
    }

    .main-image,
    .main-image-portrait {
        position: absolute;
        top: 0;
        left: 220px;
        bottom: 0;
        right: 0;
        padding: 20px;
        vertical-align: middle;
        text-align: center;
        display: flex;
    }

    .main-image-portrait {
        left: 0;
        bottom: 20%;
    }

    .main-image-img {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        padding: 0;
        margin: 0;
        object-fit: contain;
    }

    /* img {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        margin: auto;
        object-fit: contain;
    } */
</style>