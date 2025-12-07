export default class PaginationResponse<T> {
  public rows!: Array<T>;
  public page_size!: number;
  public total_rows!: number;
  private _page_number?: number | undefined;
  private _last_id?: number | undefined;
  private _first_id?: number | undefined;

  public static create<T>(
    data: Array<T>,
    pageSize: number,
    totalRows: number,
    pageNumber?: number,
    firstId?: number,
    lastId?: number,
  ) {
    const response = new PaginationResponse<T>();
    response.rows = data;
    response.page_size = pageSize;
    response.total_rows = totalRows;
    response.page_number = pageNumber;
    response.first_id = firstId;
    response.last_id = lastId;
    return response;
  }

  public static createEmpty<T>(): PaginationResponse<T> {
    return PaginationResponse.create([], 0, 0);
  }

  public get page_number(): number | undefined {
    return this._page_number;
  }
  public set page_number(value: number | undefined) {
    this._page_number = value;
  }
  public get last_id(): number | undefined {
    return this._last_id;
  }
  public set last_id(value: number | undefined) {
    this._last_id = value;
  }

  public get first_id(): number | undefined {
    return this._first_id;
  }
  public set first_id(value: number | undefined) {
    this._first_id = value;
  }
}
