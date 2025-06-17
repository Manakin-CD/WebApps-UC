🧠 Funcionalidades principales del sistema
1. Gestión de maquilas
Visualización en tarjetas de las maquilas disponibles.

Filtro por estado (available, in-progress, near-deadline, ready, overdue).

Búsqueda en comentarios asociados a cada maquila.

Panel de administración para:

Agregar maquilas

Actualizar maquilas

Eliminar maquilas

2. Modos de visualización
Soporte para modo claro/oscuro (Dark Mode).

Botón para cambiar el tema visual.

3. Sistema de autenticación
Inicio y cierre de sesión con Supabase.

Persistencia automática de sesión.

4. Generación de PDFs (Cierre de maquila)
Cierre individual de maquilas: genera un PDF con detalles como:

Nombre, capacidad, piezas asignadas

Fechas de despacho, entrega, pago y cierre

Desglose por boleta, tipo, talla, cantidad, precio y total

Firmas de entrega y recepción

Cierre global: un PDF con resumen total por maquila

Incluye totales y espacio para firmas

5. Conexión con Supabase
Todos los datos se almacenan en una base de datos Supabase (maquilas)

Implementa lógica de reconexión y retries automáticos en caso de errores de red o tiempo de espera

6. Panel "Acerca de"
Modal informativo con créditos, versión y datos de contacto

Información sobre la autoría: Desarrollado por Manakin Labs

✅ Tecnologías utilizadas
React + TypeScript + Vite

Supabase (Base de datos + Auth)

Tailwind CSS (para los estilos)

jsPDF y jsPDF-AutoTable (para generación de PDFs)
