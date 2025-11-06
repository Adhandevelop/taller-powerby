// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', initialize);

// Verificar el estado de la conexión
async function checkDatabaseStatus() {
    const statusElement = document.getElementById('dbStatus');
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (data.success) {
            statusElement.innerHTML = `
                <div class="alert alert-success m-0 py-1">
                    <i class="fas fa-check-circle"></i> Base de datos conectada
                </div>
            `;
            return true;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        statusElement.innerHTML = `
            <div class="alert alert-danger m-0 py-1">
                <i class="fas fa-exclamation-circle"></i> Error de conexión: ${error.message}
            </div>
        `;
        return false;
    }
}

// Cargar productos solo si la conexión es exitosa
async function initialize() {
    const isConnected = await checkDatabaseStatus();
    if (isConnected) {
        await loadProductos();
    }
}

// Cargar todos los productos
async function loadProductos() {
    try {
        const response = await fetch('/api/productos');
        const data = await response.json();
        const tabla = document.getElementById('productosTabla');
        tabla.innerHTML = '';
        
        console.log('Datos recibidos:', data);
        
        const productos = Array.isArray(data) ? data : [];
        
        if (productos.length === 0) {
            tabla.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos disponibles</td></tr>';
            return;
        }

        productos.forEach(producto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${producto.IdProducto}</td>
                <td>${producto.NombreProducto}</td>
                <td>${producto.Proveedor}</td>
                <td>${producto.Categoria}</td>
                <td>${producto.PrecioUnidad}</td>
                <td>${producto.UnidadesEnExistencia}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editarProducto('${producto.IdProducto}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarProducto('${producto.IdProducto}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tabla.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
        alert('Error al cargar los productos');
    }
}

// Mostrar/ocultar formulario
function toggleForm(editar = false) {
    const formContainer = document.getElementById('formContainer');
    const formTitle = formContainer.querySelector('h3');
    formTitle.textContent = editar ? 'Editar Producto' : 'Nuevo Producto';
    
    if (!editar) {
        document.getElementById('dataForm').reset();
        document.getElementById('productoId').value = '';
    }
    
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
}

// Editar producto
async function editarProducto(id) {
    try {
        const response = await fetch(`/api/productos/${id}`);
        if (!response.ok) throw new Error('Error al obtener el producto');
        
        const producto = await response.json();
        
        document.getElementById('productoId').value = producto.IdProducto;
        document.getElementById('idProducto').value = producto.IdProducto;
        document.getElementById('nombreProducto').value = producto.NombreProducto;
        document.getElementById('proveedor').value = producto.Proveedor;
        document.getElementById('categoria').value = producto.Categoria;
        document.getElementById('cantidadPorUnidad').value = producto.CantidadPorUnidad;
        document.getElementById('precioUnidad').value = producto.PrecioUnidad;
        document.getElementById('unidadesEnExistencia').value = producto.UnidadesEnExistencia;
        document.getElementById('unidadesEnPedido').value = producto.UnidadesEnPedido;
        document.getElementById('nivelNuevoPedido').value = producto.NivelNuevoPedido;
        document.getElementById('suspendido').checked = producto.Suspendido === 'VERDADERO';
        
        toggleForm(true);
    } catch (error) {
        console.error('Error al cargar producto:', error);
        alert('Error al cargar el producto');
    }
}

// Eliminar producto
async function eliminarProducto(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            const response = await fetch(`/api/productos/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar');
            
            await loadProductos();
            alert('Producto eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el producto');
        }
    }
}

// Manejar envío del formulario
document.getElementById('dataForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        idProducto: document.getElementById('idProducto').value,
        nombreProducto: document.getElementById('nombreProducto').value,
        proveedor: document.getElementById('proveedor').value,
        categoria: document.getElementById('categoria').value,
        cantidadPorUnidad: document.getElementById('cantidadPorUnidad').value,
        precioUnidad: document.getElementById('precioUnidad').value,
        unidadesEnExistencia: document.getElementById('unidadesEnExistencia').value,
        unidadesEnPedido: document.getElementById('unidadesEnPedido').value,
        nivelNuevoPedido: document.getElementById('nivelNuevoPedido').value,
        suspendido: document.getElementById('suspendido').checked ? 'VERDADERO' : 'FALSO'
    };

    try {
        const productoId = document.getElementById('productoId').value;
        const method = productoId ? 'PUT' : 'POST';
        const url = productoId ? `/api/productos/${productoId}` : '/api/save-data';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al guardar');

        await loadProductos();
        toggleForm();
        alert('Producto guardado correctamente');
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar el producto');
    }
});