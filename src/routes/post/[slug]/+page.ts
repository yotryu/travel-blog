import type { PageLoad } from './$types';

interface Collection {
    id: string;
    title: string;
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
    let path = `/posts/${params.slug}.json`;
    let postData = await fetch(path);
    let json = await postData.json() as Post;

    json.contentParagraphs = json.content.split("\n");
    json.id = params.slug;

    let allCollectionsData = await fetch("/collections/all.json");
    let allCollections = await allCollectionsData.json() as Collection[];
    let thisCollection = allCollections.find(i => i.id == json.collection);

    if (!thisCollection)
    {
        thisCollection = {
            id: "unknown",
            posts: [],
            title: "Unknown",
            parent: ""
        };
    }

    let collectionPosts: Post[] = [];
    let postPromises: Promise<Response>[] = [];

    thisCollection?.posts.forEach(i =>
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
		post: json,
        collection: thisCollection,
        collectionPosts: collectionPosts
	};
};