const { validationResult } = require('express-validator');
const TimeboxController = require('../controllers/timeboxController');
const Product = require('../models/Product');

class ProductController {
  // Obtener todos los productos
  static async getAllProducts(req, res) {
    try {
      const products = await Product.findAll();
      res.json({
        status: true,
        message: 'Productos obtenidos exitosamente',
        data: products
      });
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener producto por ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          status: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Producto obtenido exitosamente',
        data: product
      });
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Crear nuevo producto
  static async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const productData = req.body;
      const newProduct = await Product.create(productData);
      
      res.status(201).json({
        status: true,
        message: 'Producto creado exitosamente',
        data: newProduct
      });
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar producto existente
  static async updateProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const productData = req.body;
      const updatedProduct = await Product.update(id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({
          status: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Producto actualizado exitosamente',
        data: updatedProduct
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar producto (soft delete)
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await Product.delete(id);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        status: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener productos por responsable
  static async getProductsByResponsable(req, res) {
    try {
      const { idResponsable } = req.params;
      const products = await Product.findByResponsable(idResponsable);
      
      res.json({
        status: true,
        message: `Productos del responsable obtenidos exitosamente`,
        data: products
      });
    } catch (error) {
      console.error('Error al obtener productos por responsable:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Buscar productos por nombre
  static async searchProductsByName(req, res) {
    try {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({
          status: false,
          message: 'El parámetro name es requerido'
        });
      }

      const products = await Product.searchByName(name);
      
      res.json({
        status: true,
        message: 'Búsqueda realizada exitosamente',
        data: products
      });
    } catch (error) {
      console.error('Error al buscar productos:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  static async getEntregablesDetailsByProduct(req, res) {
    try {
      const { productId } = req.params;
      // se obtienen los entregables del producto
      const details = await Product.getEntregablesDetailsByProduct(productId);
      
      // se obtienen los timeboxes asociados a esos entregables usando Promise.all
      const detailsWithTimeboxes = await Promise.all(
        details.map(async (entregable) => {
          const timeboxes = await TimeboxController.findByEntregableId(entregable.id);
          console.log(`Timeboxes para entregable ${entregable.id}:`, timeboxes);
          return {
            ...entregable,
            timeboxes: timeboxes || []
          };
        })
      );
      
      res.json({
        status: true,
        message: 'Detalles de entregables obtenidos exitosamente',
        data: detailsWithTimeboxes
      });
    } catch (error) {
      console.error('Error al obtener detalles de entregables:', error);
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;