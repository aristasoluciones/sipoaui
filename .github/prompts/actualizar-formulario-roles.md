# Objetivo
Crear una interfaz de usuario para actualizar la seccion de permisos del formulario de roles con las siguientes características visuales y de interacción.

# Contexto Técnico y de Lógica
- Permisos de Acción: Los permisos de "hoja" son: access, create, edit y delete. El permiso access es el mínimo necesario para interactuar con un módulo.

# Contexto de Diseño
- Librería: React y PrimeReact.

- Representación Visual: Utilizar un componente TreeTable para mostrar una jerarquía de permisos.

# Estructura y Comportamiento de la UI

# Estructura de la Tabla:

- Una columna principal para el nombre del módulo o grupo.

- Cuatro columnas adicionales para las acciones: Access, Create, Edit, y Delete.

- El TreeTable debe permitir expandir y colapsar los nodos principales.

# Lógica Visual:

- Los checkboxes de las columnas de acciones (Access, Create, Edit, Delete) solo deben renderizarse en los nodos "hoja" de la jerarquía (donde los permisos existen). Para los nodos "padre" o de grupo, estas celdas deben estar vacías.

- Los checkboxes de los nodos "padre" (en la columna principal) deben tener tres estados:

    Marcado completo: Si todos los permisos de sus nodos hijos están seleccionados.

    Semi-marcado: Si solo algunos de los permisos de sus nodos hijos están seleccionados.

    Desmarcado: Si ninguno de los permisos de sus nodos hijos está seleccionado.

# Comportamiento del Usuario:

- Al hacer clic en un checkbox de un permiso de acción, su estado debe actualizarse.

- Al hacer clic en un checkbox de un nodo padre, todos los checkboxes de sus nodos hijos deben actualizarse a su mismo estado (marcados o desmarcados).

- La interfaz debe reflejar el estado de los permisos de un rol específico, cargando los checkboxes de forma inicial.

# Insrucciones
Genera el código completo de un componente de React que implemente esta interfaz. El código debe ser funcional e incluir la estructura del componente, el manejo de su estado, la lógica para el renderizado condicional de los checkboxes y las funciones de manejo de eventos para las interacciones del usuario. No incluyas la lógica del backend , solo deja preparado los servicios para la llamada a la API. El enfoque debe ser únicamente en la interfaz de usuario. El código debe ser modular y fácil de entender.

# Actualizar los objetos de Roles y Permisos

- El objeto Rol es muy simple y no tiene muchos de los atributos que se encuentran
implementados ahora. 
Actualizalos a como se definen acontinuacion.

interface Rol {
  id: number;
  title: string;
  created_at: string;
  updated_at?: string;
  permissions: string[];
  users_count: number;
}

interface RolFormData {
  title: string;
  permissions: string[];
}
 ya estan preparados los endpoints para consultar en la api
 - los metodos POST, PATCH, DELETE, GET ya estan preparados en /roles
 - para permissions usaras el metodo GET /permissions
