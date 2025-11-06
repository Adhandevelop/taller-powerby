const express = require('express');
const path = require('path');
const { 
    saveData, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct,
    testDatabaseConnection 
} = require('./db');
require('dotenv').config();

// Verificar que tenemos la variable de entorno DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('❌ Error: Variable de entorno DATABASE_URL no encontrada');
    console.error('⚠️ Asegúrate de que el archivo .env existe y contiene DATABASE_URL');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para manejar errores JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, error: 'Invalid JSON' });
    }
    next();
});

// Verificar la conexión a la base de datos antes de iniciar el servidor
async function initializeServer() {
    try {
        console.log('🔄 Verificando conexión a la base de datos...');
        await testDatabaseConnection();
        
        // Iniciar el servidor solo si la conexión es exitosa
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error fatal: No se pudo conectar a la base de datos');
        console.error('📝 Detalles del error:', error.message);
        console.error('⚠️ Verifica que:');
        console.error('   1. La URL de la base de datos en el archivo .env sea correcta');
        console.error('   2. La base de datos esté en funcionamiento');
        console.error('   3. Las credenciales sean correctas');
        process.exit(1); // Terminar el proceso si no hay conexión
    }
}

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Middleware para parsear JSON
app.use(express.json());

// Ruta para servir el archivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await getAllProducts();
        console.log('Productos obtenidos:', productos); // Para depuración
        res.json(productos || []); // Asegurarse de devolver al menos un array vacío
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
    try {
        const producto = await getProductById(req.params.id);
        if (producto) {
            res.json(producto);
        } else {
            res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear nuevo producto
app.post('/api/save-data', async (req, res) => {
    try {
        const result = await saveData(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error al guardar datos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar producto
app.put('/api/productos/:id', async (req, res) => {
    try {
        const producto = await updateProduct(req.params.id, req.body);
        if (producto) {
            res.json({ success: true, data: producto });
        } else {
            res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const producto = await deleteProduct(req.params.id);
        if (producto) {
            res.json({ success: true, data: producto });
        } else {
            res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ruta para verificar el estado de la conexión
app.get('/api/status', async (req, res) => {
    try {
        // Asegurarse de establecer el tipo de contenido correcto
        res.setHeader('Content-Type', 'application/json');
        
        await testDatabaseConnection();
        res.json({ 
            success: true, 
            message: 'Conexión a la base de datos establecida correctamente',
            timestamp: new Date(),
            database: {
                url: process.env.DATABASE_URL ? '(configurada)' : '(no configurada)',
                connection: 'activa'
            }
        });
    } catch (error) {
        // Asegurarse de que el error se envía como JSON
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date(),
            database: {
                url: process.env.DATABASE_URL ? '(configurada)' : '(no configurada)',
                connection: 'error'
            }
        });
    }
});

// Iniciar el servidor solo en desarrollo local
if (process.env.NODE_ENV !== 'production') {
    initializeServer();
}

// Exportar la app para Vercel
module.exports = app;