import type { PageLoad } from './$types';

interface Collection {
    id: string;
    title: string;
    subtitle: string;
    parent: string;
    posts: string[];
}

interface PostImage {
    src: string;
    collageSrc: string;
    navSrc: string;
}

interface Post {
    id: string;
    date: string;
    collection: string;
    title: string;
    content: string;
    contentParagraphs: string[]; // generated
    images: PostImage[];
}

export const load: PageLoad = async ({ fetch, params }) => {
    let path = `/collections/all.json`;
    let postData = await fetch(path);
    let allCollections = await postData.json() as Collection[];
    let thisCollection = allCollections.find(i => i.id == params.slug);

    if (!thisCollection)
    {
        return {
            collection: null,
            collectionPosts: null
        }
    }

    let collectionPosts: Post[] = [];
    let postPromises: Promise<Response>[] = [];

    thisCollection.posts.forEach(i =>
    {
        let id = i;
        let p = fetch(`/posts/${id}.json`)
            .then(v => v.json())
            .then(j => {collectionPosts.push(j); return j;});
        postPromises.push(p);
    });

    await Promise.all(postPromises);

    collectionPosts = collectionPosts.sort((a, b) =>
    {
        let ia = thisCollection.posts.findIndex(i => i == a.id);
        let ib = thisCollection.posts.findIndex(i => i == b.id);

        return ia > ib ? 1 : ib > ia ? -1 : 0;
    });

    return {
        collection: thisCollection,
        collectionPosts: collectionPosts
    };
};