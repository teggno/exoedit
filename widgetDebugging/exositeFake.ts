///<reference path="../typings/fetch.d.ts" />

interface ReadOptions {
    starttime: number;
    endtime: number;
    limit: number;
    /**
     * "asc" or "desc"
     */
    sort: string;
}

interface Point {
    [index: number]: string|number;
}

interface DoneCallback<T, TResult> {
    (value: T): TResult | ExoDeferred<TResult>;
}

interface FailCallback<T> {
    (errror: any): T | ExoDeferred<T>;
}

interface ExoDeferred<T> {
    done<TResult>(callback?: DoneCallback<T, TResult>): ExoDeferred<TResult>;
    fail(callback?: FailCallback<T>): ExoDeferred<T>;
}

class ExoDeferredImpl<T> implements ExoDeferred<T> {
    constructor(private promise: Promise<T>) {
    }

    public done<TResult>(callback: DoneCallback<T, TResult>) {
        return new ExoDeferredImpl(this.promise.then(result => callback));
    }
    public fail(callback: FailCallback<T>) {
        return new ExoDeferredImpl(this.promise.catch(callback));
    }
}

class PointDeferred<TResult> {
    constructor(private promise: Promise<Point[]>) {
    }

    public done<TResult>(callback: (...points: Point[]) => TResult) {
        return new ExoDeferredImpl(this.promise.then(result => callback(...result)));
    }

    public fail(callback: (error: any) => TResult) {
        return new ExoDeferredImpl(this.promise.catch(callback));
    }
}

export function read(targetResource: string[], options: ReadOptions) {
    if (! targetResource || targetResource.length !== 2)
        throw new Error("targetResource must be an array consisting of exactly two strings.");

    const body = JSON.stringify({
        targetResource: targetResource,
        options: options
    });
    const promise = fetch("read", { method: "POST", body: body })
        .then(response => {
            return response.ok ? response.json() : response.text().then(text => Promise.reject(text));
        });

    return new PointDeferred(promise);
}
