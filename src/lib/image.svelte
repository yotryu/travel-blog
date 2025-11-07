<!-- Component to manage showing a loading spinner while loading an image, then switch to the image when complete -->
<script lang="ts">
    import {onMount} from 'svelte';

    let { src, clazz } = $props();

    // Image container and loading state
    let image = new Image();

    let loading = $state(false);
    let loaded = $state(false);
    let failed = $state(false);

    // Using an effect to track changes since we are applying src to image.src, and image isn't stateful
    $effect(() => {
        if (image.src == src)
        {
            return;
        }
        
        image.src = src;
        loading = true;
        loaded = false;
        failed = false;
    });

    // Setup callbacks and base state
    onMount(() => {
        image.onload = () => {
            loading = false;
            loaded = true;
        }

        image.onerror = () => {
            loading = false;
            failed = true;
        };

        image.src = src;
    });
</script>

<!-- Basic logic for showing the different states of loading, loaded, or failed -->
{#if loaded}
	<img class={clazz} src={src} alt={src} />
{:else if failed}
	<img src="https://icon-library.com/images/not-found-icon/not-found-icon-20.jpg" alt="Not Found" />
{:else if loading}
    <div class="center">
	    <div class="circle"></div>
    </div>
{/if}

<style>
    @keyframes scaleIn {
        from {
            transform: rotate(0deg);
            opacity: 0.5;
        }
        to {
            transform: rotate(360deg);
            opacity: 0.5;
        }
    }

    .center {
        display: flex;
        vertical-align: middle;
        text-align: center;
    }

    .circle {
        border-radius: 50%;
        border: 10px solid beige;
        border-top-color: transparent;
        border-bottom-color: transparent;
        width: 50px;
        height: 50px;
        position: absolute;
        top: calc(50% - 25px);
        left: calc(50% - 25px);
        opacity: 0;
        animation: scaleIn 1s infinite cubic-bezier(0.36, 0.11, 0.5, 0.36);
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
</style>