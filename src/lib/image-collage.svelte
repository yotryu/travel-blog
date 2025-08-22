<script lang="ts">
	let { imagesData } = $props();
    let imageCount = $derived(imagesData.length);

    let innerWidth = $state(0);
    let innerHeight = $state(0);
    let isPortrait = $derived(innerWidth <= innerHeight);

    interface Rect {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }

    interface Config {
        primaryAspect: "landscape" | "portrait" | "any";
        images: Rect[];
    }

    // all configs are built in landscape orientation and portrait switches left/top and right/bottom
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
                primaryAspect: "any",
                images: [
                    { left: 0, top: 0, right: 50, bottom: 100 }, // 0, 0, 100, 50
                    { left: 50, top: 0, right: 100, bottom: 100 }, // 0, 50, 100, 100
                ]
            }
        ],
        [ // 3 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 60, bottom: 100 }, // 0, 0, 100, 60
                    { left: 60, top: 0, right: 100, bottom: 50 }, // 0, 60, 50, 100
                    { left: 60, top: 50, right: 100, bottom: 100 } // 50, 60, 100, 100
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 40, bottom: 100 }, // 0, 0, 100, 40
                    { left: 40, top: 0, right: 100, bottom: 50 }, // 0, 40, 50, 100
                    { left: 40, top: 50, right: 100, bottom: 100 } // 50, 40, 100, 100
                ]
            }
        ],
        [ // 4 images
            {
                primaryAspect: "landscape",
                images: [
                    { left: 0, top: 0, right: 60, bottom: 60 }, // 0, 0, 60, 60
                    { left: 60, top: 0, right: 100, bottom: 50 }, // 0, 60, 50, 100
                    { left: 60, top: 50, right: 100, bottom: 100 }, // 50, 60, 100, 100
                    { left: 0, top: 60, right: 60, bottom: 100 } // 60, 0, 100, 60
                ]
            },
            {
                primaryAspect: "portrait",
                images: [
                    { left: 0, top: 0, right: 40, bottom: 100 }, // 0, 0, 100, 40
                    { left: 40, top: 0, right: 100, bottom: 33 }, // 0, 40, 33, 100
                    { left: 40, top: 33, right: 100, bottom: 67 }, // 33, 40, 67, 100
                    { left: 40, top: 67, right: 100, bottom: 100 } // 67, 40, 100, 100
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
            }
        ]
    ]

    function getConfigToUse(): Config
    {
        if (imageCount <= configs.length)
        {
            return configs[imageCount - 1][0];
        }
        
        return {primaryAspect: "any", images: []};
    }
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="full-height">
    {#if getConfigToUse().images.length > 0}
        {@const config = getConfigToUse()}
        {#each imagesData as imageData, i}
            {@const left = isPortrait ? config.images[i].top : config.images[i].left}
            {@const top = isPortrait ? config.images[i].left : config.images[i].top}
            {@const right = isPortrait ? config.images[i].bottom : config.images[i].right}
            {@const bottom = isPortrait ? config.images[i].right : config.images[i].bottom}
            {@const width = right - left}
            {@const height = bottom - top}
            <button class="image-button" onclick={() => open(imageData.src)} style="position:absolute; left:{left}%; top:{top}%; width:{width}%; height:{height}%; overflow:hidden; display:flex; justify-content: center;">
                <img src={imageData.collageSrc} alt={imageData.collageSrc} />
            </button>
        {/each}
    {:else if imageCount > 0}
        <div style="width:100%; height:100%; overflow:hidden; display:flex; justify-content: center;">
            <button class="image-button" onclick={() => open(imagesData[0].src)}>
                <img src={imagesData[0].collageSrc} alt={imagesData[0].collageSrc} />
            </button>
        </div>
    {/if}
</div>

<style>
    :global(html), :global(body), .full-height {
        height: 100%;
        margin: 0;
    }

    .full-height {
        display: flex;
        flex-flow: column;
        height: 100%;
    }

    img {
        width: 100%;
        object-fit: cover;
        /* filter: brightness(0.5); */
    }

    .image-button {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
    }
</style>