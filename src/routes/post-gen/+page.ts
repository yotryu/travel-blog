import type { PageLoad } from './$types';
import type { Collection } from '$lib/types';


export const load: PageLoad = async ({ fetch }) => {
    // We only need current collection data to start with - gives us our collections at this stage
    let allCollectionsData = await fetch("/collections/all.json");
    let allCollections = await allCollectionsData.json() as Collection[];

	return {
		collections: allCollections
	};
};