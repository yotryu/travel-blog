<script lang="ts">
	import type { PageProps } from './$types';
    import { crossfade, fade, fly, scale } from 'svelte/transition';
    import { swipe, type SwipeCustomEvent } from 'svelte-gestures';
    import { resolve } from '$app/paths';
    import { onMount } from 'svelte';

    function getShuffledArray(array: any[], forceFirst: number): any[]
    {
        let result = [...array];
        let addAsFirst = null;
        if (forceFirst != undefined && forceFirst >= 0 && forceFirst < array.length)
        {
            addAsFirst = result.splice(forceFirst, 1);
        }

        for (var i = result.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = result[i];
            result[i] = result[j];
            result[j] = temp;
        }

        if (addAsFirst)
        {
            result = addAsFirst.concat(result);
        }

        return result;
    }

    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);
    let isUltrawide = $derived(innerWidth / innerHeight >= 2);
    let postClass = $derived(isPortrait ? "image-button-portrait" : "image-button");
    let selected = $state(0);
    let imageIndex = -1;
    let lastChange = Date.now();
    let useFirstImage = $state(false);
    let useSecondImage = $state(false);
    let firstImage = $state({} as HTMLImageElement);
    let secondImage = $state({} as HTMLImageElement);
    let changeImageTimerHandle = 0;

    let { data }: PageProps = $props();

    let imageOrder = $derived(getShuffledArray(data.collections[selected].titleImages, data.collections[selected].forceFirstTitleImage));


    function setChangeImageTimer(millis: number)
    {
        if (changeImageTimerHandle)
        {
            clearTimeout(changeImageTimerHandle);
        }

        changeImageTimerHandle = setTimeout(() => changeImage(), millis);
    }

    function setSelection(num: number)
    {
        const newSelection = num;
        selected = newSelection >= 0 && newSelection < data.collections.length ? newSelection : selected;

        if (selected == newSelection) {
            imageIndex = -1;
            setChangeImageTimer(100);
        }
    }

    function changeSelection(offset: number)
    {
        const newSelection = selected + offset;
        setSelection(newSelection);
    }

    function swipeHandler(event: SwipeCustomEvent)
    {
        if (event.detail.direction == 'right')
        {
            changeSelection(-1);
        }
        else if (event.detail.direction == 'left')
        {
            changeSelection(1);
        }
    }

    function wheelHandler(event: WheelEvent)
    {
        const minTime = 300;
        const minMovement = 30;

        if (Math.abs(event.deltaX) < minMovement)
        {
            return;
        }

        if (Date.now() - lastChange < minTime)
        {
            return;
        }
        
        if (event.deltaX < 0)
        {
            changeSelection(1);
            lastChange = Date.now();
        }
        else if (event.deltaX > 0)
        {
            changeSelection(-1);
            lastChange = Date.now();
        }
    }

    function changeImage() {
        imageIndex = (imageIndex + 1) % imageOrder.length;
        changeImageTimerHandle = 0;

        if (useFirstImage) {
            // we'll be applying this to the second image
            secondImage.src = imageOrder[imageIndex];
        }
        else {
            // applying to the first image
            firstImage.src = imageOrder[imageIndex];
        }
    }

    onMount(() => {
        firstImage = new Image();

        firstImage.onload = () => {
            useFirstImage = true;
            useSecondImage = false;
            setChangeImageTimer(10000);
        };

        secondImage = new Image();

        secondImage.onload = () => {
            useFirstImage = false;
            useSecondImage = true;
            setChangeImageTimer(10000);
        };

        setSelection(0);
    });
</script>

<svelte:window bind:innerWidth bind:innerHeight on:wheel={(e) => wheelHandler(e)} />


<div class="overlay" use:swipe={() => ({timeframe: 200, minSwipeDistance: 50, touchAction: 'pan-y'})} onswipe={swipeHandler}>
{#if selected >= 0}
    {@const collection = data.collections[selected]}
    <div transition:fade class="collection-page" id="image-root">
        {#if useFirstImage && firstImage}
            <div transition:fade={{duration: 1000}} class="overlay">
                <img class="collection-image" src={firstImage.src} alt={firstImage.src}/>
            </div>
        {:else if useSecondImage && secondImage}
            <div transition:fade={{duration: 1000}} class="overlay">
                <img transition:fade class="collection-image" src={secondImage.src} alt={secondImage.src}/>
            </div>
        {/if}
        <div class="header" data-sveltekit-reload>
            <h1 class="title"><a href={resolve(`/collection/${collection.id}`)}>{collection.title}</a></h1>
            <h3 class="small">{collection.subtitle}</h3>
        </div>
    </div>
{/if}
    <div class="overlay-bottom">
        {#each data.collections as collection, i}
            {@const dotClass = (i == data.collections.length - 1 ? "item-dot-spacing-last" : "item-dot-spacing")}
            <div class={dotClass}>
                {#if selected == i}
                    <div transition:scale class="item-dot-selected"></div>
                {:else}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div transition:scale class="item-dot tooltip" onclick={() => setSelection(i)}>
                        <span class="tooltiptext">{collection.title}</span>
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
        overflow: hidden;
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
        background-color: #000;
    }

    .collection-image {
        width: 100%;
        height: 100%;
        display: inline-block;
        object-fit: cover;
        background-color: #000;
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
        background-color: #000A;
        text-align: center;
        vertical-align: middle;
    }

    .item-dot-spacing, .item-dot-spacing-last {
        display: inline-block;
        position: relative;
        width: 15px;
        height: 15px;
        margin-right: 0.5em;
    }

    .item-dot-spacing-last {
        margin-right: 0;
    }

    .item-dot {
        display: inline-block;
        position: absolute;
        top: 0;
        left: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-bottom: 1px;
        border: 2px solid beige;
        cursor: pointer;
    }

    .item-dot-selected {
        display: inline-block;
        position: absolute;
        top: 0;
        left: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: beige;
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

    /* Tooltip container */
    .tooltip {
        position: relative;
        display: inline-block;
    }

    /* Tooltip text */
    .tooltiptext, .tooltiptext-selected {
        visibility: hidden;
        width: 200px;
        background-color: beige;
        color: #000;
        text-align: center;
        font-family: Fira-Regular;
        padding: 5px 0;
        border-radius: 6px;

        /* Position the tooltip text */
        position: absolute;
        z-index: 1;
        bottom: 22px;
        left: 50%;
        margin-left: -100px;

        /* Fade in tooltip */
        opacity: 0;
        transition: opacity 0.3s;
    }

    .tooltiptext-selected {
        bottom: 26px;
    }

    /* Tooltip arrow */
    .tooltiptext::after, .tooltiptext-selected::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -10px;
        border-width: 10px;
        border-style: solid;
        border-color: beige transparent transparent transparent;
    }

    /* Show the tooltip text when you mouse over the tooltip container */
    .tooltip:hover .tooltiptext, .tooltip:hover .tooltiptext-selected {
        visibility: visible;
        opacity: 1;
    }

    .small {
        font-size: medium;
        margin-top: 0.5em;
        text-shadow: 0 0 4px #000;
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