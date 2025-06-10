// src/components/Roles/rolesConstants.js

// Mapeo de nombres de permiso (backend) a nombres de módulo (frontend)
// La CLAVE es el nombre del permiso REAL de la DB para el acceso general al módulo.
// El VALOR es el texto que quieres mostrar en la interfaz.
export const moduleNameMap = {
  acceso_usuarios: "Usuarios",    
  acceso_roles: "Roles",
  acceso_clientes: "Clientes",
  acceso_servicios: "Servicios",
  acceso_sedes: "Sedes",
  acceso_categorias: "Categoría de Ejemplares", 
  acceso_contratos: "Contratos",
  acceso_pagos: "Pagos",
  acceso_medicina: "Medicina",
  acceso_ejemplares: "Ejemplares", 
  acceso_dashboard: "Dashboard"   
};

// Lista de los NOMBRES DE PERMISO que representan los módulos a mostrar en el form/view
// El orden aquí determinará el orden en la interfaz
export const modules = [
  'acceso_usuarios',
  'acceso_roles',
  'acceso_clientes',
  'acceso_servicios',
  'acceso_sedes',
  'acceso_categorias',
  'acceso_contratos',
  'acceso_pagos',
  'acceso_medicina',
  'acceso_ejemplares',
  'acceso_dashboard'
];

export const ITEMS_PER_PAGE = 5;