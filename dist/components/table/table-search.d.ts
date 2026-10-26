export interface TableSearchProps {
    /** Accessible name and placeholder. */
    label: string;
    value: string;
    onChange: (value: string) => void;
}
/** The search box above a filterable table. Escape or the clear button empties it. */
export declare function TableSearch({ label, value, onChange }: TableSearchProps): import("react").JSX.Element;
//# sourceMappingURL=table-search.d.ts.map