<script lang="ts">
	import type { PageProps } from './$types';
    import { fly } from 'svelte/transition';
    import { resolve } from '$app/paths';
    import ImageCollage from '$lib/image-collage.svelte';
    import PostNavigation from '$lib/post-navigation.svelte';

    // state
    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);
    let isUltrawide = $derived(innerWidth / innerHeight >= 2);
    let flyData = $derived(isPortrait ? { duration: 200, y: 100, opactiy: 0 } : { duration: 200, x: 100, opacity: 0 });
    let containerClass = $derived(isPortrait ? "content-container-portrait" : "content-container");
    let edgeClass = $derived(isPortrait ? "edge-container-portrait" : "edge-container");
    let isExpanded = $state(false);
    let expandedClass = $derived(isExpanded ? (isPortrait ? "expanded-portrait" : (isUltrawide ? "expanded-ultrawide" : "expanded")) : "");
    let expandArrow = $derived(isPortrait ? "↑" : "←");

    // prop data
    let { data }: PageProps = $props();

    // state derived from prop data
    let images = $derived(data.post.images);
    let thisIndex = $derived(data.collectionPosts.findIndex(i => i.id == data.post.id));
    let prevPost = $derived(thisIndex > 0 ? data.collectionPosts[thisIndex - 1] : null);
    let nextPost = $derived(thisIndex < data.collectionPosts.length - 1 && thisIndex >= 0 ? data.collectionPosts[thisIndex + 1] : null);
</script>

<!-- Bind our innerWidth and innerHeight so we can adapt display to orientation / aspect ratio -->
<svelte:window bind:innerWidth bind:innerHeight />

<!-- Setup our image collage with this post's images -->
<ImageCollage imagesData={images}/>

<!-- Post header with title and date -->
<div class="header">
    <h1 class="title">{data.post.title}</h1>
    <p class="small">{data.post.date}</p>
</div>

{#if isExpanded}
<!-- Post content -->
<div class="overlay" onclickcapture={() => isExpanded = false}>
    <!-- Div to support fade and slide in behaviour -->
    <div transition:fly="{flyData}" class="{containerClass} {expandedClass}">
        <div class="content">
            <!-- Break each post into discreet <p> elements so we get some separation -->
            {#each data.post.contentParagraphs as para}
                <p>{para}</p>
            {/each}
        </div>

        <!-- Next and Previous navigation - data-sveltekit-reload used to ensure correct browser navigation -->
        <div data-sveltekit-reload>
            <table style="width:100%; margin-top:8px;">
                <tbody>
                    <tr>
                        <td style="width:50%">
                            <!-- Only show prev button if there is a previous post -->
                            {#if prevPost != null}
                            <button class="nav-button-prev" data-sveltekit-reload >
                                <img class="nav-bg" src={prevPost.images[0].navSrc} alt="prev"/>
                                <a class="nav-title-prev" href={resolve(`/post/${prevPost.id}`)}>&lt; Previous<br>{prevPost.title}</a>
                            </button>
                            {/if}
                        </td>
                        <td style="width:50%; text-align:right;">
                            <!-- Only show next button if there is a next post -->
                            {#if nextPost != null}
                            <button class="nav-button-next" data-sveltekit-reload >
                                <img class="nav-bg" src={nextPost.images[0].navSrc} alt="prev"/>
                                <a class="nav-title-next" href={resolve(`/post/${nextPost.id}`)}>Next &gt;<br>{nextPost.title}</a>
                            </button>
                            {/if}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
{:else}
<!-- Button to expand our post content - class handles orientation / position -->
<button transition:fly="{flyData}" class="{edgeClass}" onclick={() => isExpanded = true}>{expandArrow}</button>
{/if}

<!-- Inject post navigation -->
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
        margin-top: 2.5em;
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
        border: none;
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
        width: 40px;
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
        height: 38px;
    }

    .content {
        overflow: scroll;
        scrollbar-width: none;
        padding-right: 1em;
        border-bottom: 1px solid beige;
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