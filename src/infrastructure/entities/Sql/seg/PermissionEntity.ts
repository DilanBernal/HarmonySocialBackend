import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import RolePermissionEntity from "./RolePermissionEntity";
import Permission from "../../../../domain/models/seg/Permission";
// import RolePermissionEntity from "./RolePermissionEntity";

@Entity({ name: "permissions", schema: "seg" })
@Index("UQ_permission_name", ["name"], { unique: true })
export default class PermissionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120 })
  name!: string; // e.g., artist.accept

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at?: Date;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.permission)
  role_permissions?: RolePermissionEntity[];

  /**
   * Converts this entity to a domain object
   */
  toDomain(): Permission {
    return new Permission(this.id, this.name, this.description, this.created_at, this.updated_at);
  }

  /**
   * Creates an entity from a domain object
   */
  static fromDomain(domain: Permission): PermissionEntity {
    const entity = new PermissionEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.created_at = domain.createdAt;
    entity.updated_at = domain.updatedAt;
    return entity;
  }
}
