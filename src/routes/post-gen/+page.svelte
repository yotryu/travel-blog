<script lang="ts">
    import ImageCollage from "$lib/image-collage.svelte";
	import { loadScript } from "$lib/loadScript";
    import { onMount } from "svelte";
    import type { ChangeEventHandler } from "svelte/elements";
    import { fade, fly } from "svelte/transition";
    import type { PageProps } from "./$types";

    interface ImageRef
    {
        data: ImageData;
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
        contentParagraphs: string[] | undefined; // generated
        images: ImageRef[];
    }

    interface SavablePostData
    {
        id: string;
        collection: string;
        date: string;
        title: string;
        content: string;
        contentParagraphs: undefined;
        images: ImageData[];
    }

    const editImagesFlyData = {
        duration: 200,
        x: -100,
        opacity: 0
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
    let authKey = $state("");
    let loaded = $state(false);
    let authenticated = $state(false);
    let uploading = $state(false);
    let uploadCanceled = $state(false);
    let uploadProgress = $state("");
    let isEditingContent = $state(false);
    let isGettingPostId = $state(false);

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


    function loadImage(event: Event)
    {
        let target = (<HTMLInputElement>event.target);
        if (!target || !target.files)
        {
            return;
        }

        for (let i = 0; i < target.files.length; ++i)
        {
            let f = target.files[i];
            const reader = new FileReader();
            reader.onload = function() {
                //uploadTestFile(new Uint8Array(reader.result));
                //images.push(reader.result);
                if (reader.result)
                {
                    const newData = {data: reader.result.toString(), name: f.name};
                    const imageRef: ImageRef = {
                        name: f.name,
                        data: {
                            src: newData.data,
                            collageSrc: "",
                            navSrc: ""
                        }
                    }
                    // TODO: resize images here
                    postData.images.push(imageRef);
                    generateImages(imageRef);
                }
            }
            //reader.readAsArrayBuffer(event.target.files[0]);
            reader.readAsDataURL(f);
        }
    }

    function removeImage(image: ImageRef)
    {
        postData.images = postData.images.filter(i => i != image);
    }

    function moveImageIndex(image: ImageRef, change: number)
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

    function proxyClick(id: string)
    {
        let element = document.getElementById(id);
        if (!element)
        {
            return;
        }
        
        element.click();
    }

    function getInputText(element: Event)
    {
        let target = (<HTMLInputElement>element.target);
        if (!target)
        {
            return "";
        }

        return target.value;
    }

    function setContent(contentText: string)
    {
        postData.content = contentText;
        postData.contentParagraphs = contentText.split("\n");
    }

    function clearPostData()
    {
        postData = _postData;
        
        let title = <HTMLInputElement>document.getElementById("inputTitle");
        title.value = "";

        let date = <HTMLInputElement>document.getElementById("inputDate");
        date.value = "";

        let collection = <HTMLInputElement>document.getElementById("inputCollection");
        collection.value = "";

        let content = <HTMLTextAreaElement>document.getElementById("contentTextArea");
        content.value = "";
    }

    async function convertDataURLToBuffer(input: string)
    {
        const blob = await fetch(input).then(r => r.blob());
        const buffer = await blob.arrayBuffer();

        return new Uint8Array(buffer);
    }

    async function downsizeImage(img: HTMLImageElement, width: number)
    {
        // Create a canvas
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        if (!ctx)
        {
            return null;
        }

        // Calculate the new image dimensions
        const maxHeight = width / (img.width / img.height);
        let ratio = Math.min(width / img.width, maxHeight / img.height);
        let newWidth = img.width * ratio;
        let newHeight = img.height * ratio;

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert the canvas to a data URL
        return canvas.toDataURL('image/jpeg');
    }

    function setPostCollection(collection: string, requestPostId: boolean)
    {
        postData.collection = collection;

        if (requestPostId)
        {
            getNextPostId();
        }
    }

    async function requestFolderId(path: string, create: boolean = false)
    {
        let paths = path.split('/');
        let parent = 'root';

        for (let i = 0; i < paths.length; ++i)
        {
            let current = paths[i];
            let query = `'${parent}' in parents and name = '${current}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
            let response = await gapi.client.request({
                'path': `/drive/v3/files?q=${encodeURI(query)}`,
                'method': 'GET'
            });
            
            if (!response)
            {
                return null;
            }

            let resData = JSON.parse(response.body);
            
            if (!resData.files || resData.files.length == 0)
            {
                // no folder at this path - create if we've been asked to
                if (create)
                {
                    let metadata = {
                        "name": current,
                        "parents": [ parent ],
                        "mimeType": 'application/vnd.google-apps.folder'
                    };
                    let dataStr = JSON.stringify(metadata);

                    let response = await gapi.client.request({
                        'path': '/drive/v3/files',
                        'method': 'POST',
                        'body': dataStr,
                        'headers': {
                            'content-type': "application/json",
                            'content-length': dataStr.length
                        }
                    });

                    if (!response)
                    {
                        return null;
                    }

                    // try again
                    --i;
                    continue;
                }

                return null;
            }

            parent = resData.files[0].id;
        }

        return parent;
    }

    async function requestNextPostId()
    {
        let path = `BlogData/Posts/${postData.collection}`;
        let defaultValue = `${postData.collection}-01`;

        let parent = await requestFolderId(path);
        if (!parent)
        {
            return defaultValue;
        }

        // parent will be the id of the final folder in the path, now query for files in this folder
        let query = `'${parent}' in parents and mimeType != 'application/vnd.google-apps.folder'`;
        let response = await gapi.client.request({
            'path': `/drive/v3/files`,
            'params': {
                'q': query
            },
            'method': 'GET'
        });

        if (!response)
        {
            return defaultValue;
        }

        // we should have a file list containing all files in this folder - find the "last"
        let resData = JSON.parse(response.body);

        if (!resData.files || resData.files.length == 0)
        {
            return defaultValue;
        }

        resData.files.sort((a: any, b: any) => {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });

        let lastFile = resData.files[resData.files.length - 1];
        let pieces = lastFile.name.split('.');
        let lastNonExtPiece = pieces[pieces.length - 2];
        
        let lastGroupOfNumbers = lastNonExtPiece.match(/(?:\d+)(?!.*\d)/);
        let num = lastGroupOfNumbers ? lastGroupOfNumbers[0] : null;

        if (!num)
        {
            return defaultValue;
        }

        return `${postData.collection}-${String(Number(num) + 1).padStart(2, '0')}`;
    }

    async function requestFileId(path: string)
    {
        let parts = path.split('/');
        let folderPath = parts.slice(0, -1).join('/');
        let filename = parts[parts.length - 1];

        let parentId = await requestFolderId(folderPath);
        if (!parentId)
        {
            return null;
        }

        let query = `'${parentId}' in parents and name = '${filename}'`;
        let response = await gapi.client.request({
            'path': `/drive/v3/files`,
            'params': {
                'q': query
            },
            'method': 'GET'
        });

        if (!response)
        {
            return null;
        }

        let resData = JSON.parse(response.body);

        if (!resData.files || resData.files.length == 0)
        {
            return null;
        }

        return resData.files[0].id;
    }

    async function getNextPostId()
    {
        isGettingPostId = true;

        let postId = await requestNextPostId();
        postData.id = postId;

        isGettingPostId = false;
    }

    async function uploadAll()
    {
        uploadCanceled = false;
        uploading = true;
        uploadProgress = "";

        let success = true;
        let dataCopy: SavablePostData = JSON.parse(JSON.stringify(postData));
        dataCopy.images = new Array(postData.images.length);
        dataCopy.contentParagraphs = undefined;

        let folderPath = `BlogData/Photos/${dataCopy.collection}`;
        let folderId = await requestFolderId(folderPath);

        for (let i = 0; i < postData.images.length; ++i)
        {
            if (uploadCanceled)
            {
                break;
            }

            let image = postData.images[i];
            uploadProgress += `Uploading images for '${image.name}'... `;

            let imageData = await uploadImages(image, folderId);
            success = !!imageData;
            uploadProgress += (success ? "Success" : "Failed") + "<br>";

            if (!success || !imageData)
            {
                break;
            }

            dataCopy.images[i] = imageData;
        }

        folderPath = `BlogData/Posts/${dataCopy.collection}`;
        let jsonPath = `${folderPath}/${dataCopy.id}.json`;
        if (success && !uploadCanceled)
        {
            let json = JSON.stringify(dataCopy);
            let encoder = new TextEncoder();

            uploadProgress += `Uploading '${jsonPath}'... `;

            let success = await uploadFile(jsonPath, null, encoder.encode(json));
            uploadProgress += success ? "Success" : "Failed";
        }

        if (uploadCanceled)
        {
            uploadProgress += "Cancelled";
        }

        uploading = false;
    }

    async function uploadImages(image: ImageRef, folderId: string | null)
    {
        let imageData: ImageData = { src: "", collageSrc: "", navSrc: "" };
        let nameComponents = image.name.split('.');
        let basePath = nameComponents[0];
        let folderPath = `BlogData/Photos/${postData.collection}`;

        if (!folderId)
        {
            folderId = await requestFolderId(folderPath, true);
        }

        // original
        let buffer = await convertDataURLToBuffer(image.data.src);
        let path = `${folderPath}/${image.name}`;
        let fileId = await uploadFile(path, folderId, buffer);

        if (fileId)
        {
            imageData.src = `https://lh3.googleusercontent.com/d/${fileId}?authuser=0`;
        }
        else
        {
            return null;
        }

        // collageSrc
        let newPath = basePath + "_w1000" + "." + nameComponents[1];
        path = `BlogData/Photos/${postData.collection}/${newPath}`;
        buffer = await convertDataURLToBuffer(image.data.collageSrc);
        fileId = await uploadFile(path, folderId, buffer);

        if (fileId)
        {
            imageData.collageSrc = `https://lh3.googleusercontent.com/d/${fileId}?authuser=0`;
        }
        else
        {
            return null;
        }

        // navSrc
        newPath = basePath + "_w200" + "." + nameComponents[1];
        path = `BlogData/Photos/${postData.collection}/${newPath}`;
        buffer = await convertDataURLToBuffer(image.data.navSrc);
        fileId = await uploadFile(path, folderId, buffer);

        if (fileId)
        {
            imageData.navSrc = `https://lh3.googleusercontent.com/d/${fileId}?authuser=0`;
        }
        else
        {
            return null;
        }

        return imageData;
    }

    async function generateImages(image: ImageRef)
    {
        const widths = {
            collageSrc: 1000,
            navSrc: 200
        };

        let img = new Image();
        let prom = new Promise((resolve, reject) => {
            img.onload = () =>
            {
                resolve(img);
            };
            img.onerror = () =>
            {
                reject();
            };
        });
        img.src = image.data.src;

        await prom;

        let buffer = await downsizeImage(img, widths.collageSrc);
        let im = postData.images.find(i => i.name == image.name);
        if (buffer && im)
        {
            im.data.collageSrc = buffer;
        }
        
        buffer = await downsizeImage(img, widths.navSrc);
        if (buffer && im)
        {
            im.data.navSrc = buffer;
        }
    }

    async function uploadFile(path: string, folderId: string | null, buffer: Uint8Array<ArrayBuffer>)
    {
        let existingFileId = await requestFileId(path);
        if (existingFileId)
        {
            // already have a file ID for this path, so do nothing
            return existingFileId;
        }

        let comps = path.split('/');
        let name = comps[comps.length - 1];

        if (!folderId)
        {
            let folderPath = comps.slice(0, -1).join('/');
            folderId = await requestFolderId(folderPath, true);
        }

        let metadata = {
            "name": name,
            "parents": [ folderId ]
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
            return null;
        }

        // this copy of the data silences typescript errors since the API says the headers object is an array...
        let headers = JSON.parse(JSON.stringify(response.headers));
        let uploadURL = headers["location"];

        try
        {
            // this will fail in localhost because of CORS, so for now catch the error and move on
            // - the request to get the file ID below will kind of validate this anyway... kind of
            await fetch(uploadURL, {
                'method': 'PUT',
                'body': buffer,
                'headers': {
                    'content-length': buffer.byteLength.toString()
                }
            });
        }
        catch {}

        existingFileId = await requestFileId(path);

        return existingFileId;
    }

    async function initializeGapiClient()
    {
        await gapi.client.init({
            apiKey: authKey
        });

        // google is loaded dynamically and attempts to include the client library resulted in failures,
        // so disabling the error for now as it is an offline only issue.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: "953825518423-opf6ljfsqvslodfru7ugocm5ps5rgacp.apps.googleusercontent.com",
            scope: "https://www.googleapis.com/auth/drive.file",
            callback: async (resp: any) => {
                if (resp.error !== undefined) {
                    alert(`Failed to authenticate: ${resp}`);
                    throw(resp);
                }

                authenticated = true;
            }
        });

        loaded = true;
    };

    function initWithAuthKeyFile(event: Event)
    {
        let target = <HTMLInputElement>event.target;
        if (!target || !target.files || target.files.length == 0)
        {
            return;
        }

        let file = target.files[0];
        const reader = new FileReader();
        reader.onload = function() {
            if (reader.result)
            {
                authKey = reader.result.toString();
                localStorage.setItem("apiKey", authKey);
                gapi.load('client', initializeGapiClient);
            }
        }
        reader.readAsText(file);
    }

    function removeAPIKey()
    {
        localStorage.removeItem("apiKey");
        authKey = "";
    }

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

        let key = localStorage.getItem("apiKey");
        if (key)
        {
            authKey = key;
            gapi.load('client', initializeGapiClient);
        }
    });
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if authenticated}

    <ImageCollage imagesData={postData.images.map(i => i.data)}/>

    <div class="header">
        <input class="collection-input" id="inputCollection" list="collectionList" placeholder="Collection" 
            onchangecapture={(e) => e.target != document.activeElement ? setPostCollection(getInputText(e), true) : {}}
            oninput={(e: any) => !e.inputType || e.inputType == "insertReplacementText" ? setPostCollection(getInputText(e), true) : {}}/>
        <datalist id="collectionList">
            {#each data.collections as collection}
                <option value={collection.id}></option>
            {/each}
        </datalist>
        {#if isGettingPostId}
            <span class="post-id">-- Getting post ID --</span>
        {:else}
            <span class="post-id">{postData.id}</span>
        {/if}
        <div>
            <input class="title-input" id="inputTitle" placeholder="Title" size="35" onchangecapture={(e) => postData.title = getInputText(e)}/>
        </div>
        <div>
            <input class="small-input" id="inputDate" placeholder="Date" onchangecapture={(e) => postData.date = getInputText(e)}/>
        </div>
        <div>
            <button class="add-button" onclick={() => isEditingImages = true}>Edit Images...</button>
        </div>
        <div class="small-vertical-padding">
            <button class="add-button red-button" onclick={() => clearPostData()}>Clear Post Data</button>
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
                    setContent(getInputText(e));
                }}>{postData.content}</textarea>
            <div class="content-bottom">
                <button class="add-button" onclick={() => uploadAll()}>Upload All</button>
            </div>
        </div>
    </div>
    {:else}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div transition:fly="{flyData}" class="{edgeClass}" onclick={() => isExpanded = true}>{expandArrow}</div>
    {/if}

    <!-- Image editing popout -->
    {#if isEditingImages}
    <div class="overlay" onclickcapture={() => isEditingImages = false}></div>
    <div class="image-edit-popout" transition:fly="{editImagesFlyData}">
        <div class="small-margins">
            <button class="add-button fill-width" onclick={() => proxyClick("chooseImages")}>Add Images...</button>
            <input id="chooseImages" type="file" accept="image/*" multiple onchange={(evt) => loadImage(evt)} style="display:none;"/>
        </div>
        <div class="small-margins bottom-line"></div>
        <div class="small-margins">
        {#each postData.images as image}
            <div class="image-preview-container">
                <img class="image-preview" src={image.data.navSrc} alt={image.name}/>
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

    <!-- Uploading -->
    {#if uploading || uploadProgress}
    <div class="overlay-darken center-parent">
        <div class="center-login">
            <h3>Uploading...</h3>
            {@html uploadProgress}
            <div class="small-padding">
                {#if uploading}
                    {#if uploadCanceled}
                        <p>Cancelling...</p>
                    {:else}
                        <button class="add-button red-button" onclick={() => uploadCanceled = true }>Cancel</button>
                    {/if}
                {:else}
                    <button class="add-button" onclick={() => { uploading = false; uploadProgress = ""; }}>Done</button>
                {/if}
            </div>
        </div>
    </div>
    {/if}

{:else}
    <!-- Not authenticated yet -->
    <div class="overlay-darken center-parent">
        <div class="center-login">
            {#if !authKey}
                <button class="add-button" onclick={() => proxyClick("chooseAuthKeyFile")}>Load API Key</button>
                <input id="chooseAuthKeyFile" type="file" accept=".txt" multiple onchange={(evt) => initWithAuthKeyFile(evt)} style="display:none;"/>
            {:else}
                {#if loaded}
                    <h1 class="title">Login</h1>
                    <div class="small-padding">
                        <button class="add-button" onclick={() => doLogin()}>Authenticate</button>
                    </div>
                    <div class="small-padding">
                        <button class="add-button red-button" onclick={() => removeAPIKey()}>Remove API Key</button>
                    </div>
                {:else}
                    <h1 class="title">Loading...</h1>
                {/if}
            {/if}
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

    .overlay, .overlay-darken {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        color: beige;
    }

    .overlay-darken {
        background-color: #000C;
    }

    .center-parent {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .center-login {
        display: flexbox;
        text-align: center;
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

    .small-padding {
        padding: 10px;
    }

    .small-vertical-padding {
        padding-top: 10px;
        padding-bottom: 10px;
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

    .collection-input, .post-id {
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

    .post-id {
        margin: none;
        display: inline-block;
        padding: 4px 8px;
        background-color: #7774;
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
        height: 70vh;
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