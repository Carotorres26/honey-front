import React, { useState, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { Alert } from 'reactstrap';
import { searchSpecimensByName } from '../../api/specimenApi';

const SpecimenSelector = ({ onSpecimenSelect }) => {
  const [error, setError] = useState('');

  const loadOptions = useCallback(async (inputValue, callback) => {
    if (!inputValue || inputValue.trim().length < 1) {
      callback([]);
      return;
    }
    setError('');
    try {
      const specimensFound = await searchSpecimensByName(inputValue.trim());

      if (!Array.isArray(specimensFound)) {
        console.warn("API searchSpecimensByName no devolvió un array. Recibido:", specimensFound);
        setError('Respuesta inesperada del servidor al buscar especímenes.');
        callback([]);
        return;
      }

      const options = specimensFound
        .map(spec => {
          // Asegurarse de que el espécimen tiene las propiedades necesarias
          if (!spec || typeof spec.id === 'undefined' || typeof spec.name === 'undefined') {
            console.warn("Objeto espécimen inválido encontrado:", spec);
            return null; // Se filtrará más adelante
          }
          return {
            value: spec.id, // Usualmente el ID
            label: `${spec.name} `, // Mostrar nombre e ID
            // (ID: ${spec.id || spec._id || 'N/A'})
            specimen: spec, // Guardar el objeto completo
          };
        })
        .filter(Boolean); // Eliminar cualquier nulo si hubo especímenes inválidos

      callback(options);
    } catch (err) {
      console.error("Error buscando especímenes en SpecimenSelector:", err);
      setError(err?.response?.data?.message || err?.message || 'Error al buscar especímenes.');
      callback([]);
    }
  }, []);

  const handleChange = (selectedOption) => {
    onSpecimenSelect(selectedOption ? selectedOption.specimen : null);
  };

  // Estilos personalizados para AsyncSelect (opcional, para mejor UX)
  const customStyles = {
    input: (provided) => ({
      ...provided,
      minHeight: 'calc(1.5em + .5rem + 2px)', // Para que coincida con bsSize="sm" de reactstrap
      paddingTop: '.25rem',
      paddingBottom: '.25rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d', // Color de placeholder de Bootstrap
    }),
    // Puedes añadir más estilos si es necesario
  };

  return (
    <div className='mb-3'>
      <AsyncSelect
        inputId="specimen-search"
        instanceId="specimen-search-select" // Ayuda a evitar colisiones de ID si hay múltiples selectores
        cacheOptions
        defaultOptions // Puedes cargar algunas opciones por defecto si es útil
        loadOptions={loadOptions}
        onChange={handleChange}
        placeholder="Escribe nombre del ejemplar..."
        isClearable
        loadingMessage={() => 'Buscando...'}
        noOptionsMessage={({ inputValue }) =>
          !inputValue || inputValue.trim().length < 1
            ? 'Escribe al menos 1 caracter para buscar'
            : 'No se encontraron ejemplares'
        }
        styles={customStyles} // Aplicar estilos personalizados
        aria-label="Selector de espécimen"
      />
      {error && <Alert color="warning" className="mt-2 small">{error}</Alert>}
    </div>
  );
};

export default SpecimenSelector;