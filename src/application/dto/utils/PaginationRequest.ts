export default class PaginationRequest<T> {
  public filters?: T;
  public general_filter?: string;
  private _page_size!: number;
  private _page_number?: number | undefined;
  private _last_id?: number | undefined;
  private _first_id?: number | undefined;

  /**
   *
   * @param filters Filtros que se van a aplicar a la query
   * @param pageSize El tamaño de pagina, si no se especifica por algun motivo, se le va a asignar 5
   * @param generalFilter El filtro general aplicado a la query
   * @param pageNumber El numero de pagina que se va a tomar si aplica
   * @param firstId El primer id que se tomo, se usa para la paginacion para hacer un between si trae tambien el ultimo o para hacer la paginacion en reversa
   * @param lastId El primer id que se tomo, se usa para la paginacion para hacer un between si trae tambien el primero o para hacer la paginacion para adelante
   * @returns Instancia de la clase
   */
  public static create<T>(
    filters: T,
    pageSize: number,
    generalFilter?: string,
    pageNumber?: number,
    firstId?: number,
    lastId?: number,
  ) {
    const response = new PaginationRequest<T>();
    response.general_filter = generalFilter;
    response.filters = filters;
    response.page_size = isNaN(pageSize) ? 5 : pageSize;
    response.page_number = pageNumber;
    response.first_id = firstId;
    response.last_id = lastId;
    return response;
  }

  public get page_number(): number | undefined {
    return this._page_number;
  }
  public set page_number(value: number | undefined) {
    this._page_number = value;
  }
  public get page_size(): number {
    return this._page_size;
  }
  public set page_size(value: number) {
    this._page_size = value;
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
