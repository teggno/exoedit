const rpc = require("onep/rpc");

export default function rpcCallPromise<T>(auth: {}|string, procedure: string, args: any[]) {
    console.log(`rpc procedure ${procedure}, args: ${JSON.stringify(args)}`);
    return new Promise<T>((resolve, reject ) => {
        rpc.call(auth, procedure, args,
            function (err, response) {
                if (err) {
                    return reject(err);
                }
                if (response[0].status !== "ok") {
                    return reject(`Error response status (${response[0].status}) in rpc procedure ${procedure}` );
                }
                resolve(response[0].result);
            }
        );
    });
}