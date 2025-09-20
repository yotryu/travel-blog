import type { PageLoad } from './$types';

interface Collection {
    id: string;
    title: string;
    parent: string;
    posts: string[];
}

export const load: PageLoad = async ({ fetch }) => {
    let allCollectionsData = await fetch("/collections/all.json");
    let allCollections = await allCollectionsData.json() as Collection[];

	return {
		collections: allCollections
	};
};