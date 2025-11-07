<!-- Handles layout of images in a fullscreen collage format -->
<script lang="ts">
    import ImageGallery from '$lib/image-gallery.svelte';

    // prop data
	let { imagesData } = $props();
    let imageCount = $derived(imagesData.length);

    // state
    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);
    let showImageAtIndex = $state(-1);

    // Simple interface to define image bounds in each config
    interface Rect {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }

    // Defines a specific config for image display based on aspect ratio and number of images
    interface Config {
        primaryAspect: "landscape" | "portrait" | "any";
        images: Rect[];
    }

    // Config definition
    // Currently have a portrait and landscape configuration for 1-9 images
    const configs: Config[][] = [
        [ // 1 image
            {
                primaryAspect: "any",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 100 }
                ]
            }
        ],
        [ // 2 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 50, bottom: 100 },
                    { left: 50, top: 0, right: 100, bottom: 100 },
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 50 },
                    { left: 0, top: 50, right: 100, bottom: 100 },
                ]
            }
        ],
        [ // 3 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 60, bottom: 100 },
                    { left: 60, top: 0, right: 100, bottom: 50 },
                    { left: 60, top: 50, right: 100, bottom: 100 }
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 50 },
                    { left: 0, top: 50, right: 50, bottom: 100 },
                    { left: 50, top: 50, right: 100, bottom: 100 }
                ]
            }
        ],
        [ // 4 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 60, bottom: 60 },
                    { left: 60, top: 0, right: 100, bottom: 50 },
                    { left: 60, top: 50, right: 100, bottom: 100 },
                    { left: 0, top: 60, right: 60, bottom: 100 }
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 50 },
                    { left: 0, top: 50, right: 50, bottom: 100 },
                    { left: 50, top: 50, right: 100, bottom: 75 },
                    { left: 50, top: 75, right: 100, bottom: 100 }
                ]
            }
        ],
        [ // 5 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 60, bottom: 60 },
                    { left: 60, top: 0, right: 100, bottom: 50 },
                    { left: 60, top: 50, right: 100, bottom: 100 },
                    { left: 0, top: 60, right: 30, bottom: 100 },
                    { left: 30, top: 60, right: 60, bottom: 100 }
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 40 },
                    { left: 0, top: 40, right: 50, bottom: 75 },
                    { left: 50, top: 65, right: 100, bottom: 100 },
                    { left: 0, top: 75, right: 50, bottom: 100 },
                    { left: 50, top: 40, right: 100, bottom: 65 }
                ]
            }
        ],
        [ // 6 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 60, bottom: 60 },
                    { left: 0, top: 60, right: 33, bottom: 100 },
                    { left: 33, top: 60, right: 67, bottom: 100 },
                    { left: 67, top: 60, right: 100, bottom: 100 },
                    { left: 60, top: 0, right: 100, bottom: 30 },
                    { left: 60, top: 30, right: 100, bottom: 60 }
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 35 },
                    { left: 0, top: 85, right: 100, bottom: 100 },
                    { left: 0, top: 35, right: 50, bottom: 65 },
                    { left: 50, top: 55, right: 100, bottom: 85 },
                    { left: 0, top: 65, right: 50, bottom: 85 },
                    { left: 50, top: 35, right: 100, bottom: 55 }
                ]
            }
        ],
        [ // 7 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 50, bottom: 50 },
                    { left: 0, top: 50, right: 33, bottom: 100 },
                    { left: 33, top: 50, right: 67, bottom: 100 },
                    { left: 50, top: 0, right: 75, bottom: 50 },
                    { left: 75, top: 0, right: 100, bottom: 50 },
                    { left: 67, top: 50, right: 100, bottom: 75 },
                    { left: 67, top: 75, right: 100, bottom: 100 },
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 30 },
                    { left: 0, top: 30, right: 40, bottom: 80 },
                    { left: 0, top: 80, right: 100, bottom: 100 },
                    { left: 40, top: 30, right: 70, bottom: 60 },
                    { left: 70, top: 55, right: 100, bottom: 80 },
                    { left: 40, top: 60, right: 70, bottom: 80 },
                    { left: 70, top: 30, right: 100, bottom: 55 },
                ]
            }
        ],
        [ // 8 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 50, bottom: 40 },
                    { left: 0, top: 40, right: 33, bottom: 100 },
                    { left: 33, top: 40, right: 67, bottom: 70 },
                    { left: 33, top: 70, right: 67, bottom: 100 },
                    { left: 67, top: 40, right: 100, bottom: 70 },
                    { left: 67, top: 70, right: 100, bottom: 100 },
                    { left: 50, top: 0, right: 75, bottom: 40 },
                    { left: 75, top: 0, right: 100, bottom: 40 },
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 30 },
                    { left: 0, top: 30, right: 40, bottom: 70 },
                    { left: 40, top: 30, right: 100, bottom: 50 },
                    { left: 0, top: 70, right: 40, bottom: 100 },
                    { left: 40, top: 50, right: 75, bottom: 75 },
                    { left: 65, top: 75, right: 100, bottom: 100 },
                    { left: 75, top: 50, right: 100, bottom: 75 },
                    { left: 40, top: 75, right: 65, bottom: 100 },
                ]
            }
        ],
        [ // 9 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 50, bottom: 50 },
                    { left: 0, top: 50, right: 30, bottom: 100 },
                    { left: 50, top: 0, right: 100, bottom: 30 },
                    { left: 30, top: 50, right: 65, bottom: 75 },
                    { left: 30, top: 75, right: 65, bottom: 100 },
                    { left: 50, top: 30, right: 65, bottom: 50 },
                    { left: 65, top: 30, right: 100, bottom: 65 },
                    { left: 65, top: 65, right: 83, bottom: 100 },
                    { left: 83, top: 65, right: 100, bottom: 100 },
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 100, bottom: 30 },
                    { left: 0, top: 30, right: 50, bottom: 50 },
                    { left: 50, top: 30, right: 100, bottom: 50 },
                    { left: 0, top: 50, right: 35, bottom: 75 },
                    { left: 65, top: 50, right: 100, bottom: 75 },
                    { left: 35, top: 50, right: 65, bottom: 75 },
                    { left: 30, top: 75, right: 70, bottom: 100 },
                    { left: 0, top: 75, right: 30, bottom: 100 },
                    { left: 70, top: 75, right: 100, bottom: 100 },
                ]
            }
        ]
    ]

    // Helper function to get the config we should be using for this data set
    function getConfigToUse(): Config
    {
        if (imageCount > 0 && imageCount <= configs.length)
        {
            let config = configs[imageCount - 1].find(i => (isPortrait && (i.primaryAspect == "any" || i.primaryAspect == "portrait"))
                || (!isPortrait && (i.primaryAspect == "any" || i.primaryAspect == "landscape")));

            if (config != null)
            {
                return config;
            }
        }
        
        return {primaryAspect: "any", images: []};
    }
</script>

<!-- Bind innerWidth and innerHeight so we can pick layout based on aspect ratio -->
<svelte:window bind:innerWidth bind:innerHeight />

<!-- Collage content -->
<div class="overlay">
    <!-- Sanity check we can actually display the images -->
    {#if getConfigToUse().images.length > 0}
        {@const config = getConfigToUse()}

        <!-- Padding config - since image positioning is percent based, we need to scale the padding to be consistent -->
        {@const scaler = isPortrait ? innerWidth / innerHeight : innerHeight / innerWidth}
        {@const xScale = isPortrait ? 1 : scaler}
        {@const yScale = isPortrait ? scaler : 1}
        {@const paddingSize = 0.3}

        <!-- Layout images -->
        {#each imagesData as imageData, i}
            <!-- Work out bounds in percent-space -->
            {@const originalLeft = config.images[i].left}
            {@const originalTop = config.images[i].top}
            {@const originalRight = config.images[i].right}
            {@const originalBottom = config.images[i].bottom}
            {@const left = originalLeft + ((originalLeft == 0 || originalLeft == 100 ? 2 : 1) * paddingSize * xScale)}
            {@const top = originalTop + ((originalTop == 0 || originalTop == 100 ? 2 : 1) * paddingSize * yScale)}
            {@const right = originalRight - ((originalRight == 0 || originalRight == 100 ? 2 : 1) * paddingSize * xScale)}
            {@const bottom = originalBottom - ((originalBottom == 0 || originalBottom == 100 ? 2 : 1) * paddingSize * yScale)}
            {@const width = right - left}
            {@const height = bottom - top}

            <!-- Setup the image container with bounds - inline style since we have parameters -->
            <div class="image-button-container" style="position:absolute; left:{left}%; top:{top}%; width:{width}%; height:{height}%; min-width:{width}%; min-height:{height}%; overflow:hidden; display:flex; justify-content: center;">
                <!-- Images can be clicked to open the gallery, so wrap in a button -->
                <button class="image-button" onclick={() => showImageAtIndex = i}>
                    <img src={imageData.collageSrc} alt={imageData.collageSrc} />
                </button>
            </div>
        {/each}
    {:else if imageCount > 0}
        <!-- No valid config for this data but we have some images, so display the first fullscreen -->
        <div style="width:100%; height:100%; overflow:hidden; display:flex; justify-content: center;">
            <button class="image-button" onclick={() => showImageAtIndex = 0}>
                <img src={imagesData[0].collageSrc} alt={imagesData[0].collageSrc} />
            </button>
        </div>
    {/if}
</div>

<!-- Include our gallery so when an image is asked to be shown it'll overlay -->
<ImageGallery imagesData={imagesData} index={showImageAtIndex} onSelect={(i: number) => showImageAtIndex = i} onDismiss={() => showImageAtIndex = -1} />

<style>
    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #FFF;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        background-color: #777;
    }

    .image-button, .image-button-container {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
        position: relative;
    }

    .image-button {
        width: 100%;
        height: 100%;
    }
</style>