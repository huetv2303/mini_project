import { create } from "zustand";

const sortAssignedUsers = (modules) => {
  return modules.map(mod => ({
    ...mod,
    permissions: mod.permissions.map(perm => ({
      ...perm,
      assigned_users: [...perm.assigned_users].sort((a, b) => a.id - b.id)
    }))
  }));
};

const checkIsDirty = (modules, initialModules) => {
  const sortedModules = sortAssignedUsers(modules);
  const sortedInitial = sortAssignedUsers(initialModules);
  return JSON.stringify(sortedModules) !== JSON.stringify(sortedInitial);
};

export const usePermissionStore = create((set, get) => ({
  modules: [],
  initialModules: [],
  isDirty: false,
  isLoading: false,
  error: null,

  setPermissions: (permissionsMatrix) => {
    // Clone sâu để tránh chia sẻ tham chiếu bộ nhớ
    const cloned = JSON.parse(JSON.stringify(permissionsMatrix));
    set({
      modules: cloned,
      initialModules: JSON.parse(JSON.stringify(cloned)),
      isDirty: false,
      error: null
    });
  },

  addAdminToPermission: (permissionId, adminUser) => {
    const { modules, initialModules } = get();

    // 1. Tìm mã code của permission đang được gán để xác định module prefix
    let targetCode = "";
    modules.forEach(mod => {
      const found = mod.permissions.find(p => p.id === permissionId);
      if (found) targetCode = found.code;
    });

    let viewCodeToAutoAssign = "";
    if (targetCode && targetCode.includes(".")) {
      const parts = targetCode.split(".");
      const action = parts[parts.length - 1];
      if (action !== "view") {
        // Lấy prefix (ví dụ: 'products' từ 'products.create')
        const prefix = parts.slice(0, -1).join(".");
        viewCodeToAutoAssign = `${prefix}.view`;
      }
    }

    const updatedModules = modules.map((module) => ({
      ...module,
      permissions: module.permissions.map((perm) => {
        // Gán cho chính permission được chọn HOẶC tự động gán cho quyền view tương ứng của module đó
        if (perm.id === permissionId || (viewCodeToAutoAssign && perm.code === viewCodeToAutoAssign)) {
          if (perm.assigned_users.some((user) => user.id === adminUser.id)) {
            return perm;
          }
          return {
            ...perm,
            assigned_users: [...perm.assigned_users, adminUser],
          };
        }
        return perm;
      }),
    }));

    set({
      modules: updatedModules,
      isDirty: checkIsDirty(updatedModules, initialModules),
    });
  },

  removeAdminFromPermission: (permissionId, adminId) => {
    const { modules, initialModules } = get();

    // 1. Tìm mã code của permission đang bị gỡ để xác định nếu là quyền view thì gỡ toàn bộ các quyền con
    let targetCode = "";
    modules.forEach(mod => {
      const found = mod.permissions.find(p => p.id === permissionId);
      if (found) targetCode = found.code;
    });

    let prefixToRemoveAll = "";
    if (targetCode && targetCode.includes(".")) {
      const parts = targetCode.split(".");
      const action = parts[parts.length - 1];
      if (action === "view") {
        prefixToRemoveAll = parts.slice(0, -1).join(".") + ".";
      }
    }

    const updatedModules = modules.map((module) => ({
      ...module,
      permissions: module.permissions.map((perm) => {
        // Gỡ chính nó, HOẶC nếu gỡ quyền view thì gỡ toàn bộ quyền khác có cùng prefix
        if (perm.id === permissionId || (prefixToRemoveAll && perm.code.startsWith(prefixToRemoveAll))) {
          return {
            ...perm,
            assigned_users: perm.assigned_users.filter((user) => user.id !== adminId),
          };
        }
        return perm;
      }),
    }));

    set({
      modules: updatedModules,
      isDirty: checkIsDirty(updatedModules, initialModules),
    });
  },

  resetChanges: () => {
    const { initialModules } = get();
    set({
      modules: JSON.parse(JSON.stringify(initialModules)),
      isDirty: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
