import type { PageLoad } from './$types';

interface Collection {
    id: string;
    title: string;
    parent: string;
    posts: string[];
}

interface PostImage {
    src: string;
    size: number;
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

	return {
		post: json,
        collectionPosts: collectionPosts
	};
};