<script lang="ts">
    import ImageCollage from "$lib/image-collage.svelte";
	import { loadScript } from "$lib/loadScript";
    import { onMount } from "svelte";
    import type { ChangeEventHandler } from "svelte/elements";
    import { fade, fly } from "svelte/transition";
    import type { PageProps } from "./$types";

    interface ImageRef
    {
        data: string;
        name: string;
    }

    interface ImageData
    {
        src: string;
        collageSrc: string;
        navSrc: string;
    }

    interface PostData
    {
        id: string;
        collection: string;
        date: string;
        title: string;
        content: string;
        contentParagraphs: string[]; // generated
        images: ImageData[];
    }

    const editImagesFlyData = {
        duration: 200,
        x: -100,
        opacity: 0
	}
	
	const fadeOut = {
		delay: 0,
		duration: 100
	}

    let { data }: PageProps = $props();

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

    let isEditingImages = $state(false);

    let tokenClient: any;
    let status = $state(1);
    let uploading = $state(false);
    let isEditingContent = $state(false);

    let _images: ImageRef[] = [];
    let images = $state(_images);

    let _postData: PostData = {
        id: "",
        collection: "",
        date: "",
        title: "",
        content: "",
        contentParagraphs: [],
        images: []
    };
    let postData = $state(_postData);


    function loadImage(event)
    {
        let newImages = [...images];
        for (let i = 0; i < event.target.files.length; ++i)
        {
            let f = event.target.files[i];
            const reader = new FileReader();
            reader.onload = function() {
                //uploadTestFile(new Uint8Array(reader.result));
                //images.push(reader.result);
                if (reader.result)
                {
                    const newData = {data: reader.result.toString(), name: f.name};
                    newImages.push(newData);
                    images = newImages;
                    // TODO: resize images here
                    postData.images.push({src: newData.data, collageSrc: newData.data, navSrc: ""});
                }
            }
            //reader.readAsArrayBuffer(event.target.files[0]);
            reader.readAsDataURL(f);
        }
    }

    function removeImage(image: ImageData)
    {
        postData.images = postData.images.filter(i => i != image);
    }

    function moveImageIndex(image: ImageData, change: number)
    {
        let currentIndex = postData.images.findIndex(i => i == image);
        if (currentIndex < 0)
        {
            return;
        }
        
        let to = currentIndex + change;
        if (to >= postData.images.length)
        {
            return;
        }
        
        postData.images.splice(to, 0, postData.images.splice(currentIndex, 1)[0]);
    }

    function setContent(contentText: string)
    {
        postData.content = contentText;
        postData.contentParagraphs = contentText.split("\n");
    }

    async function convertDataURLToBuffer(input: string)
    {
        const blob = await fetch(input).then(r => r.blob());
        const buffer = await blob.arrayBuffer();

        return new Uint8Array(buffer);
    }

    async function downsizeImage(imageBase64: string, width: number)
    {
        return new Uint8Array();
        // const blob = await fetch(imageBase64).then(r => r.blob());
        // const buffer = await blob.arrayBuffer();

        // const image = await ImageJS.load(buffer);

        // const resizedImage = image.resize({ width: width });

        // const imgBuffer = resizedImage.toBuffer();

        // return new Uint8Array(imgBuffer);
    }

    async function uploadImages()
    {
        uploading = true;

        let imagesToUpload = [...images];
        for (let i = 0; i < imagesToUpload.length; ++i)
        {
            await generateImagesAndUpload(imagesToUpload[i]);
        }

        uploading = false;
    }

    async function generateImagesAndUpload(image: ImageRef)
    {
        const widths = [1000, 200];

        console.log("processing: " + image.name);

        let lastSepIndex = image.name.lastIndexOf("/");
        let name = image.name.substring(lastSepIndex + 1);
        let nameComponents = name.split('.');
        let basePath = image.name.substring(0, lastSepIndex) + "/" + nameComponents[0];

        // original
        let buffer = await convertDataURLToBuffer(image.data);
        await uploadFile(image.name, buffer);

        // generate small images and upload
        for (let i = 0; i < widths.length; ++i)
        {
            const w = widths[i];
            buffer = await downsizeImage(image.data, w);
            let newPath = basePath + "_w" + w + "." + nameComponents[1];

            await uploadFile(newPath, buffer);
        }
    }

    async function uploadFile(name: string, buffer: Uint8Array<ArrayBuffer>)
    {
        let metadata = {
            "name": name
        };
        let dataStr = JSON.stringify(metadata);

        let response = await gapi.client.request({
          'path': '/upload/drive/v3/files?uploadType=resumable',
          'method': 'POST',
          'body': dataStr,
          'headers': {
            'content-type': "application/json",
            'content-length': dataStr.length,
            'x-upload-content-length': buffer.byteLength
          }
        });
        
        if (!response || !response.headers)
        {
            return false;
        }
        
        let uploadURL = response.headers["location"];
        let putResult = await fetch(uploadURL, {
            'method': 'PUT',
            'body': buffer,
            'headers': {
                'content-length': buffer.byteLength.toString()
            }
        });

        return !!putResult;
    }

    async function initializeGapiClient()
    {
        await gapi.client.init({
            apiKey: "AIzaSyBD1i5924f_4Lz3vfjL5msxRvI3K31zRgk"
        });

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: "953825518423-opf6ljfsqvslodfru7ugocm5ps5rgacp.apps.googleusercontent.com",
            scope: "https://www.googleapis.com/auth/drive.file",
            callback: async (resp) => {
                if (resp.error !== undefined) {
                    status = -1;
                    throw(resp);
                }

                status = 0;
                sessionStorage.setItem("gtoken", gapi.client.getToken().access_token);
            }
        });

        status = 2;

        // let tokenString = sessionStorage.getItem("gtoken");
        // if (tokenString)
        // {
        //     gapi.client.setToken({access_token: tokenString});
        //     status = 0;
        // }
    };

    function doLogin()
    {
        if (gapi.client.getToken() === null)
        {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            tokenClient.requestAccessToken({prompt: 'consent'});
        }
        else
        {
            // Skip display of account chooser and consent dialog for an existing session.
            tokenClient.requestAccessToken({prompt: ''});
        }
    };

    onMount(async () => {
        await loadScript("https://apis.google.com/js/api.js");
        await loadScript("https://accounts.google.com/gsi/client");

        gapi.load('client', initializeGapiClient);
    });
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if status == 0}
{:else if status == 1}
<p>Loading...</p>
{:else if status == 2}
<p>Ready</p>
<button onclick={() => doLogin()}>Login</button>
{:else if status == 3}
<p>Attempting login...</p>
{:else if status == -1}
<p>Failed to login</p>
{/if}

<ImageCollage imagesData={postData.images}/>

<div class="header">
    <input class="collection-input" list="exampleList" placeholder="Collection" onchange={(e) => postData.collection = e.target.value}/>
    <datalist id="exampleList">
        {#each data.collections as collection}
            <option value={collection.id}></option>
        {/each}
    </datalist>
    <div>
        <input class="title-input" placeholder="Title" onchangecapture={(e) => postData.title = e.target.value}/>
    </div>
    <div>
        <input class="small-input" placeholder="Date" onchangecapture={(e) => postData.date = e.target.value}/>
    </div>
    <div>
        <button class="add-button" onclick={() => isEditingImages = true}>Edit Images...</button>
    </div>
</div>

{#if isExpanded}
<div class="overlay" >
    <div class="overlay" onclickcapture={() => isExpanded = false}>
    </div>
    <div transition:fly="{flyData}" class="{containerClass} {expandedClass}">
        <textarea class="content-input" id="contentTextArea" placeholder="Add post content..." 
            onchangecapture={(e) => {
                isEditingContent = e.target == document.activeElement;
                setContent(e.target.value);
            }}>{postData.content}</textarea>
        <div class="content-bottom">
            <button class="add-button">Upload All</button>
        </div>
    </div>
</div>
{:else}
<div transition:fly="{flyData}" class="{edgeClass}" onclick={() => isExpanded = true}>{expandArrow}</div>
{/if}

<!-- Image editing popout -->
{#if isEditingImages}
<div class="overlay" onclickcapture={() => isEditingImages = false}></div>
<div class="image-edit-popout" transition:fly="{editImagesFlyData}">
    <div class="small-margins">
        <button class="add-button fill-width" onclick={() => document.getElementById('chooseImages').click()}>Add Images...</button>
        <input id="chooseImages" type="file" accept="image/*" multiple onchange={(evt) => loadImage(evt)} style="display:none;"/>
    </div>
    <div class="small-margins bottom-line"></div>
    <div class="small-margins">
    {#each postData.images as image}
        <div class="image-preview-container">
            <img class="image-preview" src={image.src} alt={image.src}/>
            <div class="overlay">
                <div class="right-align">
                    <div>
                        <button class="image-preview-button" onclick={() => moveImageIndex(image, -1)}>↑</button>
                    </div>
                    <div class="bottom-right">
                        <button class="image-preview-button" onclick={() => moveImageIndex(image, 1)}>↓</button>
                    </div>
                </div>
                <div class="left-align">
                    <button class="image-preview-button red-button" onclick={() => removeImage(image)}>-</button>
                </div>
            </div>
        </div>
        <div class="small-margins"></div>
    {/each}
    </div>
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
    }

    .overlay {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        color: beige;
    }

    .overlay-bottom {
        width: 100%;
        height: 50%;
        position: absolute;
        top: 50%;
        left: 0;
    }

    .left-align {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
    }

    .right-align {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
    }

    .bottom-right {
        position: absolute;
        right: 0;
        bottom: 0;
    }

    .image-edit-popout {
        width: 220px;
		/* height: 20px; */
		position: absolute;
        top: 0;
        left: 0;
		bottom: 0;
        color: beige;
		font-family: Fira-Regular;
        /* background-color:dimgrey; */
		transition: ease-out 200ms;
		/* overflow: hidden; */
		overflow: auto;
		z-index: 10;
        background-color: #111E;
	}

    .expanded {
		transition: ease-out 200ms;
        height: 100%;
		background-color:#111C;
	}

    .collection-input {
        font-size: smaller;
        margin-bottom: 0.5em;
		margin-right: 1em;
		padding: 4px;
		text-shadow: 0 0 4px #000;
		border-radius: 4px;
        border: none;
        color: beige;
		background-color: #0004;
    }

    .collection-input::placeholder {
        text-shadow: none;
        color: beige;
    }

    .small, .small-input {
        font-size: smaller;
        margin-bottom: 0.5em;
        font-family: Fira-Regular;
        margin-top: 0;
        color: beige;
        text-shadow: 0 0 4px #000;
    }

    .small-input {
        border: none;
        background-color: transparent;
    }

    .small-input::placeholder {
        text-shadow: none;
    }

    .header {
        position: absolute;
        top: 0;
        left: 0;
        color: beige;
        margin-left: 1em;
        margin-top: 1em;
    }

    .title, .title-input {
        margin-top: 0;
        margin-bottom: 0;
        font-family: Fira-Regular;
        color: beige;
        text-shadow: 0 2px 6px #000;
    }

    .title-input {
        font-size: xx-large;
        border: none;
        background-color: transparent;
    }

    .title-input::placeholder {
        text-shadow: none;
    }

    .grow-wrap {
        width: 100%;
        height: calc(100% - 3em);
        top: 0;
        left: 0;
        position: relative;
    }

    .content-input {
        resize: none;
        font-family: Fira-ExtraLight;
        font-size: medium;
        color: beige;
        border: none;
        background:transparent;
        position: absolute;
        display: block;
        top: 1em;
        bottom: 3em;
        left: 1em;
        right: 1em;
    }

    .content-bottom {
        position: absolute;
        left: 1em;
        right: 1em;
        bottom: 1em;
    }

    .content-container,
    .content-container-portrait,
    .edge-container,
    .edge-container-portrait {
        position: absolute;
        bottom: 0;
        top: 0;
        padding: 0em 2em;
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
        /* position: relative; */
        /* bottom: 100px; */
        /* top: 0; */
        /* bottom: 3em; */
        padding-right: 1em;
        border-bottom: 1px solid beige;
    }

    .left-align {
        text-align: left;
    }

    .right-align {
        text-align: right;
        width: 100%;
    }

    .overlay-blocker {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        color: beige;
        background-color: #0002;
    }

    .preview-image-container {
        width: 200px;
        height: 200px;
        position: relative;
        display: inline-block;
    }

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .add-button, .image-preview-button {
        background-color: #444A;
        font-family: Fira-Regular;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        color: beige;
    }

    .add-button:hover, .image-preview-button:hover {
        background-color: #666A;
    }

    .add-button:active, .image-preview-button:active {
        background-color: #444A;
    }

    .fill-width {
        width: 100%;
    }

    .small-margins {
        margin: 1em;
    }

    .bottom-line {
        border-bottom: 1px solid beige;
    }

    .image-preview-container {
		border: none;
		border-radius: 4px;
		background: none;
		width: 100%;
        height: 100px;
        overflow: hidden;
        display: flex;
		margin: auto;
		text-align: center;
        justify-content: left;
        vertical-align: middle;
        position: relative;
	}

    .image-preview {
        width: 100%;
		height: 100%;
		border-radius: 6px;
        object-fit: cover;
        filter: brightness(0.65);
    }

    .image-preview-button {
        font-size: large;
        width: 32px;
    }

    .red-button {
        background-color: #C23A;
    }

    .red-button:hover {
        background-color: #E45A;
    }
    
    .red-button:active {
        background-color: #C23A;
    }
</style>