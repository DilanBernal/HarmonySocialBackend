import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import UserRoleEntity from "./UserRoleEntity";
import Role from "../../../../domain/models/seg/Role";

@Entity({ name: "roles", schema: "seg" })
@Index("UQ_role_name", ["name"], { unique: true })
export default class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 50 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_at?: Date;

  @OneToMany(() => UserRoleEntity, (ur) => ur.role)
  user_roles?: UserRoleEntity[];

  /**
   * Converts this entity to a domain object
   */
  toDomain(): Role {
    return new Role(this.id, this.name, this.description, this.created_at, this.updated_at);
  }

  /**
   * Creates an entity from a domain object
   */
  static fromDomain(domain: Role): RoleEntity {
    const entity = new RoleEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.created_at = domain.createdAt;
    entity.updated_at = domain.updatedAt;
    return entity;
  }
}
