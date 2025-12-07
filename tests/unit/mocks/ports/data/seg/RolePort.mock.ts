import RolePort, {
  RoleCreateData,
  RoleUpdateData,
} from "../../../../../../src/domain/ports/data/seg/RolePort";
import Role from "../../../../../../src/domain/models/seg/Role";

// Helper function to create Role instances
const createMockRole = (
  id: number,
  name: string,
  description?: string,
  createdAt?: Date,
  updatedAt?: Date,
): Role => {
  return new Role(
    id,
    name,
    description,
    createdAt ?? new Date("2023-01-01"),
    updatedAt ?? new Date("2023-01-01"),
  );
};

// Mock data para roles basados en el seed y la estructura real
const createMockRoles = (): Role[] => [
  createMockRole(1, "common_user", "Usuario común con permisos básicos"),
  createMockRole(2, "artist", "Artista con permisos de creación de contenido"),
  createMockRole(3, "admin", "Administrador con todos los permisos"),
];

// Contador para simular auto-increment de IDs
let nextId = 4;

const createRolePortMock = (): jest.Mocked<RolePort> => {
  const mockRoles = createMockRoles();

  return {
    create: jest.fn().mockImplementation(async (data: RoleCreateData): Promise<number> => {
      // Verificar si ya existe un rol con ese nombre
      const existing = mockRoles.find((r) => r.name.toLowerCase() === data.name.toLowerCase());
      if (existing) {
        throw new Error(`Role with name '${data.name}' already exists`);
      }

      // Crear nuevo rol
      const newRole = createMockRole(nextId++, data.name, data.description);

      // Agregarlo al mock data
      mockRoles.push(newRole);

      return newRole.id;
    }),

    update: jest
      .fn()
      .mockImplementation(async (id: number, data: RoleUpdateData): Promise<boolean> => {
        const roleIndex = mockRoles.findIndex((r) => r.id === id);

        if (roleIndex === -1) {
          return false; // Rol no encontrado
        }

        // Si se está actualizando el nombre, verificar que no exista otro rol con ese nombre
        if (data.name) {
          const existingWithName = mockRoles.find(
            (r) => r.name.toLowerCase() === data.name!.toLowerCase() && r.id !== id,
          );
          if (existingWithName) {
            throw new Error(`Role with name '${data.name}' already exists`);
          }
        }

        // Actualizar el rol
        const existing = mockRoles[roleIndex];
        if (data.name) existing.name = data.name;
        if (data.description !== undefined) existing.description = data.description;
        existing.updatedAt = new Date();

        return true;
      }),

    delete: jest.fn().mockImplementation(async (id: number): Promise<boolean> => {
      const roleIndex = mockRoles.findIndex((r) => r.id === id);

      if (roleIndex === -1) {
        return false; // Rol no encontrado
      }

      // Remover el rol del array
      mockRoles.splice(roleIndex, 1);
      return true;
    }),

    findById: jest.fn().mockImplementation(async (id: number): Promise<Role | null> => {
      const role = mockRoles.find((r) => r.id === id);
      return role ?? null;
    }),

    findByName: jest.fn().mockImplementation(async (name: string): Promise<Role | null> => {
      const role = mockRoles.find((r) => r.name.toLowerCase() === name.toLowerCase());
      return role ?? null;
    }),

    list: jest.fn().mockImplementation(async (): Promise<Role[]> => {
      return [...mockRoles];
    }),
  };
};

export default createRolePortMock;
