export default class Post {
  private _id!: number;
  private _userId!: number;
  private _songId!: number;
  private _publicationDate!: Date;
  private _title!: string;
  private _description!: string;
  private _shortDescription!: string;
  private _likesNumber!: number;
  private _commentsNumber!: number;
  private _createdAt!: Date;
  private _updatedAt?: Date;

  constructor(
    id: number,
    userId: number,
    songId: number,
    title: string,
    description: string,
    shortDescription: string,
    publicationDate?: Date,
    likesNumber: number = 0,
    commentsNumber: number = 0,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.songId = songId;
    this.title = title;
    this.description = description;
    this.shortDescription = shortDescription;
    this._publicationDate = publicationDate ?? new Date();
    this.likesNumber = likesNumber;
    this.commentsNumber = commentsNumber;
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

  public get userId(): number {
    return this._userId;
  }
  public set userId(value: number) {
    if (value <= 0) {
      throw new Error("El userId debe ser mayor a 0");
    }
    this._userId = value;
  }

  public get songId(): number {
    return this._songId;
  }
  public set songId(value: number) {
    if (value <= 0) {
      throw new Error("El songId debe ser mayor a 0");
    }
    this._songId = value;
  }

  public get publicationDate(): Date {
    return this._publicationDate;
  }

  public get title(): string {
    return this._title;
  }
  public set title(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("El título no puede estar vacío");
    }
    if (value.trim().length > 200) {
      throw new Error("El título no puede exceder 200 caracteres");
    }
    this._title = value.trim();
  }

  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    if (!value) {
      throw new Error("La descripción no puede estar vacía");
    }
    if (value.length > 2000) {
      throw new Error("La descripción no puede exceder 2000 caracteres");
    }
    this._description = value;
  }

  public get shortDescription(): string {
    return this._shortDescription;
  }
  public set shortDescription(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("La descripción corta no puede estar vacía");
    }
    if (value.trim().length > 300) {
      throw new Error("La descripción corta no puede exceder 300 caracteres");
    }
    this._shortDescription = value.trim();
  }

  public get likesNumber(): number {
    return this._likesNumber;
  }
  public set likesNumber(value: number) {
    if (value < 0) {
      throw new Error("El número de likes no puede ser negativo");
    }
    this._likesNumber = value;
  }

  public get commentsNumber(): number {
    return this._commentsNumber;
  }
  public set commentsNumber(value: number) {
    if (value < 0) {
      throw new Error("El número de comentarios no puede ser negativo");
    }
    this._commentsNumber = value;
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

  public addLike(): void {
    this._likesNumber++;
    this._updatedAt = new Date();
  }

  public removeLike(): void {
    if (this._likesNumber > 0) {
      this._likesNumber--;
      this._updatedAt = new Date();
    }
  }

  public addComment(): void {
    this._commentsNumber++;
    this._updatedAt = new Date();
  }

  public removeComment(): void {
    if (this._commentsNumber > 0) {
      this._commentsNumber--;
      this._updatedAt = new Date();
    }
  }
}
