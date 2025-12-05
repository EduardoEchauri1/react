/*
 * =================================================================================
 * Componente: AdvancedFilters
 * Descripción: Filtros avanzados para selección de presentaciones en promociones
 * Autores: LAURA PANIAGUA, ALBERTO PARDO
 * =================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  FlexBox,
  Label,
  Input,
  DatePicker,
  CheckBox,
  Button,
  Text,
  Title,
  MessageStrip,
  MultiComboBox,
  MultiComboBoxItem,
  ComboBox,
  ComboBoxItem,
  ObjectStatus,
  BusyIndicator,
  Icon,
  Switch,
  Toast
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';
import categoryService from '../../api/categoryService';
import productPresentacionesService from '../../api/productPresentacionesService';
import preciosItemsService from '../../api/preciosItemsService';
import CustomDialog from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';

// Atajos para filtros de precio y fecha
const PRICE_SHORTCUTS = [
  { id: 'low', label: '$0 - $999', min: 0, max: 999 },
  { id: 'mid', label: '$1,000 - $4,999', min: 1000, max: 4999 },
  { id: 'high', label: '$5,000+', min: 5000, max: null }
];

const DATE_SHORTCUTS = [
  { id: 'today', label: 'Hoy' },
  { id: 'last7', label: 'Últimos 7 días' },
  { id: 'last30', label: 'Últimos 30 días' },
  { id: 'thisYear', label: 'Este año' }
];

const SORT_OPTIONS = [
  { id: 'default', label: 'Orden predeterminado' },
  { id: 'addedFirst', label: 'Primero ya agregados' },
  { id: 'notAddedFirst', label: 'Primero sin agregar' },
  { id: 'nameAsc', label: 'Nombre A-Z' },
  { id: 'nameDesc', label: 'Nombre Z-A' }
];


const AdvancedFilters = ({ 
  onFiltersChange, 
  initialFilters = {}, 
  preselectedProducts = new Set(), 
  lockedProducts = new Set(),
  preselectedPresentaciones = [],
  isOpen = false
}) => {
  const { dialogState, showAlert, showSuccess, showError, closeDialog } = useDialog();
  
  const [filters, setFilters] = useState({
    categorias: [],
    marcas: [],
    precioMin: '',
    precioMax: '',
    fechaIngresoDesde: '',
    fechaIngresoHasta: '',
    ...initialFilters
  });

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [showOnlyAdded, setShowOnlyAdded] = useState(false);
  const [showLockedProducts, setShowLockedProducts] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [isManagingSelection, setIsManagingSelection] = useState(false);
  const [productsToRemove, setProductsToRemove] = useState(new Set());
  const [presentacionesToRemove, setPresentacionesToRemove] = useState(new Set());
  
  // Selecciones temporales vs confirmadas
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectedPresentaciones, setSelectedPresentaciones] = useState(new Set());
  
  const [globalSelectedProducts, setGlobalSelectedProducts] = useState(new Set(preselectedProducts));
  const [globalSelectedPresentaciones, setGlobalSelectedPresentaciones] = useState(new Set());
  
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [productPresentaciones, setProductPresentaciones] = useState({});
  const [presentacionesPrecios, setPresentacionesPrecios] = useState({});
  const [lockedPresentaciones, setLockedPresentaciones] = useState(new Set());
  const [allPresentacionesCache, setAllPresentacionesCache] = useState(null);
  
  const [priceError, setPriceError] = useState('');
  
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(new Set());
      setSelectedPresentaciones(new Set());
      setGlobalSelectedProducts(new Set(preselectedProducts));
      
      const lockedPresentacionesIds = new Set(
        (preselectedPresentaciones || []).map(p => p.IdPresentaOK)
      );
      setGlobalSelectedPresentaciones(lockedPresentacionesIds);
      setLockedPresentaciones(lockedPresentacionesIds);
      
      setIsManagingSelection(false);
      setProductsToRemove(new Set());
      setPresentacionesToRemove(new Set());
      preselectedLoadedRef.current = false;
    }
  }, [isOpen]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, showOnlyAdded, sortBy]);

  useEffect(() => {
    if (preselectedProducts && preselectedProducts.size > 0) {
      setGlobalSelectedProducts(new Set(preselectedProducts));
    }
  }, []);
  
  const preselectedLoadedRef = useRef(false);
  
  // Carga las presentaciones preseleccionadas (modo edición)
  useEffect(() => {
    const loadPreselectedPresentaciones = async () => {
      if (!preselectedPresentaciones || preselectedPresentaciones.length === 0) {
        return;
      }
      
      if (preselectedLoadedRef.current) {
        return;
      }
      
      if (!allPresentacionesCache) {
        return;
      }
      
      try {
        const presentacionesPorSKU = {};
        const skuidsUnicos = new Set();
        const idsPresent = new Set();
        
        preselectedPresentaciones.forEach(pres => {
          if (pres && pres.SKUID && pres.IdPresentaOK) {
            skuidsUnicos.add(pres.SKUID);
            idsPresent.add(pres.IdPresentaOK);
            
            if (!presentacionesPorSKU[pres.SKUID]) {
              presentacionesPorSKU[pres.SKUID] = [];
            }
            const presentacionCompleta = {
              ...pres,
              ACTIVED: true,
              NOMBREPRESENTACION: pres.NOMBREPRESENTACION || pres.NombrePresentacion || 'Sin nombre'
            };
            presentacionesPorSKU[pres.SKUID].push(presentacionCompleta);
          }
        });

        setExpandedProducts(skuidsUnicos);
        setLockedPresentaciones(idsPresent);
        setGlobalSelectedPresentaciones(idsPresent);
        
        const todasLasPresentaciones = allPresentacionesCache;
        const presentacionesCombinadas = {};
        
        Array.from(skuidsUnicos).forEach(skuid => {
          presentacionesCombinadas[skuid] = [];
        });
        
        if (Array.isArray(todasLasPresentaciones)) {
          todasLasPresentaciones.forEach(p => {
            if (p && p.SKUID) {
              if (!presentacionesCombinadas[p.SKUID]) {
                presentacionesCombinadas[p.SKUID] = [];
              }
              presentacionesCombinadas[p.SKUID].push(p);
            }
          });
        }
        
        Object.keys(presentacionesPorSKU).forEach(skuid => {
          const presentacionesMap = new Map();
          
          presentacionesPorSKU[skuid].forEach(p => {
            presentacionesMap.set(p.IdPresentaOK, p);
          });
          
          if (presentacionesCombinadas[skuid]) {
            presentacionesCombinadas[skuid].forEach(p => {
              if (!presentacionesMap.has(p.IdPresentaOK)) {
                presentacionesMap.set(p.IdPresentaOK, p);
              }
            });
          }
          
          presentacionesCombinadas[skuid] = Array.from(presentacionesMap.values());
        });
        
        setProductPresentaciones(prev => ({ ...prev, ...presentacionesCombinadas }));
        preselectedLoadedRef.current = true;
      } catch (error) {
      }
    };

    loadPreselectedPresentaciones();
  }, [allPresentacionesCache, preselectedPresentaciones]);

  // Obtiene productos, categorías y presentaciones desde el servidor
  const loadData = async () => {
    if (productos.length > 0 && categorias.length > 0 && allPresentacionesCache) {
      return;
    }
    
    setLoading(true);
    
    try {
      const [productosResponse, categoriasResponse, presentacionesResponse] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
        productPresentacionesService.getAllPresentaciones()
      ]);

      const productosData = productosResponse?.value?.[0]?.data?.[0]?.dataRes ?? [];
      const categoriasData = categoriasResponse?.data?.[0]?.dataRes ?? [];

      const categoriasActivas = categoriasData.filter(cat => 
        cat.ACTIVED === true && cat.DELETED === false
      );
      const productosActivos = productosData.filter(p => p.ACTIVED && !p.DELETED);
      const marcasUnicas = [...new Set(
        productosActivos
          .filter(p => p.MARCA && p.MARCA.trim() !== '')
          .map(p => p.MARCA.trim())
      )];
      
      const marcasConConteo = marcasUnicas.map(marca => ({ 
        id: marca.toUpperCase().replace(/\s+/g, '_'), 
        name: marca,
        productos: productosActivos.filter(p => p.MARCA === marca).length
      }));

      setProductos(productosData);
      setCategorias(categoriasActivas);
      setMarcas(marcasConConteo);
      
      const todasLasPresentaciones = presentacionesResponse || [];
      setAllPresentacionesCache(todasLasPresentaciones);
      
      try {
        const todosLosPrecios = await preciosItemsService.getAllPrices();
        const preciosIndexados = {};
        if (Array.isArray(todosLosPrecios)) {
          todosLosPrecios.forEach(precio => {
            if (precio && precio.IdPresentaOK) {
              if (!preciosIndexados[precio.IdPresentaOK]) {
                preciosIndexados[precio.IdPresentaOK] = [];
              }
              preciosIndexados[precio.IdPresentaOK].push(precio);
            }
          });
        }
        
        setPresentacionesPrecios(preciosIndexados);
      } catch (error) {
        console.error('Error cargando todos los precios:', error);
      }
      
      const presentacionesPorSKU = {};
      if (Array.isArray(todasLasPresentaciones)) {
        todasLasPresentaciones.forEach(p => {
          if (p && p.SKUID) {
            if (!presentacionesPorSKU[p.SKUID]) {
              presentacionesPorSKU[p.SKUID] = [];
            }
            presentacionesPorSKU[p.SKUID].push(p);
          }
        });
      }
      setProductPresentaciones(presentacionesPorSKU);

    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    
    if (filterKey === 'precioMin' || filterKey === 'precioMax') {
      validatePriceRange(
        filterKey === 'precioMin' ? value : filters.precioMin,
        filterKey === 'precioMax' ? value : filters.precioMax
      );
    }
  };
  
  const validatePriceRange = (min, max) => {
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);
    
    if (min && max && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      setPriceError('El precio mínimo no puede ser mayor que el máximo');
      return false;
    }
    
    setPriceError('');
    return true;
  };
  
  const applyPriceShortcut = (shortcut) => {
    setFilters(prev => ({
      ...prev,
      precioMin: shortcut.min.toString(),
      precioMax: shortcut.max ? shortcut.max.toString() : ''
    }));
    setPriceError('');
  };
  
  const applyDateShortcut = (shortcutId) => {
    const today = new Date();
    let desde, hasta;
    
    switch (shortcutId) {
      case 'today':
        desde = hasta = today.toISOString().split('T')[0];
        break;
      case 'last7':
        desde = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        hasta = new Date().toISOString().split('T')[0];
        break;
      case 'last30':
        desde = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        hasta = new Date().toISOString().split('T')[0];
        break;
      case 'thisYear':
        desde = `${new Date().getFullYear()}-01-01`;
        hasta = new Date().toISOString().split('T')[0];
        break;
      default:
        return;
    }
    
    setFilters(prev => ({
      ...prev,
      fechaIngresoDesde: desde,
      fechaIngresoHasta: hasta
    }));
  };

  const handleMultiSelectChange = (filterKey, selectedItems) => {
    const values = selectedItems.map(item => item.getAttribute('data-value'));
    handleFilterChange(filterKey, values);
  };

  const clearAllFilters = () => {
    setFilters({
      categorias: [],
      marcas: [],
      precioMin: '',
      precioMax: '',
      fechaIngresoDesde: '',
      fechaIngresoHasta: '',
    });
    setSearchTerm('');
    setPriceError('');
    setSelectedProducts(new Set());
    setSelectedPresentaciones(new Set());
  };
  
  const removeFilter = (filterKey, value) => {
    if (filterKey === 'categorias' || filterKey === 'marcas') {
      setFilters(prev => ({
        ...prev,
        [filterKey]: prev[filterKey].filter(v => v !== value)
      }));
    } else if (filterKey === 'precio') {
      setFilters(prev => ({
        ...prev,
        precioMin: '',
        precioMax: ''
      }));
      setPriceError('');
    } else if (filterKey === 'fecha') {
      setFilters(prev => ({
        ...prev,
        fechaIngresoDesde: '',
        fechaIngresoHasta: ''
      }));
    } else if (filterKey === 'busqueda') {
      setSearchTerm('');
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categorias.length > 0) count++;
    if (filters.marcas.length > 0) count++;
    if (filters.temporada) count++;
    if (filters.precioMin || filters.precioMax) count++;
    if (filters.fechaIngresoDesde || filters.fechaIngresoHasta) count++;
    if (searchTerm) count++;
    return count;
  };
  
  const getActiveFiltersChips = () => {
    const chips = [];
    filters.categorias.forEach(catId => {
      const categoria = categorias.find(c => c.CATID === catId);
      if (categoria) {
        chips.push({
          key: `cat-${catId}`,
          label: `Categoría: ${categoria.Nombre}`,
          filterKey: 'categorias',
          value: catId
        });
      }
    });
    
    filters.marcas.forEach(marcaNombre => {
      chips.push({
        key: `marca-${marcaNombre}`,
        label: `Marca: ${marcaNombre}`,
        filterKey: 'marcas',
        value: marcaNombre
      });
    });
    
    if (filters.precioMin || filters.precioMax) {
      const minLabel = filters.precioMin || '0';
      const maxLabel = filters.precioMax || '∞';
      chips.push({
        key: 'precio',
        label: `Precio: $${minLabel} - $${maxLabel}`,
        filterKey: 'precio'
      });
    }
    
    if (filters.fechaIngresoDesde || filters.fechaIngresoHasta) {
      const desde = filters.fechaIngresoDesde ? new Date(filters.fechaIngresoDesde).toLocaleDateString() : '...';
      const hasta = filters.fechaIngresoHasta ? new Date(filters.fechaIngresoHasta).toLocaleDateString() : '...';
      chips.push({
        key: 'fecha',
        label: `Fecha: ${desde} - ${hasta}`,
        filterKey: 'fecha'
      });
    }
    
    if (searchTerm) {
      chips.push({
        key: 'busqueda',
        label: `Búsqueda: "${searchTerm}"`,
        filterKey: 'busqueda'
      });
    }
    
    return chips;
  };

  const getFilteredProducts = () => {
    if (productos.length === 0) return [];
    
    let filtered = productos.filter(producto => {
      if (!producto.ACTIVED || producto.DELETED) {
        return false;
      }
      
      // Filtrar productos bloqueados si showLockedProducts está desactivado
      if (!showLockedProducts && lockedProducts.has(producto.SKUID)) {
        // Verificar si tiene al menos una presentación NO bloqueada
        const presentaciones = productPresentaciones[producto.SKUID] || [];
        const tienePresNoBloqueda = presentaciones.some(p => 
          p.ACTIVED && !lockedPresentaciones.has(p.IdPresentaOK)
        );
        
        // Si no tiene ninguna presentación no bloqueada, ocultar el producto
        if (!tienePresNoBloqueda) {
          return false;
        }
      }
      
      if (showOnlyAdded) {
        // Mostrar solo productos agregados temporalmente (no los bloqueados originales)
        const isAddedTemporarily = globalSelectedProducts.has(producto.SKUID) && !lockedProducts.has(producto.SKUID);
        if (!isAddedTemporarily) {
          return false;
        }
      }
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          producto.PRODUCTNAME?.toLowerCase().includes(searchLower) ||
          producto.SKUID?.toLowerCase().includes(searchLower) ||
          producto.MARCA?.toLowerCase().includes(searchLower) ||
          producto.CATEGORIAS?.some(cat => cat.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }
      
      if (filters.marcas.length > 0) {
        if (!filters.marcas.includes(producto.MARCA)) return false;
      }
      
      if (filters.categorias.length > 0) {
        if (producto.CATEGORIAS && Array.isArray(producto.CATEGORIAS)) {
          const hasCategory = producto.CATEGORIAS.some(cat => filters.categorias.includes(cat));
          if (!hasCategory) return false;
        }
      }
      
      if (filters.precioMin && producto.PRECIO < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && producto.PRECIO > parseFloat(filters.precioMax)) return false;
      
      if (filters.fechaIngresoDesde) {
        const fechaDesde = new Date(filters.fechaIngresoDesde);
        const fechaProducto = new Date(producto.REGDATE);
        if (fechaProducto < fechaDesde) return false;
      }
      
      if (filters.fechaIngresoHasta) {
        const fechaHasta = new Date(filters.fechaIngresoHasta);
        const fechaProducto = new Date(producto.REGDATE);
        if (fechaProducto > fechaHasta) return false;
      }
      
      return true;
    });
    
    switch (sortBy) {
      case 'addedFirst':
        filtered.sort((a, b) => {
          const aIsAdded = globalSelectedProducts.has(a.SKUID) || lockedProducts.has(a.SKUID);
          const bIsAdded = globalSelectedProducts.has(b.SKUID) || lockedProducts.has(b.SKUID);
          if (aIsAdded && !bIsAdded) return -1;
          if (!aIsAdded && bIsAdded) return 1;
          return 0;
        });
        break;
      case 'notAddedFirst':
        filtered.sort((a, b) => {
          const aIsAdded = globalSelectedProducts.has(a.SKUID) || lockedProducts.has(a.SKUID);
          const bIsAdded = globalSelectedProducts.has(b.SKUID) || lockedProducts.has(b.SKUID);
          if (!aIsAdded && bIsAdded) return -1;
          if (aIsAdded && !bIsAdded) return 1;
          return 0;
        });
        break;
      case 'nameAsc':
        filtered.sort((a, b) => (a.PRODUCTNAME || '').localeCompare(b.PRODUCTNAME || ''));
        break;
      case 'nameDesc':
        filtered.sort((a, b) => (b.PRODUCTNAME || '').localeCompare(a.PRODUCTNAME || ''));
        break;
      case 'default':
      default:
        break;
    }
    
    if (isManagingSelection) {
      filtered = filtered.filter(producto => 
        globalSelectedProducts.has(producto.SKUID)
      );
    }
    
    return filtered;
  };

  const getPaginatedProducts = () => {
    const allFiltered = getFilteredProducts();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allFiltered.slice(startIndex, endIndex);
  };
  
  const getPaginationInfo = () => {
    const total = getFilteredProducts().length;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, total);
    
    return {
      total,
      totalPages,
      startItem,
      endItem,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  };

  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <strong key={index} style={{ backgroundColor: '#fff3cd', fontWeight: '700' }}>{part}</strong> : 
        part
    );
  };

  // Selecciona/deselecciona un producto y sus presentaciones activas
  const toggleProductSelection = (productId) => {
    if (lockedProducts.has(productId)) {
      return;
    }
    
    // Si el producto está en global
    if (globalSelectedProducts.has(productId)) {
      // Solo permitir modificar si está en modo gestión
      if (isManagingSelection) {
        toggleProductToRemove(productId);
      }
      return;
    }
    
    const isCurrentlySelected = selectedProducts.has(productId);
    
    if (!isCurrentlySelected) {
      const presentaciones = productPresentaciones[productId] || [];
      const presentacionesActivas = presentaciones.filter(p => 
        p.ACTIVED && 
        !lockedPresentaciones.has(p.IdPresentaOK) &&
        !globalSelectedPresentaciones.has(p.IdPresentaOK)
      );
      
      if (presentacionesActivas.length === 0) {
        if (presentaciones.length === 0) {
          showAlert(
            'Sin presentaciones',
            `El producto ${productId} no tiene presentaciones disponibles. No se puede agregar a la promoción.`
          );
        } else {
          showAlert(
            'Sin presentaciones activas',
            `El producto ${productId} tiene ${presentaciones.length} presentación(es), pero ninguna está activa. Active al menos una presentación antes de agregarla a la promoción.`
          );
        }
        return;
      }
      
      setSelectedProducts(prev => {
        const newSelection = new Set(prev);
        newSelection.add(productId);
        return newSelection;
      });
      
      setSelectedPresentaciones(prev => {
        const newSel = new Set(prev);
        presentacionesActivas.forEach(p => newSel.add(p.IdPresentaOK));
        return newSel;
      });
    } else {
      setSelectedProducts(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(productId);
        return newSelection;
      });
      const presentaciones = productPresentaciones[productId] || [];
      setSelectedPresentaciones(prev => {
        const newSel = new Set(prev);
        presentaciones.forEach(p => {
          if (!lockedPresentaciones.has(p.IdPresentaOK) && 
              !globalSelectedPresentaciones.has(p.IdPresentaOK)) {
            newSel.delete(p.IdPresentaOK);
          }
        });
        return newSel;
      });
    }
  };

  const selectAllProducts = () => {
    const allProductIds = getFilteredProducts().map(p => p.SKUID);
    const newSelection = new Set([...selectedProducts]);
    const newPresentaciones = new Set([...selectedPresentaciones]);
    let countWithoutPresentaciones = 0;
    let countAdded = 0;
    
    allProductIds.forEach(skuid => {
      if (!globalSelectedProducts.has(skuid) && !lockedProducts.has(skuid)) {
        const presentaciones = productPresentaciones[skuid] || [];
        const activePresentaciones = presentaciones.filter(p => 
          p.ACTIVED && 
          !globalSelectedPresentaciones.has(p.IdPresentaOK) &&
          !lockedPresentaciones.has(p.IdPresentaOK)
        );
        
        if (activePresentaciones.length > 0) {
          newSelection.add(skuid);
          activePresentaciones.forEach(p => newPresentaciones.add(p.IdPresentaOK));
          countAdded++;
        } else {
          countWithoutPresentaciones++;
        }
      }
    });
    
    setSelectedProducts(newSelection);
    setSelectedPresentaciones(newPresentaciones);
    
    if (countWithoutPresentaciones > 0) {
      showAlert(
        'Algunos productos omitidos',
        `${countAdded} producto(s) seleccionado(s). ${countWithoutPresentaciones} producto(s) omitido(s) por no tener presentaciones activas.`
      );
    }
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
    setSelectedPresentaciones(new Set());
  };
  
  // Confirma la selección temporal y la mueve a la selección global
  const addToGlobalSelection = () => {
    if (selectedPresentaciones.size === 0) {
      showAlert('Selección vacía', 'No hay presentaciones seleccionadas para agregar');
      return;
    }
    
    setGlobalSelectedProducts(prev => {
      const newGlobal = new Set(prev);
      selectedProducts.forEach(skuid => newGlobal.add(skuid));
      return newGlobal;
    });
    
    setGlobalSelectedPresentaciones(prev => {
      const newGlobal = new Set(prev);
      selectedPresentaciones.forEach(idPres => newGlobal.add(idPres));
      return newGlobal;
    });
    
    const count = selectedPresentaciones.size;
    setSelectedProducts(new Set());
    setSelectedPresentaciones(new Set());
    
    const message = `Se agregaron ${count} presentación${count !== 1 ? 'es' : ''}`;
    setToastMessage(message);
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 10);
  };

  const removeFromGlobalSelection = (productId) => {
    if (lockedProducts.has(productId)) {
      showAlert('No se puede remover', 'Este producto ya está en la promoción y no se puede eliminar');
      return;
    }

    setGlobalSelectedProducts(prev => {
      const newGlobal = new Set(prev);
      newGlobal.delete(productId);
      return newGlobal;
    });

    const presentaciones = productPresentaciones[productId] || [];
    setGlobalSelectedPresentaciones(prev => {
      const newGlobal = new Set(prev);
      presentaciones.forEach(p => {
        if (!lockedPresentaciones.has(p.IdPresentaOK)) {
          newGlobal.delete(p.IdPresentaOK);
        }
      });
      return newGlobal;
    });
  };

  const removePresFromGlobalSelection = (presentacionId, productId) => {
    if (lockedPresentaciones.has(presentacionId)) {
      showAlert('No se puede remover', 'Esta presentación ya está en la promoción y no se puede eliminar');
      return;
    }

    setGlobalSelectedPresentaciones(prev => {
      const newGlobal = new Set(prev);
      newGlobal.delete(presentacionId);
      return newGlobal;
    });
    const presentaciones = productPresentaciones[productId] || [];
    const remainingSelected = presentaciones.filter(p => 
      globalSelectedPresentaciones.has(p.IdPresentaOK) && 
      p.IdPresentaOK !== presentacionId &&
      !lockedPresentaciones.has(p.IdPresentaOK)
    );

    if (remainingSelected.length === 0 && !lockedProducts.has(productId)) {
      setGlobalSelectedProducts(prev => {
        const newGlobal = new Set(prev);
        newGlobal.delete(productId);
        return newGlobal;
      });
    }
  };

  const toggleProductToRemove = (productId) => {
    setProductsToRemove(prev => {
      const newSet = new Set(prev);
      const presentaciones = productPresentaciones[productId] || [];
      
      if (newSet.has(productId)) {
        newSet.delete(productId);
        setPresentacionesToRemove(prevPres => {
          const newPreSet = new Set(prevPres);
          presentaciones.forEach(p => {
            if (globalSelectedPresentaciones.has(p.IdPresentaOK) && !lockedPresentaciones.has(p.IdPresentaOK)) {
              newPreSet.delete(p.IdPresentaOK);
            }
          });
          return newPreSet;
        });
      } else {
        newSet.add(productId);
        setPresentacionesToRemove(prevPres => {
          const newPreSet = new Set(prevPres);
          presentaciones.forEach(p => {
            if (globalSelectedPresentaciones.has(p.IdPresentaOK) && !lockedPresentaciones.has(p.IdPresentaOK)) {
              newPreSet.add(p.IdPresentaOK);
            }
          });
          return newPreSet;
        });
      }
      return newSet;
    });
  };

  const togglePresentacionToRemove = (presentacionId, productId) => {
    setPresentacionesToRemove(prev => {
      const newSet = new Set(prev);
      if (newSet.has(presentacionId)) {
        newSet.delete(presentacionId);
        setProductsToRemove(prevProds => {
          const newProds = new Set(prevProds);
          newProds.delete(productId);
          return newProds;
        });
      } else {
        newSet.add(presentacionId);
        
        const presentaciones = productPresentaciones[productId] || [];
        const presentacionesElegibles = presentaciones.filter(p => 
          globalSelectedPresentaciones.has(p.IdPresentaOK) && 
          !lockedPresentaciones.has(p.IdPresentaOK)
        );
        
        const todasSeleccionadas = presentacionesElegibles.every(p => 
          p.IdPresentaOK === presentacionId || newSet.has(p.IdPresentaOK)
        );
        
        if (todasSeleccionadas && presentacionesElegibles.length > 0) {
          setProductsToRemove(prevProds => {
            const newProds = new Set(prevProds);
            newProds.add(productId);
            return newProds;
          });
        }
      }
      return newSet;
    });
  };

  const selectAllToRemove = () => {
    const productsToSelect = new Set();
    const presentacionesToSelect = new Set();
    
    getFilteredProducts().forEach(producto => {
      if (globalSelectedProducts.has(producto.SKUID) && !lockedProducts.has(producto.SKUID)) {
        productsToSelect.add(producto.SKUID);
        
        const presentaciones = productPresentaciones[producto.SKUID] || [];
        presentaciones.forEach(p => {
          if (globalSelectedPresentaciones.has(p.IdPresentaOK) && !lockedPresentaciones.has(p.IdPresentaOK)) {
            presentacionesToSelect.add(p.IdPresentaOK);
          }
        });
      }
    });
    
    setProductsToRemove(productsToSelect);
    setPresentacionesToRemove(presentacionesToSelect);
  };

  const clearRemoveSelection = () => {
    setProductsToRemove(new Set());
    setPresentacionesToRemove(new Set());
  };

  const removeSelectedProducts = () => {
    if (productsToRemove.size === 0 && presentacionesToRemove.size === 0) return;
    
    let removedCount = 0;
    
    productsToRemove.forEach(skuid => {
      if (!lockedProducts.has(skuid)) {
        removeFromGlobalSelection(skuid);
        removedCount++;
      }
    });
    
    presentacionesToRemove.forEach(presentacionId => {
      if (!lockedPresentaciones.has(presentacionId)) {
        let productId = null;
        for (const [skuid, presentaciones] of Object.entries(productPresentaciones)) {
          if (presentaciones.some(p => p.IdPresentaOK === presentacionId)) {
            productId = skuid;
            break;
          }
        }
        
        if (productId && !productsToRemove.has(productId)) {
          removePresFromGlobalSelection(presentacionId, productId);
          removedCount++;
        }
      }
    });
    
    clearRemoveSelection();
    setIsManagingSelection(false);
    
    const message = `Se eliminaron ${removedCount} presentación${removedCount !== 1 ? 'es' : ''}`;
    setToastMessage(message);
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 10);
  };

  const toggleProductExpansion = (productId) => {
    const newExpanded = new Set(expandedProducts);
    
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);

    }
    
    setExpandedProducts(newExpanded);
  };

  const loadPresentaciones = async (skuid) => {
    return productPresentaciones[skuid] || [];
  };

  const togglePresentacionSelection = (presentacionId, skuid) => {
    if (lockedPresentaciones.has(presentacionId)) {
      return;
    }
    
    // Si la presentación está en global
    if (globalSelectedPresentaciones.has(presentacionId)) {
      // Solo permitir modificar si está en modo gestión
      if (isManagingSelection) {
        togglePresentacionToRemove(presentacionId, skuid);
      }
      return;
    }
    
    setSelectedPresentaciones(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(presentacionId)) {
        newSelection.delete(presentacionId);
        
        const presentaciones = productPresentaciones[skuid] || [];
        const remainingSelected = presentaciones.some(p => 
          p.IdPresentaOK !== presentacionId && newSelection.has(p.IdPresentaOK)
        );
        
        if (!remainingSelected) {
          setSelectedProducts(prevProducts => {
            const newProducts = new Set(prevProducts);
            newProducts.delete(skuid);
            return newProducts;
          });
        }
      } else {
        newSelection.add(presentacionId);
        
        setSelectedProducts(prevProducts => {
          const newProducts = new Set(prevProducts);
          newProducts.add(skuid);
          return newProducts;
        });
      }
      return newSelection;
    });
  };

  const getPrecioPresentacion = (idPresentaOK) => {
    const precios = presentacionesPrecios[idPresentaOK] || [];
    
    if (precios.length === 0) {
      return null;
    }
    
    const precioActivo = precios.find(p => p.ACTIVO === true) || precios[0];
    
    return precioActivo?.Precio || null;
  };

  // ===== NOTIFICAR AL PADRE LA SELECCIÓN GLOBAL =====
  const previousListRef = useRef([]);
  
  useEffect(() => {
    if (onFiltersChange && typeof onFiltersChange === 'function') {
      const selectedPresentacionesList = [];
      
      if (globalSelectedPresentaciones.size > 0) {
        globalSelectedPresentaciones.forEach(idPresentaOK => {
          let presentacionEncontrada = null;
          let skuidEncontrado = null;
          
          for (const [skuid, presentaciones] of Object.entries(productPresentaciones)) {
            if (Array.isArray(presentaciones)) {
              const found = presentaciones.find(p => p.IdPresentaOK === idPresentaOK);
              if (found) {
                presentacionEncontrada = found;
                skuidEncontrado = skuid;
                break;
              }
            }
          }
          
          if (presentacionEncontrada && !lockedPresentaciones.has(idPresentaOK)) {
            const producto = productos.find(p => p.SKUID === skuidEncontrado);
            const precio = getPrecioPresentacion(idPresentaOK);
            
            selectedPresentacionesList.push({
              ...presentacionEncontrada,
              Precio: precio,
              producto: producto ? {
                SKUID: producto.SKUID,
                PRODUCTNAME: producto.PRODUCTNAME,
                MARCA: producto.MARCA,
                PRECIO: producto.PRECIO
              } : null
            });
          }
        });
      }
      
      const currentIds = selectedPresentacionesList.map(p => p.IdPresentaOK).sort().join(',');
      const previousIds = previousListRef.current.map(p => p.IdPresentaOK).sort().join(',');
      
      if (currentIds !== previousIds) {
        previousListRef.current = selectedPresentacionesList;
        onFiltersChange(selectedPresentacionesList);
      }
    }
  }, [globalSelectedPresentaciones, productPresentaciones, productos, presentacionesPrecios, lockedPresentaciones]);


  // ========== RENDERIZADO DEL COMPONENTE ==========
  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        padding: '0.5rem',
        alignItems: 'flex-start',
        width: '100%',
        flexWrap: 'wrap'
      }}>
        {/* ========== COLUMNA IZQUIERDA: FILTROS ========== */}
        <Card style={{ 
          flex: '1 1 320px',
          minWidth: '280px',
          alignSelf: 'flex-start',
          maxHeight: '100vh',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e6ed',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className="filters-column"
        >
        <CardHeader
          titleText="Filtros Avanzados"
          subtitleText={loading ? 'Cargando datos...' : `${getActiveFiltersCount()} filtros activos`}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '8px 8px 0 0',
            flexShrink: 0,
          }}
          action={
            <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
              <Icon name="filter" style={{ fontSize: '1.2rem', color: 'white' }} />
              {getActiveFiltersCount() > 0 && (
                <ObjectStatus state="Success" style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {getActiveFiltersCount()} activos
                </ObjectStatus>
              )}
              <Button 
                design="Emphasized"
                icon="reset"
                onClick={clearAllFilters}
                disabled={getActiveFiltersCount() === 0}
              >
                Limpiar Filtros
              </Button>
            </FlexBox>
          }
        />

        <div style={{ 
          padding: '0.5rem',
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
          minHeight: 0
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
            {/* Chips de filtros activos */}
            {getActiveFiltersChips().length > 0 && (
              <div style={{ 
                marginBottom: '0.5rem', 
                padding: '0.4rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                border: '1px solid #90caf9'
              }}>
                <Label style={{ fontWeight: '600', marginBottom: '0.2rem', display: 'block', color: '#1976d2', fontSize: '0.75rem' }}>
                  Filtros aplicados:
                </Label>
                <FlexBox style={{ gap: '0.2rem', flexWrap: 'wrap' }}>
                  {getActiveFiltersChips().map(chip => (
                    <div
                      key={chip.key}
                      style={{ 
                        cursor: 'pointer', 
                        backgroundColor: '#2196f3', 
                        color: 'white',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '0.2rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                      onClick={() => removeFilter(chip.filterKey, chip.value)}
                    >
                      {chip.label} ✕
                    </div>
                  ))}
                </FlexBox>
              </div>
            )}
            
            {/* FILTROS POR CATEGORÍA Y MARCA - Grid responsivo */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '0.5rem',
              marginBottom: '0.25rem'
            }}>
              <div>
                <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Categorías:</Label>
                  {categorias.length > 0 ? (
                    <MultiComboBox
                      placeholder="Selecciona..."
                      style={{ width: '100%' }}
                      onSelectionChange={(e) => handleMultiSelectChange('categorias', e.detail.items)}
                    >
                      {categorias.map(categoria => (
                        <MultiComboBoxItem 
                          key={categoria.CATID} 
                          text={`${categoria.Nombre}`}
                          data-value={categoria.CATID}
                          selected={filters.categorias.includes(categoria.CATID)}
                        />
                      ))}
                    </MultiComboBox>
                  ) : (
                    <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                      {loading ? 'Cargando...' : 'No disponible'}
                    </Text>
                  )}
              </div>

              <div>
                <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Marcas:</Label>
                  {marcas.length > 0 ? (
                    <MultiComboBox
                      placeholder="Selecciona..."
                      style={{ width: '100%' }}
                      onSelectionChange={(e) => handleMultiSelectChange('marcas', e.detail.items)}
                    >
                      {marcas.map(marca => (
                        <MultiComboBoxItem 
                          key={marca.id} 
                          text={`${marca.name} (${marca.productos})`}
                          data-value={marca.name}
                          selected={filters.marcas.includes(marca.name)}
                        />
                      ))}
                    </MultiComboBox>
                  ) : (
                    <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                      {loading ? 'Cargando...' : 'No disponible'}
                    </Text>
                  )}
              </div>
            </div>

            {/* Rango de precios */}
            <div style={{ marginBottom: '0.25rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Rango de Precios:</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <Input
                    type="number"
                    placeholder="Precio Mínimo"
                    value={filters.precioMin}
                    onInput={(e) => handleFilterChange('precioMin', e.target.value)}
                    style={{ width: '100%' }}
                    valueState={priceError ? 'Error' : 'None'}
                  />
                </div>
                
                <div>
                  <Input
                    type="number"
                    placeholder="Precio Máximo"
                    value={filters.precioMax}
                    onInput={(e) => handleFilterChange('precioMax', e.target.value)}
                    style={{ width: '100%' }}
                    valueState={priceError ? 'Error' : 'None'}
                  />
                </div>
              </div>
              
              {priceError && (
                <Text style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {priceError}
                </Text>
              )}
              
              <div style={{ 
                marginTop: '0.5rem', 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem'
              }}>
                {PRICE_SHORTCUTS.map(shortcut => (
                  <Button
                    key={shortcut.id}
                    design="Transparent"
                    onClick={() => applyPriceShortcut(shortcut)}
                    style={{ 
                      fontSize: '0.6rem',
                      padding: '0.15rem 0.25rem',
                      border: '1px solid #e0e6ed',
                      borderRadius: '3px',
                      minHeight: 'auto',
                      height: '24px'
                    }}
                  >
                    {shortcut.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Fecha de ingreso */}
            <div style={{ marginBottom: '0.25rem' }}>
              <Label style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Fecha de Ingreso:</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <DatePicker
                  placeholder="Desde"
                  value={filters.fechaIngresoDesde}
                  onChange={(e) => handleFilterChange('fechaIngresoDesde', e.target.value)}
                  style={{ width: '100%' }}
                />
                <DatePicker
                  placeholder="Hasta"
                  value={filters.fechaIngresoHasta}
                  onChange={(e) => handleFilterChange('fechaIngresoHasta', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ 
                marginTop: '0.5rem', 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem'
              }}>
                {DATE_SHORTCUTS.map(shortcut => (
                  <Button
                    key={shortcut.id}
                    design="Transparent"
                    onClick={() => applyDateShortcut(shortcut.id)}
                    style={{ 
                      fontSize: '0.6rem',
                      padding: '0.15rem 0.25rem',
                      border: '1px solid #e0e6ed',
                      borderRadius: '3px',
                      minHeight: 'auto',
                      height: '24px'
                    }}
                  >
                    {shortcut.label}
                  </Button>
                ))}
              </div>
            </div>

          </div>
        </div>
        </Card>

      {/* ========== COLUMNA DERECHA: PRODUCTOS ENCONTRADOS ========== */}
      <Card style={{ 
        flex: '2 1 400px',
        minWidth: '300px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e0e6ed',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

          <div style={{ 
            padding: '0.5rem',
            overflowY: 'auto',
            overflowX: 'hidden',
            flex: 1,
            minHeight: 0
          }}>
            {loading ? (
              <FlexBox justifyContent="Center" style={{ padding: '2rem' }}>
                <BusyIndicator active size="Large" />
              </FlexBox>
            ) : (
              <>
                {/* Buscador */}
                <FlexBox direction="Column" style={{ 
                  padding: '0.5rem', 
                  backgroundColor: '#fff', 
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  border: '1px solid #e9ecef'
                }}>
                  <Label style={{ marginBottom: '0.35rem', fontWeight: '600', color: '#333', fontSize: '0.85rem' }}>
                    Buscar productos
                  </Label>
                  <Input
                    value={searchTerm}
                    onInput={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, SKU, marca o categoría..."
                    icon="search"
                    style={{ width: '100%' }}
                  />
                  {searchTerm && (
                    <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginTop: '0.35rem' }}>
                      <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                        {getFilteredProducts().length} resultado{getFilteredProducts().length !== 1 ? 's' : ''}
                      </Text>
                      <Button 
                        design="Transparent"
                        icon="decline"
                        onClick={() => setSearchTerm('')}
                        style={{ color: '#666', padding: '0.25rem' }}
                      >
                        Limpiar
                      </Button>
                    </FlexBox>
                  )}
                </FlexBox>
                
                {/* Controles de visualización y ordenamiento */}
                <FlexBox 
                  justifyContent="SpaceBetween" 
                  alignItems="Center"
                  style={{ 
                    padding: '0.4rem 0.6rem', 
                    backgroundColor: showOnlyAdded ? '#e8f5e9' : '#f8f9fa', 
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    border: showOnlyAdded ? '1px solid #4CAF50' : '1px solid #e9ecef',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FlexBox alignItems="Center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      <Switch
                        checked={showOnlyAdded}
                        onChange={(e) => setShowOnlyAdded(e.target.checked)}
                        tooltip="Mostrar solo productos ya agregados"
                      />
                      <Text style={{ fontSize: '0.8rem', color: showOnlyAdded ? '#2e7d32' : '#666', fontWeight: '500' }}>
                        Solo agregados {showOnlyAdded && globalSelectedProducts.size > 0 && `(${getFilteredProducts().length})`}
                      </Text>
                    </FlexBox>
                    {(lockedProducts.size > 0 || preselectedProducts.size > 0) && (
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                        <Switch
                          checked={showLockedProducts}
                          onChange={(e) => setShowLockedProducts(e.target.checked)}
                          tooltip="Mostrar/ocultar productos que ya están en la promoción"
                        />
                        <Text style={{ fontSize: '0.8rem', color: showLockedProducts ? '#f57c00' : '#666', fontWeight: '500' }}>
                          Incluidos en promoción ({Math.max(lockedProducts.size, preselectedProducts.size)})
                        </Text>
                      </FlexBox>
                    )}
                  </FlexBox>
                  
                  <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                    <Label style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap' }}>
                      Ordenar:
                    </Label>
                    <ComboBox
                      value={SORT_OPTIONS.find(opt => opt.id === sortBy)?.label || 'Orden predeterminado'}
                      onChange={(e) => {
                        const selected = SORT_OPTIONS.find(opt => opt.label === e.target.value);
                        if (selected) setSortBy(selected.id);
                      }}
                      style={{ minWidth: '180px', maxWidth: '200px' }}
                    >
                      {SORT_OPTIONS.map(option => (
                        <ComboBoxItem key={option.id} text={option.label} />
                      ))}
                    </ComboBox>
                  </FlexBox>
                  
                  {globalSelectedProducts.size > 0 && (
                    <Button
                      icon={isManagingSelection ? "accept" : "edit"}
                      design={isManagingSelection ? "Emphasized" : "Transparent"}
                      onClick={() => {
                        if (isManagingSelection) {
                          // Terminar gestión: aplicar cambios
                          removeSelectedProducts();
                        } else {
                          // Iniciar gestión
                          setIsManagingSelection(true);
                        }
                      }}
                      tooltip={isManagingSelection ? "Guardar cambios y terminar" : "Gestionar productos agregados"}
                      style={{ 
                        fontSize: '0.8rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: isManagingSelection ? '#4CAF50' : 'transparent',
                        color: isManagingSelection ? '#fff' : '#666'
                      }}
                    >
                      {isManagingSelection ? "Guardar cambios" : "Gestionar"}
                    </Button>
                  )}
                  {isManagingSelection && (
                    <Button
                      icon="decline"
                      design="Transparent"
                      onClick={() => {
                        clearRemoveSelection();
                        setIsManagingSelection(false);
                      }}
                      tooltip="Cancelar sin guardar cambios"
                      style={{ 
                        fontSize: '0.8rem',
                        padding: '0.3rem 0.6rem',
                        color: '#f44336'
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </FlexBox>

                {getFilteredProducts().length === 0 ? (
                  /* ===== ESTADO VACÍO ELEGANTE ===== */
                  <FlexBox 
                    direction="Column" 
                    justifyContent="Center" 
                    alignItems="Center"
                    style={{ 
                      padding: '3rem 2rem',
                      textAlign: 'center'
                    }}
                  >
                    <Icon 
                      name="search" 
                      style={{ 
                        fontSize: '4rem', 
                        color: '#ccc',
                        marginBottom: '1rem'
                      }} 
                    />
                    <Title level="H5" style={{ marginBottom: '0.5rem', color: '#666' }}>
                      No se encontraron productos
                    </Title>
                    <Text style={{ color: '#888', marginBottom: '1.5rem', maxWidth: '400px' }}>
                      {showOnlyAdded 
                        ? 'No hay productos agregados aún. Desactiva el filtro "Solo agregados" para ver todos los productos disponibles.' 
                        : getActiveFiltersCount() === 0 
                          ? 'Aplica filtros en el panel izquierdo para ver productos específicos' 
                          : 'Prueba con otros filtros o limpia la búsqueda para ver más resultados'
                      }
                    </Text>
                    <FlexBox style={{ gap: '0.5rem' }}>
                      {showOnlyAdded && (
                        <Button 
                          design="Emphasized"
                          icon="hide"
                          onClick={() => setShowOnlyAdded(false)}
                        >
                          Ver todos los productos
                        </Button>
                      )}
                      {searchTerm && (
                        <Button 
                          design="Emphasized"
                          icon="search"
                          onClick={() => setSearchTerm('')}
                        >
                          Limpiar búsqueda
                        </Button>
                      )}
                      {getActiveFiltersCount() > 0 && !showOnlyAdded && (
                        <Button 
                          design="Transparent"
                          icon="filter"
                          onClick={clearAllFilters}
                        >
                          Limpiar todos los filtros
                        </Button>
                      )}
                    </FlexBox>
                  </FlexBox>
                ) : (
                  <>
                    {/* Controles de selección masiva */}
                    <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ 
                      padding: '0.5rem 0.6rem', 
                      backgroundColor: isManagingSelection ? '#ffebee' : '#f8f9fa', 
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      border: isManagingSelection ? '1px solid #f44336' : '1px solid #e9ecef',
                    }}>
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem'}}>
                        <CheckBox 
                          checked={
                            getFilteredProducts().length > 0 &&
                            getFilteredProducts().every(p => 
                              selectedProducts.has(p.SKUID) || 
                              globalSelectedProducts.has(p.SKUID) ||
                              lockedProducts.has(p.SKUID)
                            )
                          }
                          indeterminate={
                            getFilteredProducts().some(p => 
                              selectedProducts.has(p.SKUID) || 
                              globalSelectedProducts.has(p.SKUID)
                            ) &&
                            !getFilteredProducts().every(p => 
                              selectedProducts.has(p.SKUID) || 
                              globalSelectedProducts.has(p.SKUID) ||
                              lockedProducts.has(p.SKUID)
                            )
                          }
                          onChange={(e) => {
                            if (isManagingSelection) {
                              if (e.target.checked) {
                                // Limpiar la selección de productos marcados para eliminar
                                clearRemoveSelection();
                              } else {
                                // Marcar todos los productos agregados visibles para eliminar
                                selectAllToRemove();
                              }
                            } else {
                              e.target.checked ? selectAllProducts() : deselectAllProducts();
                            }
                          }}
                          text={isManagingSelection 
                            ? (() => {
                                let totalPresentaciones = 0;
                                getFilteredProducts().forEach(p => {
                                  if (globalSelectedProducts.has(p.SKUID) && !lockedProducts.has(p.SKUID)) {
                                    const presentaciones = productPresentaciones[p.SKUID] || [];
                                    totalPresentaciones += presentaciones.filter(pres => 
                                      globalSelectedPresentaciones.has(pres.IdPresentaOK) && 
                                      !lockedPresentaciones.has(pres.IdPresentaOK)
                                    ).length;
                                  }
                                });
                                return `Seleccionar/deseleccionar todos (${totalPresentaciones})`;
                              })()
                            : (() => {
                                let totalPresentaciones = 0;
                                getFilteredProducts().forEach(p => {
                                  const presentaciones = productPresentaciones[p.SKUID] || [];
                                  totalPresentaciones += presentaciones.filter(pres => pres.ACTIVED).length;
                                });
                                return `Seleccionar todos (${totalPresentaciones})`;
                              })()
                          }
                          style={{ fontSize: '0.8rem' }}
                        />
                      </FlexBox>
                      <FlexBox alignItems="Center" style={{ gap: '0.5rem'}}>
                        <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                          {selectedPresentaciones.size} seleccionada(s)
                        </Text>
                        {selectedProducts.size > 0 && (
                          <>
                            <Button 
                              design="Transparent"
                              icon="reset"
                              onClick={deselectAllProducts}
                              style={{ color: '#666', padding: '0.25rem 0.5rem' }}
                            >
                              Limpiar
                            </Button>
                            <Button 
                              design="Emphasized"
                              icon="add"
                              onClick={addToGlobalSelection}
                              disabled={selectedPresentaciones.size === 0 || priceError}
                              style={{ padding: '0.25rem 0.75rem' }}
                            >
                              Agregar
                            </Button>
                          </>
                        )}
                      </FlexBox>
                    </FlexBox>

                <FlexBox direction="Column" style={{ 
                  gap: '0.5rem',
                }}>
                  {getPaginatedProducts().map(producto => {
                    const isLocked = lockedProducts.has(producto.SKUID);
                    const hasLockedPresentaciones = productPresentaciones[producto.SKUID]?.some(p => 
                      lockedPresentaciones.has(p.IdPresentaOK)
                    ) || false;
                    const isInGlobal = globalSelectedProducts.has(producto.SKUID);
                    const isAddedTemporarily = isInGlobal && !isLocked; // Agregado temporalmente (no bloqueado)
                    const isSelected = selectedProducts.has(producto.SKUID);
                    const isMarkedForRemoval = productsToRemove.has(producto.SKUID);
                    const isDisabled = isManagingSelection ? isLocked : (isLocked || isInGlobal);
                    
                    return (
                  <div key={producto.SKUID}>
                    <Card 
                      style={{ 
                        padding: '0.75rem',
                        border: isMarkedForRemoval ? '2px solid #f44336' : isSelected ? '2px solid #4CAF50' : isLocked ? '2px solid #9e9e9e' : isAddedTemporarily ? '2px solid #2196F3' : '1px solid #e8ecef',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        background: isMarkedForRemoval ? '#ffebee' : isSelected ? '#f0f9f1' : isLocked ? '#f5f5f5' : isAddedTemporarily ? '#e3f2fd' : '#ffffff',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        opacity: (isLocked || isMarkedForRemoval) ? 0.75 : 1,
                        cursor: isLocked ? 'not-allowed' : 'default'
                      }}
                    >
                      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ gap: '0.5rem' }}>
                        <FlexBox alignItems="Center" style={{ gap: '0.75rem', flex: 1, minWidth: 0 }}>
                          <CheckBox 
                            checked={isManagingSelection ? (isInGlobal && !isMarkedForRemoval) : (isSelected || isInGlobal || isLocked)}
                            disabled={isLocked || (!isManagingSelection && isInGlobal)}
                            onChange={() => {
                              if (!isLocked) {
                                toggleProductSelection(producto.SKUID);
                              }
                            }}
                            tooltip={
                              isLocked 
                                ? "Este producto está bloqueado" 
                                : isManagingSelection
                                  ? (isMarkedForRemoval ? "Click para mantener en la selección" : "Click para eliminar de la selección")
                                  : isInGlobal
                                    ? "Producto agregado. Activa 'Gestionar' para modificar"
                                    : (isSelected ? "Click para deseleccionar" : "Click para seleccionar")
                            }
                          />
                          <FlexBox direction="Column" style={{ flex: 1, minWidth: 0 }}>
                            <FlexBox alignItems="Center" style={{ gap: '0.5rem', marginBottom: '0.15rem' }}>
                              <Title level="H6" style={{ 
                                margin: 0, 
                                fontSize: '0.95rem', 
                                fontWeight: '600',
                                color: '#2c3e50',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                              }}>
                                {highlightMatch(producto.PRODUCTNAME || `Producto ${producto.SKUID}` || 'Producto sin nombre', searchTerm)}
                              </Title>
                              {isLocked && (
                                <ObjectStatus state="Warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', flexShrink: 0 }}>
                                  En promoción
                                </ObjectStatus>
                              )}
                              {isInGlobal && !isLocked && (
                                <ObjectStatus state="Information" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', flexShrink: 0 }}>
                                  Agregado
                                </ObjectStatus>
                              )}
                          </FlexBox>
                          <Text style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.15rem' }}>
                            SKU: {highlightMatch(producto.SKUID, searchTerm)} • Marca: {highlightMatch(producto.MARCA || 'Sin marca', searchTerm)}
                          </Text>
                          {producto.CATEGORIAS && producto.CATEGORIAS.length > 0 && (
                            <Text style={{ fontSize: '0.75rem', color: '#888' }}>
                              {producto.CATEGORIAS.slice(0, 2).join(', ')}
                            </Text>
                          )}
                        </FlexBox>
                        </FlexBox>
                        <FlexBox direction="Column" alignItems="End" style={{ gap: '0.15rem', flexShrink: 0 }}>
                          <Text style={{ fontSize: '0.7rem', color: '#666', whiteSpace: 'nowrap' }}>
                            {new Date(producto.REGDATE).toLocaleDateString()}
                          </Text>
                        </FlexBox>
                        <Button 
                          icon={expandedProducts.has(producto.SKUID) ? "navigation-up-arrow" : "navigation-down-arrow"}
                          design="Transparent"
                          onClick={() => toggleProductExpansion(producto.SKUID)}
                          style={{ flexShrink: 0 }}
                          tooltip={expandedProducts.has(producto.SKUID) ? "Ocultar presentaciones" : "Ver presentaciones"}
                        />
                      </FlexBox>
                    </Card>

                    {/* Presentaciones del producto */}
                    {expandedProducts.has(producto.SKUID) && (
                      <div style={{ 
                        marginLeft: '2rem', 
                        marginTop: '0.5rem',
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e0e6ed'
                      }}>
                        {(!productPresentaciones[producto.SKUID] || productPresentaciones[producto.SKUID].length === 0) ? (
                          <MessageStrip type="Information">
                            No hay presentaciones disponibles
                          </MessageStrip>
                        ) : (
                              <FlexBox direction="Column" style={{ gap: '0.35rem' }}>
                                {productPresentaciones[producto.SKUID]
                                  .filter(p => p.ACTIVED || lockedPresentaciones.has(p.IdPresentaOK) || globalSelectedPresentaciones.has(p.IdPresentaOK))
                                  .map(presentacion => {
                                    const isLocked = lockedPresentaciones.has(presentacion.IdPresentaOK);
                                    const isInGlobal = globalSelectedPresentaciones.has(presentacion.IdPresentaOK);
                                    const isAddedTemporarily = isInGlobal && !isLocked; // Agregada temporalmente (no bloqueada)
                                    const isSelectedTemp = selectedPresentaciones.has(presentacion.IdPresentaOK);
                                    
                                    return (
                                      <div key={presentacion.IdPresentaOK} style={{ 
                                        padding: '0.5rem',
                                        backgroundColor: presentacionesToRemove.has(presentacion.IdPresentaOK) ? '#ffebee' : isLocked ? '#f5f5f5' : isAddedTemporarily ? '#e3f2fd' : isSelectedTemp ? '#e8f5e9' : '#ffffff',
                                        border: presentacionesToRemove.has(presentacion.IdPresentaOK) ? '2px solid #f44336' : isLocked ? '2px solid #9e9e9e' : isAddedTemporarily ? '2px solid #2196F3' : isSelectedTemp ? '2px solid #4CAF50' : '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        opacity: (isLocked || presentacionesToRemove.has(presentacion.IdPresentaOK)) ? 0.75 : 1,
                                        cursor: isLocked ? 'not-allowed' : 'default'
                                      }}>
                                        <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                                          <FlexBox alignItems="Center" style={{ gap: '0.5rem', flex: 1 }}>
                                            <CheckBox 
                                              checked={isManagingSelection ? (isInGlobal && !presentacionesToRemove.has(presentacion.IdPresentaOK)) : (isLocked || isInGlobal || isSelectedTemp)}
                                              disabled={isLocked || (!isManagingSelection && isInGlobal)}
                                              onChange={() => {
                                                if (!isLocked) {
                                                  togglePresentacionSelection(presentacion.IdPresentaOK, producto.SKUID);
                                                }
                                              }}
                                              tooltip={
                                                isLocked
                                                  ? "Esta presentación está bloqueada"
                                                  : isManagingSelection
                                                    ? (presentacionesToRemove.has(presentacion.IdPresentaOK) ? "Click para mantener" : "Click para eliminar")
                                                    : isInGlobal
                                                      ? "Presentación agregada. Activa 'Gestionar' para modificar"
                                                      : (isSelectedTemp ? "Click para deseleccionar" : "Click para seleccionar")
                                              }
                                            />
                                            <FlexBox direction="Column" style={{ flex: 1 }}>
                                              <FlexBox alignItems="Center" style={{ gap: '0.3rem' }}>
                                                <Text style={{ fontWeight: '600', fontSize: '0.875rem', color: isDisabled ? '#757575' : '#2c3e50' }}>
                                                  {presentacion.NOMBREPRESENTACION || 'Sin nombre'}
                                                </Text>
                                                {isLocked && (
                                                  <ObjectStatus state="Warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                                    En promoción
                                                  </ObjectStatus>
                                                )}
                                                {isInGlobal && !isLocked && (
                                                  <ObjectStatus state="Information" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                                    Agregado
                                                  </ObjectStatus>
                                                )}
                                              </FlexBox>
                                              {presentacion.Descripcion && (
                                                <Text style={{ fontSize: '0.75rem', color: '#666' }}>
                                                  {presentacion.Descripcion}
                                                </Text>
                                              )}
                                            </FlexBox>
                                          </FlexBox>
                                          <FlexBox direction="Column" alignItems="End" style={{ gap: '0.25rem' }}>
                                            {(() => {
                                              const precio = getPrecioPresentacion(presentacion.IdPresentaOK);
                                              return precio ? (
                                                <ObjectStatus state="Success" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                                                  ${precio?.toLocaleString()}
                                                </ObjectStatus>
                                              ) : (
                                                <ObjectStatus state="Warning" style={{ fontSize: '0.75rem' }}>
                                                  Sin precio
                                                </ObjectStatus>
                                              );
                                            })()}
                                            {presentacion.CostoIni && (
                                              <Text style={{ fontSize: '0.7rem', color: '#888', textDecoration: 'line-through' }}>
                                                Costo: ${presentacion.CostoIni?.toLocaleString()}
                                              </Text>
                                            )}
                                          </FlexBox>
                                        </FlexBox>
                                      </div>
                                    );
                                  })}
                              </FlexBox>
                            )}
                      </div>
                    )}
                  </div>
                    );
                  })}
                </FlexBox>
                
                {/* ===== CONTROLES DE PAGINACIÓN ===== */}
                {getPaginationInfo().totalPages > 1 && (
                  <FlexBox 
                    justifyContent="SpaceBetween" 
                    alignItems="Center"
                    style={{ 
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <Button
                      icon="navigation-left-arrow"
                      design="Transparent"
                      disabled={!getPaginationInfo().hasPrev}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Anterior
                    </Button>
                    
                    <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                      <Text style={{ fontSize: '0.875rem', color: '#666' }}>
                        Mostrando {getPaginationInfo().startItem}–{getPaginationInfo().endItem} de {getPaginationInfo().total} productos
                      </Text>
                      <Text style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>
                        • Página {currentPage} de {getPaginationInfo().totalPages}
                      </Text>
                    </FlexBox>
                    
                    <Button
                      icon="navigation-right-arrow"
                      iconEnd
                      design="Transparent"
                      disabled={!getPaginationInfo().hasNext}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Siguiente
                    </Button>
                  </FlexBox>
                )}
                  </>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Diálogo personalizado */}
      <CustomDialog
        open={dialogState.open}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmDesign={dialogState.confirmDesign}
      />
      
      {/* Toast para notificaciones */}
      <Toast 
        open={toastOpen}
        onAfterClose={() => setToastOpen(false)}
      >
        {toastMessage}
      </Toast>

      {/* Estilos para hacer sticky solo en pantallas grandes */}
      <style>{`
        @media (min-width: 900px) {
          .filters-column {
            position: sticky !important;
            top: 0 !important;
            max-width: 400px !important;
          }
        }
        @media (max-width: 899px) {
          .filters-column {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdvancedFilters;