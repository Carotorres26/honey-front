// src/components/Specimens/MoveSpecimenForm.jsx
import React, { useState, useEffect } from "react";
import { Button, Form, FormGroup, Label, Input, Alert, Spinner, FormFeedback } from "reactstrap"; // Añadido Alert, Spinner, FormFeedback
// Asegúrate de que las rutas de API sean correctas
import { moveSpecimen } from "../../api/specimenApi";
import { getAllCategories } from "../../api/categoryApi"; // Cambiado de getCategories
import { getAllSedes } from "../../api/sedeApi"; // Cambiado de getVenues y su ruta

const MoveSpecimenForm = ({ specimen, onMoveSuccess, onCancel, initialSedeId, initialCategoryId }) => {
  const [categories, setCategories] = useState([]);
  const [sedes, setSedes] = useState([]); // Cambiado de venues a sedes
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSede, setSelectedSede] = useState(""); // Cambiado de selectedVenue a selectedSede

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(''); // Error general de la API
  const [fieldErrors, setFieldErrors] = useState({}); // { specimenCategoryId: "msg", sedeId: "msg" }
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    setApiError('');
    setFieldErrors({});
    const loadDropdowns = async () => {
        setLoadingDropdowns(true);
        try {
            // Obtener todas las categorías (activas por defecto, o todas si es necesario)
            const categoriesData = await getAllCategories(true); // true para incluir inactivas si se puede mover a una inactiva
            const sedesData = await getAllSedes();
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setSedes(Array.isArray(sedesData) ? sedesData : []);
        } catch (error) {
            console.error("Error loading data for move form:", error);
            setApiError("Error al cargar opciones para mover.");
        } finally {
            setLoadingDropdowns(false);
        }
    };
    loadDropdowns();
  }, []); // Cargar al montar

  const handleMove = async (event) => {
    event.preventDefault(); // Prevenir submit tradicional del form
    setApiError('');
    setFieldErrors({});

    // Validaciones básicas del cliente
    const currentCategoryStr = initialCategoryId?.toString() || '';
    const currentSedeStr = initialSedeId?.toString() || '';

    const newCategory = selectedCategory?.toString() || '';
    const newSede = selectedSede?.toString() || '';

    if (newCategory === "" && newSede === "") {
      setApiError("Debe seleccionar una nueva Categoría o una nueva Sede para mover el ejemplar.");
      return;
    }
    if (newCategory !== "" && newCategory === currentCategoryStr && newSede === "" ) {
        setApiError("El ejemplar ya está en la categoría seleccionada. Elija una diferente o una nueva sede.");
        return;
    }
    if (newSede !== "" && newSede === currentSedeStr && newCategory === "") {
        setApiError("El ejemplar ya está en la sede seleccionada. Elija una diferente o una nueva categoría.");
        return;
    }
    if (newCategory !== "" && newCategory === currentCategoryStr && newSede !== "" && newSede === currentSedeStr) {
        setApiError("El ejemplar ya está en la categoría y sede seleccionadas. Elija opciones diferentes.");
        return;
    }


    const moveData = {};
    // Solo añadir al payload si hay un valor y es diferente del inicial (o si el inicial era nulo/vacío)
    // La validación del backend 'validateDifferentEntity' es más robusta.
    if (selectedCategory) moveData.specimenCategoryId = parseInt(selectedCategory, 10);
    if (selectedSede) moveData.sedeId = parseInt(selectedSede, 10);

    // Si el usuario selecciona la opción "-- Selecciona --" (string vacío) para quitar la asociación
    // (solo si los campos son allowNull:true en el backend)
    if (selectedCategory === "") moveData.specimenCategoryId = null; // Backend debe manejar null
    if (selectedSede === "") moveData.sedeId = null; // Backend debe manejar null


    setIsLoading(true);
    try {
      // specimenId viene del prop 'specimen'
      await moveSpecimen(specimen.id, moveData);
      // alert("Ejemplar movido exitosamente."); // Mejor usar una notificación no bloqueante
      if (onMoveSuccess && typeof onMoveSuccess === 'function') {
        onMoveSuccess();
      }
    } catch (error) {
      console.error("Error al mover el ejemplar:", error);
      if (error.errors && Array.isArray(error.errors)) {
        const newFieldErrors = {};
        error.errors.forEach(err => {
          newFieldErrors[err.path] = err.msg; // path será 'specimenCategoryId' o 'sedeId'
        });
        setFieldErrors(newFieldErrors);
        setApiError("Por favor, corrija los errores."); // Mensaje general
      } else {
        setApiError(error.message || "Error desconocido al mover el ejemplar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // El <Form> es necesario aquí porque el botón de submit está dentro
    <Form onSubmit={handleMove}>
        {apiError && !Object.keys(fieldErrors).length && <Alert color="danger" className="mb-3">{apiError}</Alert>}

        <FormGroup>
            <Label for="categorySelectMove">Nueva Categoría</Label>
            <Input
            type="select"
            name="specimenCategoryId" // path para el error
            id="categorySelectMove"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isLoading || loadingDropdowns || categories.length === 0}
            invalid={!!fieldErrors.specimenCategoryId}
            >
            <option value="">-- Mantener actual / Sin categoría --</option>
            {categories.map((cat) => (
                // No mostrar la categoría actual del espécimen como una opción para "mover a"
                // a menos que se permita deseleccionar para quitar la categoría (si allowNull es true)
                // O mostrarla pero con validación si es la misma.
                // El backend ya valida si es la misma, así que aquí las mostramos todas.
                <option key={cat.id} value={cat.id} disabled={cat.id.toString() === initialCategoryId?.toString() && selectedSede === (initialSedeId?.toString() || "")}>
                    {cat.name} {cat.id.toString() === initialCategoryId?.toString() ? '(Actual)' : ''}
                </option>
            ))}
            </Input>
            {fieldErrors.specimenCategoryId && <FormFeedback>{fieldErrors.specimenCategoryId}</FormFeedback>}
            {initialCategoryId && <small className="text-muted d-block mt-1">Categoría actual: {categories.find(c=>c.id.toString() === initialCategoryId.toString())?.name || 'N/A'}</small>}
        </FormGroup>

        <FormGroup>
            <Label for="sedeSelectMove">Nueva Sede</Label>
            <Input
            type="select"
            name="sedeId" // path para el error
            id="sedeSelectMove"
            value={selectedSede}
            onChange={(e) => setSelectedSede(e.target.value)}
            disabled={isLoading || loadingDropdowns || sedes.length === 0}
            invalid={!!fieldErrors.sedeId}
            >
            <option value="">-- Mantener actual / Sin sede --</option>
            {sedes.map((sede) => ( // Cambiado de venue a sede
                <option key={sede.id} value={sede.id} disabled={sede.id.toString() === initialSedeId?.toString() && selectedCategory === (initialCategoryId?.toString() || "")}>
                    {sede.NombreSede} {sede.id.toString() === initialSedeId?.toString() ? '(Actual)' : ''}
                </option>
            ))}
            </Input>
            {fieldErrors.sedeId && <FormFeedback>{fieldErrors.sedeId}</FormFeedback>}
            {initialSedeId && <small className="text-muted d-block mt-1">Sede actual: {sedes.find(s=>s.id.toString() === initialSedeId.toString())?.NombreSede || 'N/A'}</small>}
        </FormGroup>

        <div className="d-flex justify-content-end gap-2 mt-4">
            {onCancel && (
                 <Button color="secondary" type="button" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                 </Button>
            )}
            <Button color="primary" type="submit" disabled={isLoading || loadingDropdowns || (selectedCategory === "" && selectedSede === "")}>
                {isLoading ? <Spinner size="sm" className="me-1"/> : null}
                Mover Ejemplar
            </Button>
        </div>
    </Form>
  );
};

export default MoveSpecimenForm;