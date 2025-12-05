/**
 * Autor: EchauriMu
 */

import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones CRUD de productos
 * @author EchauriMu
 */
const productService = {
  /**
   * Obtener todos los productos
   * @author EchauriMu
   * @returns {Promise} Lista de productos
   */
  async getAllProducts() {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'GetAll'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener un producto por SKUID
   * @author EchauriMu
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Producto encontrado
   */
  async getProductById(skuid) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'GetOne',
          skuid: skuid
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear un nuevo producto
   * @author EchauriMu
   * @param {Object} productData - Datos del producto
   * @returns {Promise} Producto creado
   */
  async createProduct(productData) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts?' + 
        new URLSearchParams({
          ProcessType: 'AddOne'
        }), productData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar un producto existente
   * @author EchauriMu
   * @param {string} skuid - ID del producto (SKU)
   * @param {Object} productData - Datos actualizados del producto
   * @returns {Promise} Producto actualizado
   */
  async updateProduct(skuid, productData) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', productData, {
        params: {
          ProcessType: 'UpdateOne',
          skuid: skuid
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar un producto (eliminación lógica)
   * @author EchauriMu
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Confirmación de eliminación
   */
  async deleteProduct(skuid) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'DeleteLogic',
          skuid: skuid
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Desactivar múltiples productos (eliminación lógica en lote)
   * @author EchauriMu
   * @param {string[]} skuids - Array de IDs de productos (SKU)
   * @returns {Promise<any[]>} Array de respuestas de la API
   */
  async deactivateProducts(skuids, user) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', 
      { skuidList: skuids }, // The backend expects skuids in the body as skuidList
      {
        params: {
          ProcessType: 'DeactivateMany',
          LoggedUser: user,
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar múltiples productos permanentemente (en lote)
   * @author EchauriMu
   * @param {string[]} skuids - Array de IDs de productos (SKU)
   * @param {string} user - Usuario que realiza la acción
   * @returns {Promise<any[]>} Array de respuestas de la API
   */
  async deleteProducts(skuids, user) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', 
      { skuidList: skuids }, // The backend expects skuids in the body as skuidList
      {
        params: {
          ProcessType: 'DeleteHardMany',
          LoggedUser: user,
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar un producto permanentemente
   * @author EchauriMu
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Confirmación de eliminación
   */
  async deleteProductHard(skuid) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'DeleteHard',
          skuid: skuid
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Activar un producto
   * @author EchauriMu
   * @param {string} skuid - ID del producto (SKU)
   * @returns {Promise} Confirmación de activación
   */
  async activateProduct(skuid) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', {}, {
        params: {
          ProcessType: 'ActivateOne',
          skuid: skuid
        }});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Activar múltiples productos (en lote)
   * @author EchauriMu
   * @param {string[]} skuids - Array de IDs de productos (SKU)
   * @returns {Promise<any[]>} Array de respuestas de la API
   */
  async activateProducts(skuids, user) {
    try {
      const response = await axiosInstance.post('/ztproducts/crudProducts', 
      { skuidList: skuids }, // The backend expects skuids in the body as skuidList
      {
        params: {
          ProcessType: 'ActivateMany',
          LoggedUser: user,
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default productService;