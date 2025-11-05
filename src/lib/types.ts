export interface PostImage {
    src: string;
    collageSrc: string;
    navSrc: string;
}

export interface Collection {
    id: string;
    title: string;
    subtitle: string;
    sortDate: string;
    forceFirstTitleImage: number;
    titleImages: PostImage[];
    parent: string;
    posts: string[];
}

export interface Post {
    id: string;
    date: string;
    collection: string;
    title: string;
    content: string;
    contentParagraphs: string[]; // generated
    images: PostImage[];
}