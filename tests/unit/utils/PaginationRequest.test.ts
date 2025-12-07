import PaginationRequest from "../../../src/application/dto/utils/PaginationRequest";

describe("PaginationRequest", () => {
  type FilterType = { name?: string; age?: number };

  it("should create an instance with all properties set", () => {
    const filters: FilterType = { name: "John", age: 30 };
    const pageSize = 10;
    const generalFilter = "search";
    const pageNumber = 2;
    const firstId = 100;
    const lastId = 200;

    const req = PaginationRequest.create(
      filters,
      pageSize,
      generalFilter,
      pageNumber,
      firstId,
      lastId,
    );

    expect(req.filters).toEqual(filters);
    expect(req.general_filter).toBe(generalFilter);
    expect(req.page_size).toBe(pageSize);
    expect(req.page_number).toBe(pageNumber);
    expect(req.first_id).toBe(firstId);
    expect(req.last_id).toBe(lastId);
  });

  it("should allow setting and getting page_size", () => {
    const req = new PaginationRequest<FilterType>();
    req.page_size = 25;
    expect(req.page_size).toBe(25);
  });

  it("should allow setting and getting page_number", () => {
    const req = new PaginationRequest<FilterType>();
    req.page_number = 3;
    expect(req.page_number).toBe(3);
    req.page_number = undefined;
    expect(req.page_number).toBeUndefined();
  });

  it("should allow setting and getting first_id", () => {
    const req = new PaginationRequest<FilterType>();
    req.first_id = 101;
    expect(req.first_id).toBe(101);
    req.first_id = undefined;
    expect(req.first_id).toBeUndefined();
  });

  it("should allow setting and getting last_id", () => {
    const req = new PaginationRequest<FilterType>();
    req.last_id = 202;
    expect(req.last_id).toBe(202);
    req.last_id = undefined;
    expect(req.last_id).toBeUndefined();
  });

  it("should create an instance with minimal arguments", () => {
    const filters: FilterType = {};
    const pageSize = 5;
    const req = PaginationRequest.create(filters, pageSize);

    expect(req.filters).toEqual(filters);
    expect(req.page_size).toBe(pageSize);
    expect(req.general_filter).toBeUndefined();
    expect(req.page_number).toBeUndefined();
    expect(req.first_id).toBeUndefined();
    expect(req.last_id).toBeUndefined();
  });
});
