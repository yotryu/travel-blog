<script lang="ts">
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	
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

<div class={"nav-area " + (isExpanded ? "expanded" : "")}>
	<div class="nav-contents">
		<button class="collection-button" onclick={() => isExpanded = true}>{postNavData.collection.title}</button>
		{#if isExpanded}
			<div class="post-container">
			{#each postNavData.collectionPosts as post}
				<div class="post-div">
					<button class="post-button" data-sveltekit-reload >
						<img class="postbg" src={post.images[0].navSrc} alt={post.title} />
						<a class="posttitle" href={resolve(`/post/${post.id}`)}>{post.title}</a>
					</button>
				</div>
			{/each}
			</div>
		{/if}
	</div>
</div>

{#if isExpanded}
<div class="overlay" onclickcapture={() => isExpanded = false}></div>
{/if}

<style>
    @font-face {
        font-family: Fira-Regular;
        src: url(/FiraSans-Regular.ttf);
    }

	.nav-area {
		grid-area: nav;
        width: 220px;
		/* height: 20px; */
		position: absolute;
        top: 0;
        left: 0;
		/* bottom: 0; */
        color: beige;
		font-family: Fira-Regular;
        /* background-color:dimgrey; */
		transition: ease-out 200ms;
		/* overflow: hidden; */
		overflow: auto;
		z-index: 10;
	}

	.nav-contents {
		position: relative;
		padding: 1em;
	}

	.collection-button {
        font-size: smaller;
		width: 100%;
		text-align: left;
        margin-bottom: 0.5em;
		margin-right: 1em;
		padding: 4px;
		cursor: pointer;
		color: beige;
		text-shadow: 0 0 4px #000;
		border-radius: 4px;
		border: none;
		background-color: #0004;
    }

    .post-container {
		padding-top: 6px;
    }

    .postbg {
        width: 100%;
		height: 100%;
		border-radius: 6px;
        object-fit: cover;
        filter: brightness(0.65);
    }

    .posttitle {
        position: absolute;
        color: beige;
		padding-top: 10px;
		padding-left: 10px;
		font-family: Fira-Regular;
		text-decoration: none;
    }

	.expanded {
		transition: ease-out 200ms;
        height: 100%;
		background-color:#111C;
	}

	.post-div {
		padding: 4px 0px;
	}

	.post-button {
		border: none;
		border-radius: 4px;
		padding-block: 0;
		padding-inline: 0;
		background: none;
		width:100%;
        height:50px;
        overflow:hidden;
        display:flex;
		/* margin: auto; */
		/* text-align: center; */
        /* justify-content: left; */
        /* vertical-align: middle; */
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