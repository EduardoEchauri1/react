import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar operaciones CRUD de categorías
 * Adaptado al backend CAP (ZTCategoriasService.categoriasCRUD)
 * con parámetros estandarizados y limpieza automática de payload.
 */
const categoriasService = {
  // Parámetros comunes para todas las peticiones
  commonParams: {},

  //  Limpieza de datos antes de enviarlos
cleanPayload(data) {
  if (!data || typeof data !== 'object') return data;
  const cleaned = { ...data };

  //  Campos internos o de solo lectura que NO deben enviarse al backend CAP
  const internalFields = [
    '_id', '__v', 'HISTORY',
    'REGDATE', 'MODDATE',
    'MODUSER', 'createdAt', 'updatedAt'
  ];

  internalFields.forEach(f => delete cleaned[f]);

  return cleaned;
},



  /**
   *  Obtener todas las categorías
   * @returns {Promise} Lista de categorías
   */
  async GetAllZTCategorias() {
    try {
      const response = await axiosInstance.post(
        '/ztcategorias/categoriasCRUD',
        {},
        {
          params: { ProcessType: 'GetAll', ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      console.error(' Error GetAllZTCategorias:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   *  Obtener una categoría por ID
   * @param {string} catid - ID de la categoría (CATID)
   * @returns {Promise} Categoría encontrada
   */
  async GetOneZTCategoria(catid) {
    try {
      const response = await axiosInstance.post(
        '/ztcategorias/categoriasCRUD',
        {},
        {
          params: { ProcessType: 'GetOne', CATID: catid, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      console.error(' Error GetOneZTCategoria:', error);
      throw error;
    }
  },

  /**
   *  Crear una nueva categoría
   * @param {Object} payload - Datos de la categoría
   * @returns {Promise} Categoría creada
   */
  async AddOneZTCategoria(payload) {
    try {
      const cleanData = this.cleanPayload(payload);
      const response = await axiosInstance.post(
        '/ztcategorias/categoriasCRUD',
        cleanData,
        {
          params: { ProcessType: 'AddOne', ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      console.error(' Error AddOneZTCategoria:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   *  Actualizar una categoría existente
   * @param {string} catid - ID de la categoría
   * @param {Object} cambios - Datos actualizados
   * @returns {Promise} Categoría actualizada
   */
  async UpdateOneZTCategoria(catid, cambios) {
    try {
      const cleanData = this.cleanPayload(cambios);
      const response = await axiosInstance.post(
        // El backend usa el `catid` del query param para buscar,
        // y el `cleanData` del body para aplicar los cambios (incluyendo el nuevo CATID).
        // Esto es correcto según el servicio `ztcategorias-service.js`.
        '/ztcategorias/categoriasCRUD',
        cleanData,
        {
          params: { ProcessType: 'UpdateOne', CATID: catid, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      console.error(' Error UpdateOneZTCategoria:', error);
      throw error;
    }
  },

  /**
   *  Eliminar una categoría (borrado lógico)
   * @param {string} catid - ID de la categoría
   * @returns {Promise}
   */
  async DeleteLogicZTCategoria(catid) {
    try {
      const response = await axiosInstance.post(
        '/ztcategorias/categoriasCRUD',
        {},
        {
          params: { ProcessType: 'DeleteLogic', CATID: catid, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      console.error(' Error DeleteLogicZTCategoria:', error);
      throw error;
    }
  },

  /**
   *  Eliminar una categoría (borrado físico)
   * @param {string} catid - ID de la categoría
   * @returns {Promise}
   */
  async DeleteHardZTCategoria(catid) {
    try {
      const response = await axiosInstance.post(
        '/ztcategorias/categoriasCRUD',
        {},
        {
          params: { ProcessType: 'DeleteHard', CATID: catid, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      console.error(' Error DeleteHardZTCategoria:', error);
      throw error;
    }
  },

  /**
   *  Activar una categoría
   * @param {string} catid - ID de la categoría
   * @returns {Promise}
   */
  async ActivateZTCategoria(catid) {
    try {
      const response = await axiosInstance.post(
        '/ztcategorias/categoriasCRUD',
        {},
        {
          params: { ProcessType: 'ActivateOne', CATID: catid, ...this.commonParams },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      console.error(' Error ActivateZTCategoria:', error);
      throw error;
    }
  },
};

export default categoriasService;
