import type { Locale } from './types';

export const usersES = {
  users: {
    title: 'Usuarios', createUser: 'Crear usuario',
    email: 'Email', name: 'Nombre', role: 'Rol', status: 'Estado',
    active: 'Activo', inactive: 'Inactivo',
    actions: 'Acciones', editUser: 'Editar',
    deactivate: 'Desactivar', activate: 'Activar',
    superadmin: 'Superadmin', admin: 'Admin', client: 'Cliente',
    createdAt: 'Creado',
    confirmDeactivate: '¿Desactivar este usuario?',
    confirmActivate: '¿Activar este usuario?',
    userCreated: 'Usuario creado exitosamente',
    password: 'Contraseña', cancel: 'Cancelar', create: 'Crear',
    search: 'Buscar usuarios...', allRoles: 'Todos los roles',
    filterRole: 'Filtrar por rol', noUsers: 'Sin usuarios',
  },
} as const;

export const usersEN = {
  users: {
    title: 'Users', createUser: 'Create user',
    email: 'Email', name: 'Name', role: 'Role', status: 'Status',
    active: 'Active', inactive: 'Inactive',
    actions: 'Actions', editUser: 'Edit',
    deactivate: 'Deactivate', activate: 'Activate',
    superadmin: 'Superadmin', admin: 'Admin', client: 'Client',
    createdAt: 'Created',
    confirmDeactivate: 'Deactivate this user?',
    confirmActivate: 'Activate this user?',
    userCreated: 'User created successfully',
    password: 'Password', cancel: 'Cancel', create: 'Create',
    search: 'Search users...', allRoles: 'All roles',
    filterRole: 'Filter by role', noUsers: 'No users',
  },
} as const;

export const usersTranslations: Record<Locale, typeof usersES> = { es: usersES, en: usersEN };
