import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  BusyIndicator,
  FlexBox,
} from '@ui5/webcomponents-react';
import productService from '../../api/productService';

const ProductTableActions = ({
  selectedSKUIDs,
  products,
  loading,
  onActionStart,
  onActionSuccess,
  onActionError,
  onEdit,
}) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (selectedSKUIDs.length === 1) {
      const productToEdit = products.find(p => p.SKUID === selectedSKUIDs[0]);
      onEdit(productToEdit);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente ${selectedSKUIDs.length} producto(s)? Esta acción no se puede deshacer.`)) {
      onActionStart();
      try {
     
        const response = await productService.deleteProducts(selectedSKUIDs, 'DEMO_USER');
        onActionSuccess(
          `${selectedSKUIDs.length} producto(s) eliminado(s) permanentemente.`,
          { type: 'delete', skus: selectedSKUIDs }
        );
      } catch (error) {
        onActionError(`Error al eliminar productos: ${error.message}`);
      }
    }
  };

  // Lógica para determinar el estado de los botones de acción
  const { canDeactivate, canActivate, isMixedState, buttonText, buttonIcon, buttonDesign } = useMemo(() => {
    if (selectedSKUIDs.length === 0) {
      return { canDeactivate: false, canActivate: false, isMixedState: false, buttonText: 'Desactivar', buttonIcon: 'decline', buttonDesign: 'Attention' };
    }
    const selectedProducts = products.filter(p => selectedSKUIDs.includes(p.SKUID));
    const activeProducts = selectedProducts.filter(p => p.ACTIVED === true && p.DELETED === false);
    const inactiveProducts = selectedProducts.filter(p => p.ACTIVED === false);

    const isMixed = activeProducts.length > 0 && inactiveProducts.length > 0;
    const allActive = activeProducts.length > 0 && inactiveProducts.length === 0;
    const allInactive = inactiveProducts.length > 0 && activeProducts.length === 0;

    return {
      canDeactivate: allActive,
      canActivate: allInactive,
      isMixedState: isMixed,
      buttonText: isMixed ? 'Invertir Estado' : (allInactive ? 'Activar' : 'Desactivar'),
      buttonIcon: isMixed ? 'synchronize' : (allInactive ? 'activate' : 'decline'),
      buttonDesign: isMixed ? 'Neutral' : (allInactive ? 'Positive' : 'Attention')
    };
  }, [selectedSKUIDs, products]);

  const handleToggleActiveState = async () => {
    const actionText = isMixedState ? 'invertir el estado de' : (canActivate ? 'activar' : 'desactivar');
    if (window.confirm(`¿Estás seguro de que deseas ${actionText} ${selectedSKUIDs.length} producto(s)?`)) {
      onActionStart();
      try {
        if (isMixedState) {
          // TODO: Replace 'DEMO_USER' with the actual logged-in user
          const user = 'DEMO_USER';
          const selectedProducts = products.filter(p => selectedSKUIDs.includes(p.SKUID));
          const skusToActivate = selectedProducts.filter(p => p.ACTIVED === false).map(p => p.SKUID);
          const skusToDeactivate = selectedProducts.filter(p => p.ACTIVED === true).map(p => p.SKUID);

          const promises = [];
          if (skusToActivate.length > 0) {
            promises.push(productService.activateProducts(skusToActivate, user));
          }
          if (skusToDeactivate.length > 0) {
            promises.push(productService.deactivateProducts(skusToDeactivate, user));
          }

          await Promise.all(promises);
          onActionSuccess(
            `${selectedSKUIDs.length} producto(s) procesado(s) exitosamente.`,
            { type: 'toggle', skus: selectedSKUIDs, skusToActivate, skusToDeactivate }
          );
        } else if (canActivate) {
          // TODO: Replace 'DEMO_USER' with the actual logged-in user
          const response = await productService.activateProducts(selectedSKUIDs, 'DEMO_USER');
          onActionSuccess(
            `${selectedSKUIDs.length} producto(s) activado(s) exitosamente.`,
            { type: 'activate', skus: selectedSKUIDs }
          );
        } else { // canDeactivate
          const response = await productService.deactivateProducts(selectedSKUIDs);
          onActionSuccess(
            `${selectedSKUIDs.length} producto(s) desactivado(s) exitosamente.`,
            { type: 'deactivate', skus: selectedSKUIDs, response }
          );
        }
      } catch (error) {
        onActionError(`Error al ${actionText} productos: ${error.message}`);
      }
    }
  };

  return (
    <FlexBox alignItems="Center" justifyContent="End" wrap="Wrap" style={{ gap: '0.5rem' }}>
      <Button icon="add" design="Emphasized" onClick={() => navigate('/add-products')}>
        Añadir Producto
      </Button>
      <Button icon="edit" design="Transparent" disabled={selectedSKUIDs.length !== 1} onClick={handleEdit}>
        Editar
      </Button>
      <Button icon="delete" design="Negative" disabled={selectedSKUIDs.length === 0} onClick={handleDelete}>
        Eliminar
      </Button>
      <Button icon={buttonIcon} design={buttonDesign} disabled={selectedSKUIDs.length === 0} onClick={handleToggleActiveState}>
        {buttonText}
      </Button>
      {loading && <BusyIndicator active size="Small" />}
    </FlexBox>
  );
};

export default ProductTableActions;