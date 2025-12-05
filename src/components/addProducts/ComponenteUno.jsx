import React, { useState, useEffect, useRef } from 'react';
// =================================================================================================
// IMPORTACIONES DE COMPONENTES UI5
// =================================================================================================
import {
  Card,
  CardHeader,
  FlexBox,
  Label,
  Input,
  Icon,
  Button,
  MessageStrip,
  MultiComboBox,
  MultiComboBoxItem,
  Option,
  Text,
  Select,
  Tag
} from '@ui5/webcomponents-react';
// =================================================================================================
// IMPORTACIONES DE UTILIDADES, APIs Y ESTILOS
// =================================================================================================
import '@ui5/webcomponents/dist/Assets.js';
import { unidadesDeMedida } from '../../utils/constants';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/document-text.js';
import '@ui5/webcomponents-icons/dist/bar-code.js';
import '@ui5/webcomponents-icons/dist/notes.js';
import '@ui5/webcomponents-icons/dist/tag.js';
import addProductApi from '../../api/addProductApi';
import * as yup from 'yup';

// =================================================================================================
// ESQUEMA DE VALIDACIÓN CON YUP
// =================================================================================================

const productValidationSchema = yup.object().shape({
  PRODUCTNAME: yup.string().required('El nombre del producto es obligatorio.').min(3, 'Debe tener al menos 3 caracteres.'),
  DESSKU: yup.string().required('La descripción es obligatoria.'),
  MARCA: yup.string().required('La marca es obligatoria.').min(2, 'La marca debe tener al menos 2 caracteres.'),
  IDUNIDADMEDIDA: yup.string().required('La unidad de medida es obligatoria.'),
  CATEGORIAS: yup.array().min(1, 'Debe seleccionar al menos una categoría.').required(),
});

// =================================================================================================
// DEFINICIÓN DEL COMPONENTE
// =================================================================================================
const ComponenteUno = ({ productData, setProductData }) => {
  // ===============================================================================================
  // ESTADOS Y REFERENCIAS DEL COMPONENTE
  // ===============================================================================================
  const [errors, setErrors] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const skuSuffixRef = useRef(null); // Para almacenar el sufijo único del SKU
  const barcodeRef = useRef(null); // Para almacenar el código de barras único
  // ===============================================================================================
  // FUNCIONES AUXILIARES (GENERADORES DE SKU Y CÓDIGO DE BARRAS)
  // ===============================================================================================

  const generateSku = (productName) => {
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      skuSuffixRef.current = null; // Reiniciar sufijo si no hay nombre de producto
      return '';
    }
 
    if (!skuSuffixRef.current) {
      // Generar y guardar el sufijo solo la primera vez que se escribe el nombre
      skuSuffixRef.current = Date.now().toString(36).toUpperCase();
    }
    const base = productName
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '') // Quitar caracteres especiales
      .trim()
      .replace(/\s+/g, '-'); // Reemplazar espacios con guiones

    return `${base.slice(0, 40)}-${skuSuffixRef.current}`;
  };

  const generateBarcode = (productName) => {
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      barcodeRef.current = null; // Reiniciar si no hay nombre
      return '';
    }

    if (!barcodeRef.current) {
      // Generar un código numérico de 13 dígitos basado en el tiempo
      barcodeRef.current = Date.now().toString().slice(0, 13);
    }
    return barcodeRef.current;
  };

  // ===============================================================================================
  // MANEJADORES DE EVENTOS Y VALIDACIÓN
  // ===============================================================================================

  const validateField = async (field, value) => {
    try {
      await yup.reach(productValidationSchema, field).validate(value);
      setErrors(prev => ({ ...prev, [field]: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [field]: err.message }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const field = name || e.target.id;
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
  };

  const handleSelectChange = (e) => {
    const selectedOption = e.detail.selectedOption;
    const value = selectedOption.dataset.value;
    setProductData(prev => ({
      ...prev,
      IDUNIDADMEDIDA: value
    }));
    validateField('IDUNIDADMEDIDA', value);
  };

  // ===============================================================================================
  // EFECTOS (useEffect)
  // ===============================================================================================

  useEffect(() => {
    setProductData(prev => ({
      ...prev,
      SKUID: generateSku(prev.PRODUCTNAME),
      BARCODE: generateBarcode(prev.PRODUCTNAME)
    }));
  }, [productData.PRODUCTNAME]);

  // Efecto para cargar las categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await addProductApi.getAllCategories();
        setAllCategories(categories);
      } catch (error) {
        console.error("Error al cargar categorías", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // ===============================================================================================
  // MANEJADORES DE CATEGORÍAS
  // ===============================================================================================

  const handleCategoryChange = (event) => {
    const selectedItems = event.detail.items;
    const selectedCategoryIds = selectedItems.map(item => item.dataset.catid);
    setProductData(prev => ({
      ...prev,
      CATEGORIAS: selectedCategoryIds
    }));
    validateField('CATEGORIAS', selectedCategoryIds);
  };

  const getCategoryNameById = (catId) => {
    const category = allCategories.find(cat => cat.CATID === catId);
    return category ? category.Nombre : catId;
  };

  // ===============================================================================================
  // RENDERIZADO DEL COMPONENTE (JSX)
  // ===============================================================================================

  return (
    <Card style={{ width: '100%', marginTop: '20px' }}
      header={
        <CardHeader
          titleText="Paso 1: Información del Producto Padre"
          subtitleText="Complete los datos básicos del producto"
        />
      }
    >
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Nombre del Producto */}
          <div>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Nombre del Producto</Label>
            <Input
              id="PRODUCTNAME"
              value={productData.PRODUCTNAME || ''}
              onInput={handleInputChange}
              placeholder="Ej: Taladro Inalámbrico 20V"
              valueState={errors.PRODUCTNAME ? 'Error' : 'None'}
              valueStateMessage={<span>{errors.PRODUCTNAME}</span>}
              style={{ width: '100%' }}
              icon={<Icon name="product" />}
            />
          </div>

          {/* SKU ID */}
          <div>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>SKU ID (Autogenerado)</Label>
            <Input
              id="SKUID"
              value={productData.SKUID || ''}
              readOnly
              placeholder="Se autogenera con el nombre"
              valueState={'None'}
              style={{ width: '100%' }}
            />
          </div>

          {/* Marca */}
          <div>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Marca</Label>
            <Input
              id="MARCA"
              value={productData.MARCA || ''}
              onInput={handleInputChange}
              placeholder="Ej: TechNova"
              valueState={errors.MARCA ? 'Error' : 'None'}
              valueStateMessage={<span>{errors.MARCA}</span>}
              style={{ width: '100%' }}
            />
          </div>

          {/* Descripción - ocupa 2 columnas */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Descripción</Label>
            <Input
              id="DESSKU"
              value={productData.DESSKU || ''}
              onInput={handleInputChange}
              placeholder="Descripción completa del producto"
              valueState={errors.DESSKU ? 'Error' : 'None'}
              valueStateMessage={<span>{errors.DESSKU}</span>}
              icon={<Icon name="document-text" />}
              style={{ width: '100%' }}
            />
          </div>

          {/* Unidad de Medida */}
          <div>
            <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>Unidad de Medida</Label>
            <Select
              valueState={errors.IDUNIDADMEDIDA ? 'Error' : 'None'}
              valueStateMessage={<span>{errors.IDUNIDADMEDIDA}</span>}
              style={{ width: '100%' }}
              onChange={handleSelectChange}
            >
              <Option selected={!productData.IDUNIDADMEDIDA} disabled value="">Seleccione una unidad</Option>
              {unidadesDeMedida.map((unidad) => (
                <Option 
                  key={unidad.value} 
                  data-value={unidad.value} 
                  selected={productData.IDUNIDADMEDIDA === unidad.value}
                >{unidad.text}</Option>
              ))}
            </Select>
          </div>

          {/* Código de Barras */}
          <div>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>Código de Barras (Autogenerado)</Label>
            <Input
              id="BARCODE"
              value={productData.BARCODE || ''}
              readOnly
              placeholder="Ej: 7501234567890"
              icon={<Icon name="bar-code" />}
              style={{ width: '100%' }}
            />
          </div>

          {/* Información Adicional */}
          <div>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>Información Adicional (Opcional)</Label>
            <Input
              id="INFOAD"
              value={productData.INFOAD || ''}
              onInput={handleInputChange}
              placeholder="Información extra sobre el producto"
              icon={<Icon name="notes" />}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Categorías */}
        <div style={{ marginTop: '2rem' }}>
          <Label required>Categorías</Label>
          <MultiComboBox
            style={{ width: '100%', marginTop: '0.5rem' }}
            placeholder={loadingCategories ? "Cargando categorías..." : "Seleccione categorías"}
            disabled={loadingCategories}
            valueState={errors.CATEGORIAS ? 'Error' : 'None'}
            valueStateMessage={<span>{errors.CATEGORIAS}</span>}
            onSelectionChange={handleCategoryChange}
            icon={<Icon name="tag" />}
          >
            {allCategories.map((cat) => (
              <MultiComboBoxItem key={cat.CATID} text={cat.Nombre} data-catid={cat.CATID} />
            ))}
          </MultiComboBox>

          <FlexBox wrap="Wrap" style={{ gap: '0.5rem' }}>
            {productData.CATEGORIAS?.length > 0 ? (
              productData.CATEGORIAS.map((catId, index) => (
                <Tag
                  key={index}
                  colorScheme="8"
                >
                  {getCategoryNameById(catId)}
                </Tag>
              ))
            ) : (
              <Text style={{ color: '#6a6d70', fontStyle: 'italic' }}>
                No hay categorías agregadas
              </Text>
            )}
          </FlexBox>
        </div>
      </div>
    </Card>
  );
};

export default ComponenteUno;