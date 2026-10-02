export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after ${ms} ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Step 2: rejects if the promise does not settle within `ms`.
 * The timer is always cleared so it cannot keep the process alive.
 *
 * Note: this stops *waiting*, it does not cancel the underlying request.
 * With a real HTTP call you would pass an AbortController signal to fetch().
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Step 3a: calls `fn` up to 1 + retries times and rethrows the last error.
 * `fn` is a factory, so every attempt starts a fresh operation.
 * (In production you would add a delay with exponential backoff between attempts.)
 */
export async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/**
 * Step 3b: runs tasks with at most `limit` in flight at the same time.
 * Results keep the input order. Each worker pulls the next task index
 * from a shared counter; this is safe because JS is single-threaded.
 */
export async function runWithLimit<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }

  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < tasks.length) {
      const index = next++;
      const task = tasks[index]!;
      try {
        results[index] = { status: "fulfilled", value: await task() };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };

  const workerCount = Math.min(limit, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export interface LoadOptions {
  timeoutMs?: number;
  retries?: number;
  concurrency?: number;
}

export interface LoadResult<T> {
  products: T[];
  failedIds: number[];
}

/** Step 1 + composition of everything above. */
export async function loadProducts<T>(
  ids: number[],
  fetchProduct: (id: number) => Promise<T>,
  { timeoutMs = 1000, retries = 2, concurrency = 5 }: LoadOptions = {},
): Promise<LoadResult<T>> {
  const tasks = ids.map(
    id => () => withRetry(() => withTimeout(fetchProduct(id), timeoutMs), retries),
  );

  const results = await runWithLimit(tasks, concurrency);

  const products: T[] = [];
  const failedIds: number[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") products.push(result.value);
    else failedIds.push(ids[i]!);
  });

  return { products, failedIds };
}
