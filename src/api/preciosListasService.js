
import axiosInstance from './axiosInstance';

/**
 * ================================================================================
 * SERVICIO DE LISTAS DE PRECIOS - preciosListasService
 * ================================================================================
 */
function unwrapCAP(res) {
  return (
    res?.data?.value?.[0]?.data?.[0]?.dataRes ??
    res?.data?.dataRes ??
    res?.data ??
    []
  );
}

/**
 * Servicio CRUD para Listas de Precios — HANNIAALIDELUNA
 */
const preciosListasService = {
  commonParams: {},

/**
 * DESACTIVAR LÓGICAMENTE UNA LISTA (ProcessType=DeleteLogic)
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx 
 */
  async deleteLogic(idListaOK) { //aqui iniicia la funcion desactivar logic
    try {
      const params = new URLSearchParams({
        ProcessType: 'DeleteLogic',
        IDLISTAOK: idListaOK
      }).toString();
      
      // POST al backend con parámetro ProcessType=DeleteLogic
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );
      
      if (res.status !== 200) {
        throw new Error(`Error del servidor: ${res.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error al desactivar la lista:', error);
      throw error;
    }
  },

/**
 * OBTENER TODAS LAS LISTAS DE PRECIOS (ProcessType=GetAll)
 * LLAMADO DESDE:
 * - PreciosListasTable.jsx fetchListas
 * - PreciosListasActions.jsx 
 */
  async getAllListas() {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetAll',
        ShowInactive: 'true'  // Incluir registros inactivos
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      // Garantiza un arreglo y no filtra por estado
      const listas = Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
      return listas;
    } catch (error) {
      console.error('Error al obtener las listas de precios:', error);
      throw error;
    }
  },

/**
 * OBTENER UNA LISTA POR ID (ProcessType=GetOne)
 */
  async getListaById(idListaOK) {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetOne',
        IDLISTAOK: idListaOK
      }).toString();

      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error(`Error al obtener la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

/**
 * CREAR UNA NUEVA LISTA (ProcessType=AddOne)
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx si es nuevo registro)
 */
  async create(payload) { //inicio funcion para guardar
    try {
      // PASO 1: Crear parámetros de URL para indicar al backend que es AddOne
      const params = new URLSearchParams({
        ProcessType: 'AddOne'
      }).toString();

      // PASO 2: Preparar payload limpio con solo campos necesarios
      //aqui se guardan los datos del formulario
      const cleanPayload = {
        IDLISTAOK: payload.IDLISTAOK,
        IDINSTITUTOOK: payload.IDINSTITUTOOK || '',
        IDLISTABK: payload.IDLISTABK || '',
        DESLISTA: payload.DESLISTA || ''
      };

      // PASO 3: Agregar campos opcionales solo si están presentes en el payload
      if (payload.SKUSIDS) cleanPayload.SKUSIDS = payload.SKUSIDS;
      if (payload.FECHAEXPIRAINI) cleanPayload.FECHAEXPIRAINI = payload.FECHAEXPIRAINI;
      if (payload.FECHAEXPIRAFIN) cleanPayload.FECHAEXPIRAFIN = payload.FECHAEXPIRAFIN;
      if (payload.IDTIPOLISTAOK) cleanPayload.IDTIPOLISTAOK = payload.IDTIPOLISTAOK;
      if (payload.IDTIPOGENERALISTAOK) cleanPayload.IDTIPOGENERALISTAOK = payload.IDTIPOGENERALISTAOK;
      if (payload.IDTIPOFORMULAOK) cleanPayload.IDTIPOFORMULAOK = payload.IDTIPOFORMULAOK;

      // PASO 4: Enviar POST al backend
      // Body: cleanPayload con todos los datos de la nueva lista
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        cleanPayload //todo esto se envia
      );

      // PASO 5: Procesar respuesta del servidor
      const dataRes = unwrapCAP(res);
      
      // PASO 6: Retornar el primer elemento del array o null
      // El backend retorna los datos creados
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error('Error al crear la lista de precios:', error);
      throw error;
    }
  },

/**
 * ACTUALIZAR UNA LISTA EXISTENTE (ProcessType=UpdateOne)
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx si hay editingLista y ACTIVED no cambió
 */
  async update(idListaOK, payload) { //aqui inicia el update 
    try {
      
      // PASO 2: Preparar payload limpio con solo los campos necesarios
      const cleanPayload = {
        IDLISTAOK: idListaOK,
        IDINSTITUTOOK: payload.IDINSTITUTOOK || '',
        IDLISTABK: payload.IDLISTABK || '',
        DESLISTA: payload.DESLISTA || ''
      };

      // PASO 3: Agregar campos opcionales solo si están presentes en el payload
      if (payload.SKUSIDS) cleanPayload.SKUSIDS = payload.SKUSIDS;
      if (payload.FECHAEXPIRAINI) cleanPayload.FECHAEXPIRAINI = payload.FECHAEXPIRAINI;
      if (payload.FECHAEXPIRAFIN) cleanPayload.FECHAEXPIRAFIN = payload.FECHAEXPIRAFIN;
      if (payload.IDTIPOLISTAOK) cleanPayload.IDTIPOLISTAOK = payload.IDTIPOLISTAOK;
      if (payload.IDTIPOGENERALISTAOK) cleanPayload.IDTIPOGENERALISTAOK = payload.IDTIPOGENERALISTAOK;
      if (payload.IDTIPOFORMULAOK) cleanPayload.IDTIPOFORMULAOK = payload.IDTIPOFORMULAOK;

      // PASO 4: Crear parámetros de URL para indicar ProcessType=UpdateOne
      const params = new URLSearchParams({
        ProcessType: 'UpdateOne',
        IDLISTAOK: idListaOK  // ID de la lista a actualizar
      }).toString();

      // PASO 6: Realizar la petición POST al backend
      // Body: cleanPayload con los datos actualizados
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`,
        cleanPayload
      ); //aqui termina el update 

      // PASO 7: Procesar respuesta del servidor
      const dataRes = unwrapCAP(res);
      if (!dataRes) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return dataRes;
    } catch (error) {
      console.error(`Error al actualizar la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

/**
 *ELIMINAR PERMANENTEMENTE UNA LISTA (ProcessType=DeleteHard)
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx cuando usuario confirma)
 */
  async delete(idListaOK) { //aqui inicia el delete del serv
    try {
      
      // PASO 2: Crear parámetros de URL para indicar ProcessType=DeleteHard
      const params = new URLSearchParams({
        ProcessType: 'DeleteHard',  // aqui el processtype
        IDLISTAOK: idListaOK
      }).toString();

      // PASO 4: Realizar POST sin body
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      // PASO 5: Verificar si la petición fue exitosa (status 200)
      if (res.status !== 200) {
        throw new Error(`Error del servidor: ${res.status}`);
      }

      return true;
    } catch (error) {
      console.error(`Error al eliminar la lista de precios con ID ${idListaOK}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

/**
 *ACTIVAR UNA LISTA (ProcessType=ActivateOne)
 * LLAMADO DESDE:
 * - PreciosListasActions.jsx cuando shouldActivate=true)
 */
  async activate(idListaOK) { //aqui inicia la funcion de activar
    try {
      // PASO 1: Crear parámetros de URL para indicar ProcessType=ActivateOne
      const params = new URLSearchParams({
        ProcessType: 'ActivateOne',
        IDLISTAOK: idListaOK,  // ID de la lista a activar
      }).toString();

      // PASO 2: Enviar POST al backend
      // URL: /ztprecios-listas/preciosListasCRUD?ProcessType=ActivateOne&IDLISTAOK=<id>
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      // PASO 3: Procesar respuesta del servidor
      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes[0] || null : (dataRes || null);
    } catch (error) {
      console.error(`Error al activar la lista de precios con ID ${idListaOK}:`, error);
      throw error;
    }
  },

/**
 * OBTENER LISTAS POR SKUID (ProcessType=GetBySKUID)
 */
  async getListasBySKUID(skuid) {
    // Si no hay SKU, retornar array vacío
    if (!skuid) {
      return [];
    }
    try {
      // Crear parámetros de URL para búsqueda por SKU
      const params = new URLSearchParams({
        ProcessType: 'GetBySKUID',
        skuid,
      }).toString();

      // Enviar POST al backend
      const res = await axiosInstance.post(
        `/ztprecios-listas/preciosListasCRUD?${params}`
      );

      // Procesar respuesta
      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      console.error(`Error al obtener listas por SKUID ${skuid}:`, error);
      throw error;
    }
  },

/**
 * OBTENER TODOS LOS PRODUCTOS
 */
  async getAllProducts() {
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetAll'
      }).toString();

      const res = await axiosInstance.post(
        `/ztproducts/crudProducts?${params}`
      );

      const dataRes = unwrapCAP(res);
      return Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  },

/**
 * OBTENER PRESENTACIONES POR SKUID
 */
  async getPresentacionesBySkuId(skuid) {
    if (!skuid) {
      return [];
    }
    try {
      const params = new URLSearchParams({
        ProcessType: 'GetBySKUID',
        skuid
      }).toString();

      const res = await axiosInstance.post(
        `/ztproducts-presentaciones/productsPresentacionesCRUD?${params}`
      );

      const dataRes = unwrapCAP(res);
      const presentaciones = Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
      
      // Log para debug - muestra qué campos traen las presentaciones
      if (presentaciones.length > 0) {
        console.log(`🔍 Presentaciones para SKU ${skuid}:`, presentaciones);
      }
      
      return presentaciones;
    } catch (error) {
      console.error(`Error al obtener presentaciones para SKU ${skuid}:`, error);
      return [];
    }
  }
};

export default preciosListasService;
