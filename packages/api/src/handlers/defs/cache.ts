const handlerCache = new Map<string, unknown>();

export function makeCache<T, Args>(name: string, retrieve: (...args: Args[]) => T) {
	return {
		retrieve(...args: Args[]) {
			if (handlerCache.has(name)) return handlerCache.get(name) as T;

			const res = retrieve(...args);
			if (res instanceof Promise) {
				return res.then((ret: T) => {
					handlerCache.set(name, ret);
					return ret;
				});
			} else {
				handlerCache.set(name, res);
				return res;
			}
		},
	};
}
