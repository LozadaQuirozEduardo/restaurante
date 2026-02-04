# Validaciones y Restricciones del Bot de WhatsApp

## 📋 Validaciones Implementadas

### 1. **Selección de Productos**
- ✅ Solo números válidos de la lista mostrada
- ✅ Máximo 5 productos a la vez
- ✅ Validación de rango por página (ej: página 1 tiene productos 1-15)
- ✅ Confirmación visual del producto seleccionado
- ❌ **IMPORTANTE**: Usa el número que aparece en la PÁGINA ACTUAL, no el ID del producto

#### Advertencias al Cliente:
```
⚠️ IMPORTANTE: Usa los números del 1 al 15 de esta página
✅ Un producto: Escribe 1
✅ Varios: Separa con comas 1, 3, 5
✅ Máximo: 5 productos a la vez
```

### 2. **Cantidad de Productos**
- ✅ Solo números válidos
- ✅ Cantidad mínima: 1
- ✅ Cantidad máxima: 50 unidades
- ❌ Rechaza cantidades > 50 (sugiere llamar por teléfono)

#### Mensajes de Error:
- `"Eso no es un número válido"` - Cuando no es un número
- `"La cantidad debe ser mayor a 0"` - Cuando es 0 o negativo
- `"Cantidad muy alta"` - Cuando excede 50 unidades

### 3. **Nombre del Cliente**
- ✅ Longitud mínima: 3 caracteres
- ✅ Longitud máxima: 50 caracteres
- ✅ Solo letras (incluyendo acentos y ñ)
- ❌ No permite números ni símbolos especiales

#### Ejemplos:
- ✅ Válidos: "Juan Pérez", "María López", "José García"
- ❌ Inválidos: "J", "Juan123", "Juan@Pérez"

### 4. **Dirección de Entrega**
- ✅ Longitud mínima: 15 caracteres
- ✅ Longitud máxima: 200 caracteres
- ✅ Debe incluir: calle, número, colonia, referencias

#### Ejemplo Válido:
```
Av. Juárez 123, Col. Centro, entre calle A y B, 
portón negro
```

### 5. **Tipo de Entrega**
- ✅ Opción 1: Recoger en restaurante (sin costo)
- ✅ Opción 2: Servicio a domicilio (+$15 MXN)
- ❌ Solo acepta respuestas "1" o "2"

### 6. **Navegación entre Páginas**
- ✅ 15 productos por página
- ✅ Comandos: "siguiente" o "anterior"
- ✅ Indicador de página actual: "Página 1 de 3"

## 🔍 Solución al Problema del Producto "20"

### ❌ Problema Original:
Cuando escribías "20", el sistema buscaba el producto en la posición 20 de toda la lista, 
sin importar qué página estabas viendo.

### ✅ Solución Implementada:
Ahora el sistema:
1. Valida que el número esté en el rango de la PÁGINA ACTUAL
2. Muestra claramente el rango válido: "productos del 1 al 15"
3. Si el número está fuera de rango, muestra error específico:
   ```
   ❌ El número 20 no está en esta página.
   ⚠️ En esta página solo hay productos del 1 al 15
   💡 Usa siguiente o anterior para navegar entre páginas.
   ```

### Ejemplo de Flujo Correcto:
```
Página 1: Productos 1-15
Usuario escribe: 20
Bot responde: ❌ Error, en esta página solo hay 1-15

Usuario escribe: siguiente
Página 2: Productos 16-30
Usuario escribe: 20
Bot responde: ✅ Correcto, muestra producto #20
```

## 📊 Resumen de Carrito

Después de agregar un producto, se muestra:
```
✅ Agregado al carrito:
1x Pizza Margarita
💰 Subtotal: $150.00

🛒 Total en carrito: $300.00
📦 Productos: 2
```

## ⚠️ Límites y Restricciones

| Validación | Mínimo | Máximo | Mensaje de Error |
|------------|--------|--------|-----------------|
| Productos por vez | 1 | 5 | "Solo puedes seleccionar hasta 5 productos a la vez" |
| Cantidad | 1 | 50 | "Por pedidos mayores a 50 unidades, llámanos" |
| Nombre | 3 | 50 | "El nombre es muy corto/largo" |
| Dirección | 15 | 200 | "La dirección es muy corta/larga" |

## 💡 Recomendaciones para el Usuario

1. **Lee el número correcto** de la página actual
2. **Usa "siguiente"** si no ves el producto que buscas
3. **Confirma** el producto antes de agregar cantidad
4. **Proporciona dirección completa** para delivery
5. **Revisa el resumen** antes de confirmar el pedido

## 🔧 Para Desarrolladores

### Archivos Modificados:
- `backend/services/messageHandler.js`
  - Función `handlePedirProducto()` - Validación de selección
  - Función `handlePedirCantidad()` - Validación de cantidad
  - Función `handlePedirNombre()` - Validación de nombre
  - Función `handlePedirDireccion()` - Validación de dirección

### Testing Recomendado:
1. Seleccionar producto fuera de rango
2. Seleccionar más de 5 productos
3. Ingresar cantidad > 50
4. Ingresar nombre con números
5. Ingresar dirección muy corta
