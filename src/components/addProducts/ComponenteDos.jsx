import React, { useState, useEffect } from 'react';
// =================================================================================================
// IMPORTACIONES DE COMPONENTES UI5
// =================================================================================================
import {
  Card,
  CardHeader,
  Title,
  Text,
  Label,
  FlexBox,
  Input,
  Button,
  TextArea,
  FileUploader,
  Icon,
  ObjectStatus,
  Tag,
  Toast
} from "@ui5/webcomponents-react";
// =================================================================================================
// IMPORTACIONES DE UTILIDADES Y ESTILOS
// =================================================================================================
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
// La importación de ValueState desde la base es correcta
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState'; 
import '@ui5/webcomponents-icons/dist/attachment.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import * as yup from 'yup';

// =================================================================================================
// ESQUEMA DE VALIDACIÓN CON YUP
// =================================================================================================

const presentationValidationSchema = yup.object().shape({
  IdPresentaOK: yup.string()
    .required('El ID de la presentación es obligatorio.')
    .test('is-unique', 'Este ID de presentación ya existe.', function (value) {
      const { presentations } = this.options.context;
      return !presentations.some(p => p.IdPresentaOK === value);
    }),
  NOMBREPRESENTACION: yup.string()
    .required('El nombre de la presentación es obligatorio.')
    .min(3, 'El nombre debe tener al menos 3 caracteres.'),
  Descripcion: yup.string().required('La descripción es obligatoria.'),
});

// =================================================================================================
// ESTADO INICIAL PARA EL FORMULARIO DE NUEVA PRESENTACIÓN
// =================================================================================================

const initialPresentationState = {
  IdPresentaOK: '',
  Descripcion: '',
  // CostoIni: 0, // Eliminado para que no se envíe a la API
  NOMBREPRESENTACION: '',
  PropiedadesExtras: {}, // Se convertirá a string JSON al agregar
  files: [],
};

// =================================================================================================
// DEFINICIÓN DEL COMPONENTE
// =================================================================================================

const ComponenteDos = ({ presentations, setPresentations, productSKU }) => {
  // ===============================================================================================
  // ESTADOS DEL COMPONENTE
  // ===============================================================================================

  const [newPresentation, setNewPresentation] = useState(initialPresentationState);
  const [propKey, setPropKey] = useState('');
  const [propValue, setPropValue] = useState('');
  const [errors, setErrors] = useState({
    NOMBREPRESENTACION: 'Campo requerido',
    Descripcion: 'Campo requerido',
    IdPresentaOK: 'Campo requerido',
  });
  const [toast, setToast] = useState(null);

  // ===============================================================================================
  // EFECTOS (useEffect)
  // ===============================================================================================

  // Efecto para autogenerar el IdPresentaOK cuando cambia el nombre de la presentación
  useEffect(() => {
    if (newPresentation.NOMBREPRESENTACION && productSKU) {
      // Crea un slug a partir del nombre de la presentación
      const presentationSlug = newPresentation.NOMBREPRESENTACION
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '-') // Reemplaza espacios con guiones
        .replace(/[^A-Z0-9-]/g, ''); // Elimina caracteres no alfanuméricos excepto guiones

      const generatedId = `${productSKU}-${presentationSlug}`;
      const updatedPresentation = { ...newPresentation, IdPresentaOK: generatedId };
      setNewPresentation(updatedPresentation);
      validateField('IdPresentaOK', generatedId); // Validar el nuevo ID
    } else {
      // Si no hay nombre, se limpia el ID
      setNewPresentation(prev => ({ ...prev, IdPresentaOK: '' }));
    }
  }, [newPresentation.NOMBREPRESENTACION, productSKU, presentations]);

  // ===============================================================================================
  // MANEJADORES DE EVENTOS Y VALIDACIÓN
  // ===============================================================================================

  const validateField = async (field, value) => {
    try {
      await yup.reach(presentationValidationSchema, field).validate(value, { context: { presentations } });
      setErrors(prev => ({ ...prev, [field]: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [field]: err.message }));
    }
  };

  const handleInputChange = (e) => {
    const fieldName = e.target.name || e.target.id;
    const { value } = e.target;
    setNewPresentation(prev => ({ ...prev, [fieldName]: value }));
    validateField(fieldName, value);
  };

  // ===============================================================================================
  // MANEJADORES PARA PROPIEDADES EXTRAS
  // ===============================================================================================

  const handleAddProperty = () => {
    if (propKey.trim()) {
      setNewPresentation(prev => ({
        ...prev,
        PropiedadesExtras: { ...prev.PropiedadesExtras, [propKey]: propValue }
      }));
      setPropKey('');
      setPropValue('');
    }
  };

  const handleRemoveProperty = (keyToRemove) => {
    setNewPresentation(prev => {
      const newProps = { ...prev.PropiedadesExtras };
      delete newProps[keyToRemove];
      return { ...prev, PropiedadesExtras: newProps };
    });
  };

  // ===============================================================================================
  // MANEJADORES PARA ARCHIVOS
  // ===============================================================================================

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // El API espera el string completo con el prefijo data:
        const base64String = reader.result; 
        const newFile = {
          fileBase64: base64String,
          FILETYPE: file.type.startsWith('image/') ? 'IMG' : file.type === 'application/pdf' ? 'PDF' : 'OTHER',
          originalname: file.name,
          mimetype: file.type,
          PRINCIPAL: newPresentation.files.length === 0, // El primero es el principal
          INFOAD: `Archivo ${file.name}`
        };
        setNewPresentation(prev => ({ ...prev, files: [...prev.files, newFile] }));
      };
      reader.readAsDataURL(file);
    });
  };

  // ===============================================================================================
  // MANEJADORES PARA LA LISTA DE PRESENTACIONES
  // ===============================================================================================

  const handleAddPresentation = async () => {
    try {
      await presentationValidationSchema.validate(newPresentation, { abortEarly: false, context: { presentations } });
      
      const presentationToAdd = {
        ...newPresentation,
        PropiedadesExtras: JSON.stringify(newPresentation.PropiedadesExtras),
      };

      setPresentations(prev => [...prev, presentationToAdd]);
      setNewPresentation(initialPresentationState);
      setErrors({});
      setToast('Presentación añadida con éxito.');
    } catch (err) {
      const newErrors = {};
      err.inner.forEach(error => { newErrors[error.path] = error.message; });
      setErrors(newErrors);
    }
  };

  const removePresentation = (index) => {
    setPresentations(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (fileIndex) => {
    setNewPresentation(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== fileIndex)
    }));
  };

  // ===============================================================================================
  // LÓGICA DE VALIDACIÓN DEL FORMULARIO
  // ===============================================================================================

  const isFormValid =
    !!newPresentation.NOMBREPRESENTACION &&
    !!newPresentation.Descripcion &&
    Object.values(errors).every(error => error === null);

  // ===============================================================================================
  // RENDERIZADO DEL COMPONENTE (JSX)
  // ===============================================================================================

  return (
    <FlexBox style={{ width: '100%', gap: '1.5rem' }}>
      {/* Columna del Formulario */}
      <Card style={{ flex: 1, marginTop: '20px' }} header={<CardHeader titleText="Añadir Nueva Presentación" />}>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FlexBox direction="Column">
            <Label>ID Presentación (Autogenerado)</Label>
            <Input 
              name="IdPresentaOK"
              value={newPresentation.IdPresentaOK || ''} 
              readOnly
              placeholder="Se genera a partir del nombre" 
              valueState={errors.IdPresentaOK ? ValueState.Error : ValueState.None}
              valueStateMessage={<span>{errors.IdPresentaOK}</span>}
            />
          </FlexBox>
          <FlexBox direction="Column">
            <Label required>Nombre Presentación</Label>
            <Input
              name="NOMBREPRESENTACION"
              value={newPresentation.NOMBREPRESENTACION || ''}
              onInput={handleInputChange}
              placeholder="Ej: Color Rojo, Talla M"
              valueState={errors.NOMBREPRESENTACION ? ValueState.Error : ValueState.None}
              valueStateMessage={<span>{errors.NOMBREPRESENTACION}</span>}
            />
          </FlexBox>
          <FlexBox direction="Column">
            <Label required>Descripción</Label>
            <TextArea
              id="Descripcion"
              name="Descripcion"
              value={newPresentation.Descripcion}
              onInput={handleInputChange}
              placeholder="Una descripción detallada de esta variante del producto."
              valueState={errors.Descripcion ? ValueState.Error : ValueState.None}
              valueStateMessage={<span>{errors.Descripcion}</span>}
            />
          </FlexBox>

          <Title level="H5" style={{ marginTop: '1rem' }}>Propiedades Extras</Title>
          <FlexBox style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
            <FlexBox direction="Column" style={{ flex: 2 }}><Label>Propiedad</Label><Input value={propKey} onInput={(e) => setPropKey(e.target.value)} placeholder="Ej: Color" /></FlexBox>
            <FlexBox direction="Column" style={{ flex: 3 }}><Label>Valor</Label><Input value={propValue} onInput={(e) => setPropValue(e.target.value)} placeholder="Ej: Rojo" /></FlexBox>
            <Button icon="add" onClick={handleAddProperty} disabled={!propKey.trim()}>Añadir</Button>
          </FlexBox>
          <FlexBox wrap="Wrap" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
            {Object.entries(newPresentation.PropiedadesExtras).map(([key, value]) => (
              <Tag
                key={key}
                interactive
                onClick={() => handleRemoveProperty(key)}
                design="Neutral"
              >
                {key}: {value}
              </Tag>
            ))}
          </FlexBox>

          <Title level="H5" style={{ marginTop: '1rem' }}>Archivos</Title>
          <FileUploader multiple onChange={handleFileChange}><Button>Subir Archivos</Button></FileUploader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {newPresentation.files.map((file, index) => (
              <FlexBox key={index} alignItems="Center" justifyContent="SpaceBetween" style={{ background: '#f5f5f5', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                  <Icon name="attachment" />
                  <Text style={{ fontSize: '14px' }}>{file.originalname}</Text>
                </FlexBox>
                <Button icon="delete" design="Transparent" onClick={() => removeFile(index)} />
              </FlexBox>
            ))}
          </div>

          <Button design="Emphasized" onClick={handleAddPresentation} style={{ marginTop: '1rem' }} disabled={!isFormValid}>Añadir Presentación a la Lista</Button>
        </div>
      </Card>

      {/* Columna de la Lista */}
      <div style={{ flex: 1, marginTop: '20px', position: 'relative' }}>
        <Toast visible={!!toast} duration={3000} onClose={() => setToast(null)}>{toast}</Toast>
        <Card
          header={<CardHeader titleText="Lista de Presentaciones" subtitleText={`${presentations.length} añadidas`} />}
          style={{ height: '100%', overflowY: 'auto' }}
        >
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {presentations.length === 0 ? (
            <Text>Aún no has añadido ninguna presentación.</Text>
          ) : (
            <>
              {presentations.map((p, index) => (
                <Card key={p.IdPresentaOK || index}>
                  <CardHeader
                    titleText={p.NOMBREPRESENTACION}
                    subtitleText={`ID: ${p.IdPresentaOK}`}
                    action={<Button icon="delete" design="Transparent" onClick={() => removePresentation(index)} />}
                  />
                  <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{fontSize: '0.875rem'}}>{p.Descripcion}</Text>
                    <ObjectStatus state={ValueState.Indication01}>{p.files.length} archivos</ObjectStatus>
                  </div>
                </Card>
              ))}
            </>
          )}
          </div>
        </Card>
      </div>
    </FlexBox>
  );
};

export default ComponenteDos;