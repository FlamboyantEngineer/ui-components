/** The separator `formatPath` joins labels with. */
export declare const PATH_SEPARATOR = "/";
export interface FormatPathOptions {
    /** Start the text with the separator. */
    rooted?: boolean | undefined;
    /** Text for a path with no labels. Defaults to the separator when rooted, else empty. */
    emptyLabel?: string | undefined;
}
/**
 * Display text for a location: nonblank trimmed labels joined with `/`. A string is split on `/`;
 * array entries stay whole, so labels that contain slashes (URLs, file names) are kept as they are.
 */
export declare function formatPath(path: string | readonly string[] | null | undefined, options?: FormatPathOptions): string;
/** One folder of a flat catalog that links each folder to its parent. */
export interface PathFolder {
    id: string;
    parentId: string | null;
    name: string;
    /** An already resolved path for the folder, used in place of walking its parents. */
    path?: string | undefined;
}
/**
 * The rooted display path of a folder in a flat catalog. Walks parent ids from the folder upwards,
 * keeps the known part when an ancestor is missing, stops before repeating a folder in a cycle and
 * shows a blank name as the folder's id. A missing or absent folder reads `rootLabel`.
 */
export declare function formatFolderPath(folders: readonly PathFolder[], folderId: string | null | undefined, rootLabel?: string): string;
//# sourceMappingURL=path.d.ts.map