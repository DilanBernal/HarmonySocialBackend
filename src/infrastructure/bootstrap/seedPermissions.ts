// import "reflect-metadata";
import { SqlAppDataSource } from "../config/con_database";
import {
  CorePermissionsList,
  DefaultRolePermissionMapping,
  CorePermission,
} from "../../domain/models/seg/Permission";
import { PermissionEntity, RoleEntity, RolePermissionEntity } from "../entities/Sql/seg";

async function seed() {
  if (!SqlAppDataSource.isInitialized) await SqlAppDataSource.initialize();
  const permRepo = SqlAppDataSource.getRepository(PermissionEntity);
  const roleRepo = SqlAppDataSource.getRepository(RoleEntity);
  const rpRepo = SqlAppDataSource.getRepository(RolePermissionEntity);

  console.log("Seeding permissions...");
  // Insert permissions if not exist
  for (const name of CorePermissionsList) {
    const exists = await permRepo.findOne({ where: { name } });
    if (!exists) {
      await permRepo.insert({ name, description: name });
      console.log("Inserted permission", name);
    }
  }

  console.log("Seeding role-permission mappings...");
  for (const [roleName, perms] of Object.entries(DefaultRolePermissionMapping)) {
    const role = await roleRepo.findOne({ where: { name: roleName } });
    if (!role) {
      console.warn("Role not found (skip perms):", roleName);
      continue;
    }
    for (const p of perms as CorePermission[]) {
      const permission = await permRepo.findOne({ where: { name: p } });
      if (!permission) continue; // should not happen
      const existing = await rpRepo.findOne({
        where: { role: { id: role.id }, permission: { id: permission.id } },
      });
      if (!existing) {
        const rp = rpRepo.create({ role, permission });
        await rpRepo.save(rp);
        console.log(`Assigned ${p} to role ${roleName}`);
      }
    }
  }

  console.log("Seeding completed.");
  await SqlAppDataSource.destroy();
}

seed().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
