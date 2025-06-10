import React from "react";
import { Routes, Route } from "react-router-dom";
import Services from "../pages/Services";
import RolesPage from "../pages/RolesPage";
import CategoryPage from "../pages/CategoryPage";
import SpecimenPage from "../pages/SpecimenPage";
import ClientsPage from '../pages/ClientsPage';
import VenuesPage from '../pages/VenuesPage';
import Medicine from "../pages/Medicine";
import ContractsPage from "../pages/ContractsPage";
import Users from "../pages/Users";
import Pagos from "../pages/Pagos";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/services" element={<Services />} />
      <Route path="/roles" element={<RolesPage />} />
      <Route path="/categories" element={<CategoryPage />} />
      <Route path="/specimens" element={<SpecimenPage />} />
      <Route path="/clientes" element={<ClientsPage />} />
      <Route path="/sedes" element={<VenuesPage />} />
      <Route path="/medicines" element={<Medicine />} />
      <Route path="/contracts" element={<ContractsPage />} />
      <Route path="/users" element={<Users />} />
      <Route path="/pagos" element={<Pagos />} />
    </Routes>
  );
};

export default AppRouter;
