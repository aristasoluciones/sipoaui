# Crear Programa Operativo Anual  de un Proyecto
Actualiza el componente actual para la etapa de Programa Operativo Anual considerando que en la captura de esta etapa, se lleva a acabo el Registro de actividades(Principal), Subactividades(de las actividades y son obligatorios), Fecha de inicio y termino de cada subactividad(obligatorios),Entregable de esa subactividad(es opcional). Al capturar fecha inicio y fecha termino debe mostrar los meses contemplado entre esas fechas. 

Implementa un componente que garantice una buena UX y que sea responsiva, ya que en esa ventana se manejaran muchos registros y el usuario debe poder captura lo mas rapido posible.

El flujo de captura seria de la siguiente manera

PAso 1. Captura de actividad
   - Tipo de actividad: Viene del catalogo de tipos de actividad
   - Actividad: Dejarlo como textarea de 3 rows.
Paso 2. Captura de Subactividad
   - Subactividad: Campo textarea de 3 rows
   - Fecha inicio
   - Fecha termino
   - Entregable: Viene de catalogo de entregables.
   - Mostrar meses contemplados entre Fecha Inicio y Fecha termino.

Guiate de como monday.com gestiona sus tableros por elementos(Actividades), subelementos(Subactividades).

El componente abrelo por url proyectos/dc8b3be2-0df7-4083-abe7-14c36395963c/poa para que se tenga mayor espacio de trabajo y que se pueda regresar al wizard, de momento usa mocks, luego integraremos con api.
