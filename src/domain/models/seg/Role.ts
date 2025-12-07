export default class Role {
  private _id!: number;
  private _name!: string;
  private _description?: string;
  private _createdAt!: Date;
  private _updatedAt?: Date;

  constructor(id: number, name: string, description?: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.name = name;
    this.description = description;
    this._createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt;
  }

  public get id(): number {
    return this._id;
  }
  public set id(value: number) {
    if (value < 0) {
      throw new Error("El id no puede ser menor a 0");
    }
    this._id = value;
  }

  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("El nombre del rol no puede estar vacío");
    }
    if (value.trim().length > 50) {
      throw new Error("El nombre del rol no puede exceder 50 caracteres");
    }
    this._name = value.trim().toLowerCase();
  }

  public get description(): string | undefined {
    return this._description;
  }
  public set description(value: string | undefined) {
    if (value && value.length > 200) {
      throw new Error("La descripción no puede exceder 200 caracteres");
    }
    this._description = value;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date | undefined {
    return this._updatedAt;
  }
  public set updatedAt(value: Date | undefined) {
    this._updatedAt = value;
  }
}
