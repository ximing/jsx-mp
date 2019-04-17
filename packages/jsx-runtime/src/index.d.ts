type ReactText = string | number;
type ReactChild = Element | ReactText;

interface ReactNodeArray extends Array<ReactNode> {}
type ReactFragment = {} | ReactNodeArray;
type ReactNode = ReactChild | ReactFragment | boolean | null | undefined;
type ReactInstance = any;

export = MC;
export as namespace MC;

declare namespace MC {
    function createComponent(com: any): any;
    function createPage(page: any): any;

    class Component<P, D> {
        constructor(props?: Readonly<P>);
        readonly props: Readonly<P> & Readonly<{ children?: ReactNode }>;
        setData<K extends keyof D>(
            data:
                | ((prevData: Readonly<D>, props: Readonly<P>) => Pick<D, K> | D | null)
                | (Pick<D, K> | D | null),
            callback?: () => void
        ): void;
        data: Readonly<D>;
        render(): ReactNode;
        refs: {
            [key: string]: ReactInstance;
        };
    }
    class Page<D> {
        constructor();
        setData<K extends keyof D>(
            data: ((prevData: Readonly<D>) => Pick<D, K> | D | null) | (Pick<D, K> | D | null),
            callback?: () => void
        ): void;
        data: Readonly<D>;
        render(): ReactNode;
        refs: {
            [key: string]: ReactInstance;
        };
    }
}
