// src/context/ContractContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from "react";
import {
    getAllContracts,
    createContract,
    updateContract,
    deleteContract
} from "../api/contractApi"; // Asegúrate que la ruta sea correcta
import { useAuth } from './AuthContext'; // Asegúrate que la ruta sea correcta

const ContractContext = createContext(null);

export const useContracts = () => {
    const context = useContext(ContractContext);
    if (!context) {
        throw new Error("useContracts debe ser usado dentro de un ContractProvider");
    }
    return context;
};

export const ContractProvider = ({ children }) => {
  const [contratos, setContratos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const getFriendlyError = useCallback((err) => {
      return err?.response?.data?.message || err?.message || "Ocurrió un error procesando la solicitud de contratos.";
  }, []);

  const fetchContracts = useCallback(async () => {
    if (!isAuthenticated) {
      setContratos([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllContracts();
      setContratos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getFriendlyError(err));
      setContratos([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getFriendlyError]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true); // Propio isLoading de ContractContext refleja espera de Auth
      setContratos([]);
      setError(null);
      return;
    }

    if (isAuthenticated) {
      fetchContracts();
    } else {
      setContratos([]);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated, authLoading, fetchContracts]);

  const agregarNuevoContrato = useCallback(async (contratoData) => {
    if (!isAuthenticated) throw new Error("Usuario no autenticado.");
    setIsLoading(true);
    setError(null);
    try {
      const nuevoContrato = await createContract(contratoData);
      setContratos(prev => [...prev, nuevoContrato]);
      return nuevoContrato;
    } catch (err) {
      const friendlyMsg = getFriendlyError(err);
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  }, [getFriendlyError, isAuthenticated]);

  const actualizarContratoContext = useCallback(async (id, contratoData) => {
    if (!isAuthenticated) throw new Error("Usuario no autenticado.");
    const contractIdStr = id?.toString();
    if (!contractIdStr) throw new Error("ID de contrato inválido para actualizar.");

    setIsLoading(true);
    setError(null);
    try {
      const contratoActualizado = await updateContract(contractIdStr, contratoData);
      setContratos(prev =>
        prev.map(c => ((c.id || c._id)?.toString() === contractIdStr ? contratoActualizado : c))
      );
      return contratoActualizado;
    } catch (err) {
      const friendlyMsg = getFriendlyError(err);
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  }, [getFriendlyError, isAuthenticated]);

  const eliminarContratoContext = useCallback(async (id) => {
    if (!isAuthenticated) throw new Error("Usuario no autenticado.");
    const contractIdStr = id?.toString();
    if (!contractIdStr) throw new Error("ID de contrato inválido para eliminar.");

    setIsLoading(true);
    setError(null);
    try {
      await deleteContract(contractIdStr);
      setContratos(prev =>
        prev.filter(c => (c.id || c._id)?.toString() !== contractIdStr)
      );
    } catch (err) {
      const friendlyMsg = getFriendlyError(err);
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  }, [getFriendlyError, isAuthenticated]);

  const contextValue = useMemo(() => ({
    contratos,
    isLoading,
    error,
    cargarContratos: fetchContracts,
    agregarNuevoContrato,
    actualizarContratoContext,
    eliminarContratoContext
  }), [
    contratos, isLoading, error, fetchContracts,
    agregarNuevoContrato, actualizarContratoContext, eliminarContratoContext
  ]);

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  );
};