<script lang="ts">
    import { goto, invalidateAll } from '$app/navigation';
    import { fade } from 'svelte/transition';
	
	const fadeIn = {
		delay: 100,
		duration: 200
	}
	
	const fadeOut = {
		delay: 0,
		duration: 100
	}

	let isExpanded = $state(false);

	function navToPage(url: string)
	{
		goto(url);
		isExpanded = false;
	}
	
    let { postNavData } = $props();
</script>

<nav class:expanded={isExpanded}>
	<p class="small" onclick={() => isExpanded = !isExpanded}>{postNavData.post.collection}</p>
	{#if isExpanded}
	<section in:fade="{fadeIn}" out:fade="{fadeOut}" >
        <div class="post-container">
		{#each postNavData.collectionPosts as post}
			<div class="post-div">
				<button class="post-button" onclick={() => navToPage(`/blog/post/${post.id}`)}>
					<img class="postbg" src={post.images[0].navSrc} alt={post.title} />
					<p class="posttitle">{post.title}</p>
				</button>
			</div>
        {/each}
        </div>
	</section>
	{/if}
</nav>

{#if isExpanded}
<div class="overlay" onclickcapture={() => isExpanded = false}></div>
{/if}

<style>
    @font-face {
        font-family: Fira-Regular;
        src: url(/FiraSans-Regular.ttf);
    }

	nav {
		grid-area: nav;
        width: 200px;
		/* height: 20px; */
		position: absolute;
        top: 0;
        left: 0;
        color: beige;
		font-family: Fira-Regular;
        /* background-color:dimgrey; */
		transition: ease-out 200ms;
		overflow: hidden;
		z-index: 10;
	}

	.small {
        font-size: smaller;
        margin-bottom: 0.5em;
		margin-left: 1.3em;
		cursor: pointer;
		text-shadow: 0 0 4px #000;
    }

    .post-container {
        padding: 2px 2px;
    }

    .postbg {
        width: 100%;
        object-fit: cover;
        display: flex;
        overflow: hidden;
        filter: brightness(0.5);
    }

    .posttitle {
        position: absolute;
        color: beige;
		padding-top: 2px;
		padding-left: 1em;
		font-family: Fira-Regular;
    }

	.expanded {
		transition: ease-out 200ms;
        height: 100%;
		background-color:#111C;
	}

	.post-div {
		padding: 4px;
	}

	.post-button {
		border: none;
		background: none;
		width:100%;
        height:50px;
        overflow:hidden;
        display:flex;
        justify-content: left;
        vertical-align: middle;
		cursor: pointer;
	}

	.overlay {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        color: beige;
    }
</style>