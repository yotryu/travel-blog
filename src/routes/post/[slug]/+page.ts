import type { PageLoad } from './$types';
import type { Collection, Post } from '$lib/types';


export const load: PageLoad = async ({ fetch, params }) => {
    // Fetch our post json
    let path = `/posts/${params.slug}.json`;
    let postData = await fetch(path);
    let json = await postData.json() as Post;

    // Grab our individual paragraphs and capture the ID
    json.contentParagraphs = json.content.split("\n");
    json.id = params.slug;

    // Fetch this post's collection data from the master list
    let allCollectionsData = await fetch("/collections/all.json");
    let allCollections = await allCollectionsData.json() as Collection[];
    let thisCollection = allCollections.find(i => i.id == json.collection);

    // If the collection is missing, return unknown / empty post info
    if (!thisCollection)
    {
        thisCollection = {
            id: "unknown",
            posts: [],
            title: "Unknown",
            parent: "",
            forceFirstTitleImage: -1,
            sortDate: "",
            subtitle: "",
            titleImages: []
        };
    }

    let collectionPosts: Post[] = [];
    let postPromises: Promise<Response>[] = [];

    // Fetch all the collection's posts so we can setup navigation (prev and next)
    thisCollection?.posts.forEach(i =>
    {
        let id = i;
        let p = fetch(`/posts/${id}.json`)
            .then(v => v.json())
            .then(j => {collectionPosts.push(j); return j;});
        postPromises.push(p);
    });

    // Wait for all
    await Promise.all(postPromises);

    // Sort the collection posts by ID so we are always in the correct order
    collectionPosts = collectionPosts.sort((a, b) =>
    {
        let ia = thisCollection.posts.findIndex(i => i == a.id);
        let ib = thisCollection.posts.findIndex(i => i == b.id);

        return ia > ib ? 1 : ib > ia ? -1 : 0;
    });

    // Return post and collection information
	return {
		post: json,
        collection: thisCollection,
        collectionPosts: collectionPosts
	};
};