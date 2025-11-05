import type { PageLoad } from './$types';
import type { Collection } from '$lib/types';


export const load: PageLoad = async ({ fetch, params }) => {
    let path = `/collections/all.json`;
    let postData = await fetch(path);
    let allCollections = await postData.json() as Collection[];

    allCollections = allCollections.sort((a, b) => a.sortDate.localeCompare(b.sortDate)).reverse();

    return {
        collections: allCollections
    };
};