import api from './api'

/**
 * Fetch all pages from a paginated endpoint.
 * The backend must support `page` and `per_page` query parameters.
 * Results from each page are concatenated and returned as a single array.
 * @param endpoint API endpoint (e.g. '/courses')
 * @param params Additional query params
 * @param perPage Number of records per request
 */
export async function fetchAllPages<T>(
  endpoint: string,
  params: Record<string, any> = {},
  perPage = 100,
): Promise<T[]> {
  let page = 1
  const all: T[] = []
  while (true) {
    const res = await api.get(endpoint, {
      params: { ...params, page, per_page: perPage },
    })
    const data = Array.isArray(res.data.data) ? res.data.data : res.data
    if (Array.isArray(data)) {
      all.push(...data)
      if (data.length < perPage) break
    } else {
      break
    }
    page += 1
  }
  return all
}
