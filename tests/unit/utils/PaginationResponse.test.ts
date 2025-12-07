import PaginationResponse from "../../../src/application/dto/utils/PaginationResponse";

describe("PaginationResponse", () => {
  type Item = { id: number; name: string };

  const sampleData: Item[] = [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
  ];

  it("should create an instance with correct properties using static create", () => {
    const response = PaginationResponse.create<Item>(sampleData, 2, 10, 1, 1, 2);

    expect(response.rows).toEqual(sampleData);
    expect(response.page_size).toBe(2);
    expect(response.total_rows).toBe(10);
    expect(response.page_number).toBe(1);
    expect(response.first_id).toBe(1);
    expect(response.last_id).toBe(2);
  });

  it("should allow setting and getting page_number", () => {
    const response = new PaginationResponse<Item>();
    response.page_number = 5;
    expect(response.page_number).toBe(5);
    response.page_number = undefined;
    expect(response.page_number).toBeUndefined();
  });

  it("should allow setting and getting first_id", () => {
    const response = new PaginationResponse<Item>();
    response.first_id = 100;
    expect(response.first_id).toBe(100);
    response.first_id = undefined;
    expect(response.first_id).toBeUndefined();
  });

  it("should allow setting and getting last_id", () => {
    const response = new PaginationResponse<Item>();
    response.last_id = 200;
    expect(response.last_id).toBe(200);
    response.last_id = undefined;
    expect(response.last_id).toBeUndefined();
  });

  it("should work with empty data", () => {
    const response = PaginationResponse.create<Item>([], 0, 0);
    expect(response.rows).toEqual([]);
    expect(response.page_size).toBe(0);
    expect(response.total_rows).toBe(0);
    expect(response.page_number).toBeUndefined();
    expect(response.first_id).toBeUndefined();
    expect(response.last_id).toBeUndefined();
  });
});
