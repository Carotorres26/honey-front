// src/components/Roles/ViewRoleModal.jsx
import React from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge, ListGroup, ListGroupItem, Row, Col
} from 'reactstrap';
// *** Importa modules Y moduleNameMap ***
import { modules, moduleNameMap } from "./rolesConstants";

const ViewRoleModal = ({ isOpen, toggle, role }) => {
  if (!role) return null;

  const roleId = role.id || role._id;
  const roleName = role.name || 'Rol sin nombre';
  // role.permissions DEBE ser el array de nombres de permiso reales (ej. 'acceso_roles')
  const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="md" centered>
      <ModalHeader toggle={toggle} className="bg-light">
        Detalles del Rol: <span className='fw-bold'>{roleName}</span>
      </ModalHeader>
      <ModalBody className="p-4">
        {/* ... ID y Nombre ... */}
        <Row className="mb-3"><Col sm={3} className="fw-bold">ID:</Col><Col sm={9}>{roleId}</Col></Row>
        <Row className="mb-3"><Col sm={3} className="fw-bold">Nombre:</Col><Col sm={9}>{roleName}</Col></Row>
        <hr />

        <h5 className="mb-3">Permisos Asignados {/*({rolePermissions.length})*/}</h5>
        {modules && modules.length > 0 ? (
           <ListGroup flush style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {/* Itera sobre la lista de NOMBRES DE PERMISO ('modules') */}
              {modules.map((permissionName) => {
                 // Comprueba si el nombre de permiso está en los permisos del rol
                 const hasPermission = rolePermissions.includes(permissionName);
                 // Obtiene el nombre amigable para mostrar
                 const displayName = moduleNameMap[permissionName] || permissionName;

                 return (
                   <ListGroupItem key={permissionName} className="d-flex justify-content-between align-items-center ps-0 py-1">
                     {displayName} {/* Muestra nombre amigable */}
                     {hasPermission ? (
                        <Badge color="success" pill className="px-2">Permitido</Badge>
                      ) : (
                        <Badge color="light" text="secondary" pill className="px-2">No permitido</Badge>
                      )}
                   </ListGroupItem>
                 );
               })}
           </ListGroup>
        ) : (
           <p className="text-muted fst-italic">No hay módulos definidos en la aplicación.</p>
        )}
        {modules && modules.length > 0 && rolePermissions.length === 0 && (
             <p className="text-muted fst-italic mt-2">Este rol no tiene permisos específicos asignados.</p>
        )}
      </ModalBody>
      <ModalFooter className="border-top-0">
        <Button color="secondary" outline onClick={toggle}>Cerrar</Button>
      </ModalFooter>
    </Modal>
  );
};

export default ViewRoleModal;