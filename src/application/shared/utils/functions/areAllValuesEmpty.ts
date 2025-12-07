export default function areAllValuesEmpty(obj: any): boolean {
  if (!obj || typeof obj !== "object") return true;

  const values = Object.values(obj);
  if (values.length === 0) return true;

  return values.every(
    (value) =>
      value == null ||
      value === "" ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" && Object.keys(value).length === 0),
  );
}
