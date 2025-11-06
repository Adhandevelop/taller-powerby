const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

// Función para verificar la conexión a la base de datos
async function testDatabaseConnection() {
    const client = await pool.connect();
    try {
        // Intentar una consulta simple
        const result = await client.query('SELECT NOW()');
        console.log('✅ Conexión a la base de datos exitosa');
        console.log('⏰ Hora del servidor:', result.rows[0].now);
        
        // Verificar la existencia de la tabla productos
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'productos'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ Tabla "powerby" encontrada');
            // Contar registros en la tabla
            const countResult = await client.query('SELECT COUNT(*) FROM powerby');
            console.log('📊 Número de productos en la base de datos:', countResult.rows[0].count);
        } else {
            console.log('⚠️ La tabla "productos" no existe');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a la base de datos:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Obtener todos los productos
async function getAllProducts() {
    const client = await pool.connect();
    try {
        // Verificar si la tabla existe
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'powerby'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            // Si la tabla no existe, la creamos
            await client.query(`
                CREATE TABLE IF NOT EXISTS powerby (
                    "IdProducto" VARCHAR(255) PRIMARY KEY,
                    "NombreProducto" VARCHAR(255),
                    "Proveedor" VARCHAR(255),
                    "Categoria" VARCHAR(255),
                    "CantidadPorUnidad" VARCHAR(255),
                    "PrecioUnidad" VARCHAR(255),
                    "UnidadesEnExistencia" VARCHAR(255),
                    "UnidadesEnPedido" VARCHAR(255),
                    "NivelNuevoPedido" VARCHAR(255),
                    "Suspendido" VARCHAR(255)
                )
            `);
        }

        const result = await client.query('SELECT * FROM powerby ORDER BY "IdProducto"');
        console.log('Resultado de la consulta:', result.rows); // Para depuración
        return result.rows;
    } catch (error) {
        console.error('Error en getAllProducts:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Obtener un producto por ID
async function getProductById(id) {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM powerby WHERE "IdProducto" = $1', [id]);
        return result.rows[0];
    } finally {
        client.release();
    }
}

// Crear nuevo producto
async function saveData(data) {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO powerby (
                "IdProducto",
                "NombreProducto", 
                "Proveedor", 
                "Categoria", 
                "CantidadPorUnidad", 
                "PrecioUnidad", 
                "UnidadesEnExistencia", 
                "UnidadesEnPedido", 
                "NivelNuevoPedido", 
                "Suspendido"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            data.idProducto,
            data.nombreProducto,
            data.proveedor,
            data.categoria,
            data.cantidadPorUnidad,
            data.precioUnidad,
            data.unidadesEnExistencia,
            data.unidadesEnPedido,
            data.nivelNuevoPedido,
            data.suspendido
        ];
        const result = await client.query(query, values);
        return result.rows[0];
    } finally {
        client.release();
    }
}

// Actualizar producto
async function updateProduct(id, data) {
    const client = await pool.connect();
    try {
        const query = `
            UPDATE powerby SET
                "IdProducto" = $1,
                "NombreProducto" = $2,
                "Proveedor" = $3,
                "Categoria" = $4,
                "CantidadPorUnidad" = $5,
                "PrecioUnidad" = $6,
                "UnidadesEnExistencia" = $7,
                "UnidadesEnPedido" = $8,
                "NivelNuevoPedido" = $9,
                "Suspendido" = $10
            WHERE "IdProducto" = $11
            RETURNING *
        `;
        const values = [
            data.idProducto,
            data.nombreProducto,
            data.proveedor,
            data.categoria,
            data.cantidadPorUnidad,
            data.precioUnidad,
            data.unidadesEnExistencia,
            data.unidadesEnPedido,
            data.nivelNuevoPedido,
            data.suspendido,
            id
        ];
        const result = await client.query(query, values);
        return result.rows[0];
    } finally {
        client.release();
    }
}

// Eliminar producto
async function deleteProduct(id) {
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM powerby WHERE "IdProducto" = $1 RETURNING *', [id]);
        return result.rows[0];
    } finally {
        client.release();
    }
}

module.exports = {
    saveData,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    testDatabaseConnection
};