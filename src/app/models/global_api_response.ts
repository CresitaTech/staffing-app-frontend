export interface GlobalApiResponse<T> {
    count: number,
    next: string,
    previous: string,
    results: Array<T>
}