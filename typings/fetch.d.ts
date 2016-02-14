declare namespace ftch {
    interface Response {
        json(): Promise<any>;
        text(): Promise<string>;
        ok: boolean;
    }
    interface FetchOptions {
        method?: string;
        headers?: any[];
        body?: string;
    }
    export interface FetchFn {
        (url: string, options: FetchOptions): Promise<Response>;
    }
}
declare var fetch: ftch.FetchFn;