<script lang="ts">
	import type { PageProps } from './$types';
    import type { PostImage } from '$lib/types';
    import { fade, fly } from 'svelte/transition';
    import { resolve } from '$app/paths';
    import { onMount } from 'svelte';
    import settingsIcon from '$lib/assets/slideshow_icon.svg';
    import upIcon from '$lib/assets/up_icon.svg';


    // common data
    const flyData = { duration: 200, y: 100, opactiy: 0 };

    // state
    let selected = $state(0);
    let autoHideNavigation = $state(false);
    let collectionsExpanded = $state(false);
    let settingsExpanded = $state(false);
    let slideshowCollectionIndex = $state(-1);
    let slideshowInterval = $state(10);
    let slideshowCollections = $state([] as any[]);
    let useFirstImage = $state(false);
    let useSecondImage = $state(false);
    let firstImage = $state({} as HTMLImageElement);
    let secondImage = $state({} as HTMLImageElement);

    // basic vars
    let imageIndex = -1;
    let lastChange = Date.now();
    let changeImageTimerHandle = 0;
    let wakeLock: WakeLockSentinel | null = null;
    let imageOrder: PostImage[] =[];

    // prop data
    let { data }: PageProps = $props();


    // Custom shuffle function which optionally forces a certain element to be first.
    // Collections usually have a forced first image, so this ensures that image is the first in the shuffled array.
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

    // Clear and Set a new image change timer.
    function setChangeImageTimer(millis: number)
    {
        if (changeImageTimerHandle)
        {
            clearTimeout(changeImageTimerHandle);
        }

        changeImageTimerHandle = setTimeout(() => changeImage(), millis);
    }

    // Set a new current collection selection, and calculate a new image shuffle order.
    function setSelection(num: number)
    {
        const newSelection = num;
        selected = newSelection >= 0 && newSelection < data.collections.length ? newSelection : selected;

        if (selected == newSelection) {
            imageOrder = getShuffledArray(data.collections[num].titleImages, data.collections[num].forceFirstTitleImage);
            imageIndex = -1;
            setChangeImageTimer(100);
        }
    }

    // Helper for adjusting selection by an offset.
    function changeSelection(offset: number)
    {
        const newSelection = selected + offset;
        setSelection(newSelection);
    }

    // Start a slideshow, setting state to show only what we need for this mode.
    // TODO: Support all slideshow modes.
    async function doSlideshow(thisOnly: boolean)
    {
        try {
            wakeLock = await navigator.wakeLock.request("screen");
        } catch (err) {
            wakeLock = null;
        }

        collectionsExpanded = false;
        settingsExpanded = false;
        autoHideNavigation = true;

        slideshowCollections = thisOnly ? [data.collections[selected]] : data.collections;

        slideshowCollectionIndex = 0;
        imageIndex = -1;
        setChangeImageTimer(100);
    }

    // Exist slideshow mode.
    function stopSlideshow()
    {
        if (wakeLock)
        {
            try {
                wakeLock.release();
            }
            catch {}
            
            wakeLock = null;
        }

        autoHideNavigation = false;
        settingsExpanded = false;
        slideshowCollectionIndex = -1;
        imageIndex = -1;
        setChangeImageTimer(100);
    }

    // Support for scrolling through collections using scroll wheel / touch swipe
    function wheelHandler(event: WheelEvent)
    {
        const minTime = 300;
        const minMovement = 30;

        if (collectionsExpanded)
        {
            return;
        }

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

    // Increment image to show and request the change with the next internal image container.
    // Once the image is loaded, we switch image container to show which causes a transition between them.
    function changeImage() {
        imageIndex = (imageIndex + 1) % imageOrder.length;

        if (useFirstImage) {
            // we'll be applying this to the second image
            secondImage.src = imageOrder[imageIndex].src;
        }
        else {
            // applying to the first image
            firstImage.src = imageOrder[imageIndex].src;
        }
    }

    // Utility function to consolidate image duration based on mode.
    function getImageChangeTime()
    {
        return slideshowCollectionIndex >= 0 ? slideshowInterval * 1000 : 10000;
    }

    // Callback for "first" image being loaded ("first" image container).
    function onFirstImageLoaded()
    {
        // Image loaded, so update our state to show this image, and set our next timer.
        useFirstImage = true;
        useSecondImage = false;
        setChangeImageTimer(getImageChangeTime());
    }

    // Callback for "first" image load error.
    function onFirstImageError()
    {
        // Usually this results in the container being in a bad state,
        // so construct a new one and request the image again after 1s.
        firstImage = new Image();
        firstImage.onload = onFirstImageLoaded;
        firstImage.onerror = onFirstImageError;

        setChangeImageTimer(1000);
    }

    // Callback for "second" image being loaded ("second" image container).
    function onSecondImageLoaded()
    {
        // Image loaded, so update our state to show this image, and set our next timer.
        useFirstImage = false;
        useSecondImage = true;
        setChangeImageTimer(getImageChangeTime());
    }

    // Callback for "second" image load error.
    function onSecondImageError()
    {
        // Usually this results in the container being in a bad state,
        // so construct a new one and request the image again after 1s.
        secondImage = new Image();
        secondImage.onload = onSecondImageLoaded;
        secondImage.onerror = onSecondImageError;

        setChangeImageTimer(1000);
    }


    onMount(() => {
        // Init our image containers
        firstImage = new Image();
        firstImage.onload = onFirstImageLoaded;
        firstImage.onerror = onFirstImageError;

        secondImage = new Image();
        secondImage.onload = onSecondImageLoaded;
        secondImage.onerror = onSecondImageError;

        // Select first collection, which will request our first image
        setSelection(0);
    });
</script>


<!-- Add handler for scrolling to control collection navigation -->
<svelte:window on:wheel={(e) => wheelHandler(e)} />

<!-- Main content -->
<div class="overlay" >
{#if selected >= 0 || (slideshowCollectionIndex >= 0 && slideshowCollections.length > 0)}
    {@const collection = slideshowCollectionIndex >= 0 ? slideshowCollections[slideshowCollectionIndex] : data.collections[selected]}
    <div transition:fade class="collection-page" id="image-root">

        <!-- Handle which image to display, with fade transitions -->
        {#if useFirstImage && firstImage}
            <div transition:fade={{duration: 1000}} class="overlay">
                <img class="collection-image" src={firstImage.src} alt={firstImage.src}/>
            </div>
        {:else if useSecondImage && secondImage}
            <div transition:fade={{duration: 1000}} class="overlay">
                <img transition:fade class="collection-image" src={secondImage.src} alt={secondImage.src}/>
            </div>
        {/if}

        <!-- Our header for the current collection -->
        <div class="header" data-sveltekit-reload>
            <h1 class="title"><a href={resolve(`/collection/${collection.id}`)}>{collection.title}</a></h1>
            <h3 class="small">{collection.subtitle}</h3>

            <!-- Explicit "view" button to aid with navigation - gets hidden in slideshow mode -->
            {#if !autoHideNavigation}
                <button class="basic-button">
                    <a href={resolve(`/collection/${collection.id}`)}>View</a>
                </button>
            {/if}
        </div>
    </div>
{/if}

<!-- Collection selection show tab button -->
{#if !collectionsExpanded && !autoHideNavigation}
    <button class="tab-bottom" transition:fly="{flyData}" onclick={() => collectionsExpanded = true}>
        <img class="tab-button-image" src={upIcon} alt={upIcon}/>
    </button>
{/if}
</div>

<!-- Collection selection panel -->
{#if collectionsExpanded}
<div class="collection-popup" transition:fly="{flyData}">
    <div class="collection-container" >
    {#each data.collections as collection, i}
        {@const imageIndex = collection.forceFirstTitleImage >= 0 ? collection.forceFirstTitleImage : 0}
        {@const titleImage = collection.titleImages[imageIndex].navSrc}
        {@const imageClass = selected == i ? "collection-bg-selected" : "collection-bg"}
        <div class="collection-div">
            <button class="collection-button" onclick={(e) => {setSelection(i); e.stopPropagation();}}>
                <!-- Lazy load the images, otherwise we will encounter request limit issues -->
                <img class={imageClass} src={titleImage} alt={collection.title} loading="lazy"/>
                <p class="small collection-title">{collection.title}</p>
            </button>
        </div>
    {/each}
    </div>
</div>
{/if}

<!-- When collection selection panel is open, click anywhere outside it to close it -->
{#if collectionsExpanded}
<div class="overlay" onclickcapture={() => collectionsExpanded = false}></div>
{/if}

<!-- Settings button (in corner) -->
<button class="settings-button" onclick={() => settingsExpanded = true}>
	<img class="settings-button-image" src={settingsIcon} alt={settingsIcon}/>
</button>

<!-- When settings panel is open, click outside it to close -->
{#if settingsExpanded}
<div class="overlay" onclickcapture={() => settingsExpanded = false}></div>

<!-- Settings panel -->
<div class="settings-container" transition:fade>
    <h4 class="settings-title">Slideshow</h4>

    <!-- TODO: support more options, several collections, configs per type of slideshow? -->
    {#if slideshowCollectionIndex < 0}
        <div class="settings-option">
            <p class="inline-text settings-no-margins">Image duration</p>
            <input class="settings-input" type="number" min="5" max="600" step="1" value={slideshowInterval} size="5" 
                onchange={(e) => slideshowInterval = Number((e.target as HTMLInputElement).value ? (e.target as HTMLInputElement).value : 10)}/>
        </div>
        <div class="settings-option">
            <button class="text-button settings-full-width" onclick={() => doSlideshow(true)}>This Collection</button>
        </div>
        <div class="settings-option">
            <button class="text-button settings-full-width" onclick={() => doSlideshow(false)}>All Collections</button>
        </div>
    {:else}
        <div class="settings-option">
            <button class="text-button settings-full-width" onclick={() => stopSlideshow()}>Stop</button>
        </div>
    {/if}
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
    }

    .tab-bottom {
        height: 30px;
        position: absolute;
        bottom: 0;
        left: calc(50% - 20px);
        width: 50px;
        padding-top: 5px;
        color: #f5f5dc;
        border: none;
        border-radius: 10px 10px 0 0;
        background-color: #000A;
        text-align: center;
        font-size: larger;
        vertical-align: middle;
        cursor: pointer;
    }

    .tab-button-image {
		width: auto;
		height: 90%;
	}

    .basic-button {
        background-color: #444A;
        font-family: Fira-Regular;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        color: beige;
    }

    .basic-button:hover {
        background-color: #666A;
    }

    .basic-button:active {
        background-color: #444A;
    }

    .small {
        font-size: medium;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
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

    a {
        text-decoration: none;
        color: beige;
        font-family: Fira-Regular;
    }

    .collection-popup {
		grid-area: nav;
        height: 124px;
		position: absolute;
        left: 0;
        right: 0;
		bottom: 0;
        color: beige;
		font-family: Fira-Regular;
        background-color: #000A;
		transition: ease-out 200ms;
		overflow: auto;
        white-space: nowrap;
		z-index: 10;
	}

    .collection-container {
        padding: 8px;
        position: relative;
    }

    .collection-bg, .collection-bg-selected {
        width: 100%;
		border-radius: 10px;
        border: 4px solid transparent;
        object-fit: cover;
        filter: brightness(0.65);
    }

    .collection-bg-selected {
        border: 4px solid beige;
    }

    .collection-title {
        position: absolute;
        color: beige;
		padding-top: 4px;
		padding-left: 10px;
		font-family: Fira-Regular;
		text-decoration: none;
    }

	.collection-div {
		padding: 4px;
        display: inline-block;
        height: 100px;
	}

	.collection-button {
        border: none;
		border-radius: 4px;
		background: none;
		width:200px;
        height:100%;
        overflow:hidden;
        display:flex;
		margin: auto;
		text-align: center;
        justify-content: left;
        vertical-align: middle;
		cursor: pointer;
	}

    .settings-container {
        position: absolute;
        left: 0;
        bottom: 38px;
        width: 200px;
        background-color: #000A;
        border-radius: 10px 10px 10px 0px;
        color: beige;
        font-family: Fira-Regular;
        padding-left: 1em;
        padding-bottom: 1em;
    }

    .settings-button {
		position: fixed;
		left: 0;
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
		border-radius: 10px 10px 10px 0px;
		cursor: pointer;
		filter: beige;
	}

	.settings-button-image {
		width: auto;
		height: 80%;
	}

    .settings-option {
        position: relative;
        margin-top: 1em;
    }

    .settings-no-margins {
        margin: 0;
        padding: 0;
    }

    .settings-input {
        display: inline-block;
        position: absolute;
        right: 1em;
        text-align: right;
    }

    .text-button {
        background-color: #222A;
        font-family: Fira-Regular;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        color: beige;
    }

    .text-button:hover {
        background-color: #666A;
    }

    .text-button:active {
        background-color: #222A;
    }

    .settings-full-width {
        width: calc(100% - 1em);
    }

    .inline-text {
        display: inline-block;
    }
</style>