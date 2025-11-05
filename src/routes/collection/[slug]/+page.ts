import type { PageLoad } from './$types';
import type { Collection, Post } from '$lib/types';


export const load: PageLoad = async ({ fetch, params }) => {
    // Find the collection in the master json
    let path = `/collections/all.json`;
    let postData = await fetch(path);
    let allCollections = await postData.json() as Collection[];
    let thisCollection = allCollections.find(i => i.id == params.slug);

    // If we don't have it somehow, return null
    if (!thisCollection)
    {
        return {
            collection: null,
            collectionPosts: null
        }
    }

    let collectionPosts: Post[] = [];
    let postPromises: Promise<Response>[] = [];

    // Fetch all post jsons so we can display title and images from them
    thisCollection.posts.forEach(i =>
    {
        let id = i;
        let p = fetch(`/posts/${id}.json`)
            .then(v => v.json())
            .then(j => {collectionPosts.push(j); return j;});
        postPromises.push(p);
    });

    // Wait for all to be available
    await Promise.all(postPromises);

    // Sort posts by ID - these will typically be alphabetical
    collectionPosts = collectionPosts.sort((a, b) =>
    {
        let ia = thisCollection.posts.findIndex(i => i == a.id);
        let ib = thisCollection.posts.findIndex(i => i == b.id);

        return ia > ib ? 1 : ib > ia ? -1 : 0;
    });

    // Return this collection and all the posts, sorted
    return {
        collection: thisCollection,
        collectionPosts: collectionPosts
    };
};