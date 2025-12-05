import React, { useState, useRef } from 'react';
import { Label, Popover } from '@ui5/webcomponents-react';

/**
 * SKUButton Component
 * Muestra un botón que al pasar el ratón abre un popover con:
 * - SKU ID
 * - Nombre del producto
 * - Presentaciones disponibles
 */
const SKUButton = ({ skuId, skusCount, skusList, productsData, onSkuClick }) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [popoverRef, setPopoverRef] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const closeTimeoutRef = useRef(null);
  
  const ITEMS_PER_PAGE = 10;

  /**
   * Obtiene el nombre descriptivo de una presentación
   * Busca en varios campos posibles
   */
  const getNombrePresentacion = (pres) => {
    if (!pres) return 'N/A';
    
    // Intentar obtener el nombre en orden de prioridad
    return (
      pres.NOMBREPRESENTACION?.trim() ||
      pres.DESPRESENTACION?.trim() ||
      pres.descripcion?.trim() ||
      pres.nombre?.trim() ||
      pres.NOMBRE?.trim() ||
      pres.DescripcionPresentacion?.trim() ||
      pres.desc?.trim() ||
      pres.description?.trim() ||
      pres.IdPresentaOK ||
      'N/A'
    );
  };

  const handleMouseEnter = (e) => {
    // Limpiar cualquier cierre pendiente
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setPopoverRef(e.currentTarget);
    setOpenPopover(true);
  };

  const handleMouseLeave = () => {
    // Esperar un poco antes de cerrar, para permitir que el usuario entre al popover
    closeTimeoutRef.current = setTimeout(() => {
      setOpenPopover(false);
      setCurrentPage(0); // Resetear página al cerrar
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    // Si el ratón entra al popover, limpiar el timeout de cierre
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    // Si el ratón sale del popover, cerrarlo
    setOpenPopover(false);
    setCurrentPage(0); // Resetear página al cerrar
  };

  return (
    <>
      <Label 
        ref={setPopoverRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          onSkuClick();
        }}
        style={{
          padding: '0.3rem 1.5rem',
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'inline-block',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: '1px solid #1976d2',
          whiteSpace: 'nowrap'
        }}
      >
        SKUs
      </Label>

      {openPopover && popoverRef && (
        <Popover
          open={openPopover}
          opener={popoverRef}
          placement="Bottom"
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          style={{
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            borderRadius: '4px',
            padding: '0.75rem',
            minWidth: '350px',
            maxHeight: '500px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Encabezado con contador */}
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Productos registrados</span>
            <span style={{ fontSize: '0.75rem', color: '#666', backgroundColor: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>
              {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, skusCount)} de {skusCount}
            </span>
          </div>
          
          {/* Contenedor de productos */}
          <div style={{ flex: 1, minHeight: '200px' }}>
            {Array.isArray(skusList) && skusList.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((sku, idx) => {
              // Buscar la información completa del producto
              const productInfo = productsData ? productsData[sku] : null;
              
              // Debug: mostrar estructura de presentaciones
              if (productInfo?.presentaciones && productInfo.presentaciones.length > 0) {
                console.log(`📦 Presentaciones para ${sku}:`, productInfo.presentaciones);
              }
              
              return (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '3px',
                    borderLeft: '3px solid #1976d2'
                  }}
                >
                  {/* SKU ID */}
                  <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                    <strong>SKU:</strong> {sku}
                  </div>
                  
                  {/* Nombre del producto */}
                  {productInfo?.PRODUCTNAME && (
                    <div style={{ fontSize: '0.8rem', color: '#333', marginBottom: '0.25rem', fontWeight: '500' }}>
                      <strong>Producto:</strong> {productInfo.PRODUCTNAME}
                    </div>
                  )}
                  
                  {/* Marca */}
                  {productInfo?.MARCA && (
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                      <strong>Marca:</strong> {productInfo.MARCA}
                    </div>
                  )}
                  
                  {/* Presentaciones */}
                  {productInfo?.presentaciones && Array.isArray(productInfo.presentaciones) && productInfo.presentaciones.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>
                      <strong>Presentaciones:</strong>
                      <div style={{ paddingLeft: '1rem', marginTop: '0.15rem' }}>
                        {productInfo.presentaciones.map((pres, pIdx) => (
                          <div key={pIdx} style={{ fontSize: '0.7rem', color: '#777', marginBottom: '0.1rem' }}>
                            • {getNombrePresentacion(pres)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones de paginación */}
          {skusCount > ITEMS_PER_PAGE && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.7rem',
                  backgroundColor: currentPage === 0 ? '#f0f0f0' : '#1976d2',
                  color: currentPage === 0 ? '#ccc' : '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                ← Anterior
              </button>
              
              <span style={{ fontSize: '0.75rem', color: '#666' }}>
                Página {currentPage + 1} de {Math.ceil(skusCount / ITEMS_PER_PAGE)}
              </span>
              
              
            </div>
          )}
        </Popover>
      )}
    </>
  );
};

export default SKUButton;
