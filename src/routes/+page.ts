import type { PageLoad } from './$types';

interface Collection {
    id: string;
    title: string;
    subtitle: string;
    sortDate: string;
    titleImage: string;
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

    allCollections = allCollections.sort((a, b) => a.sortDate.localeCompare(b.sortDate)).reverse();

    return {
        collections: allCollections
    };
};