# Bookstore
Proyecto nativo que busca ser de uso de inventario para una libreria, desarrollado en TypeScript utilizando Btree como estructura de datos y usando Json para leer un archivo CSV del cual se obtineen los libros del inventario.

## Uso
Agregar libros: se leen los datos del arhivo CSV y dependiendo el caso el cual sea indicado por el CSV se insertera, eliminara o actulizara un libro en el arbol.
Busqueda: Se leer de otro archivo CSV las busquedas que se desean encontrar y se realiza la busqueda en el arbool el cual contiene los libros y se crea un archivo .txt el cual contendra los libros encontrados.


## Ejecución local
Proyecto realizado en Visual Studio Code

1. Clonar el repositorio
  https://github.com/danielxiquin/Bookstore.git

2. abrir visual studio code y ir al apartado de "Source Control" y presionar en "Clone Repository"

3. Insertamos la URL y se selecciona la carpeta donde se clonara el archivo

4. Instalamos Ts con el siguiente comando en la terminal: npm install typescript

5. Ejecucion del codigo con el siguiente comando: ts-node lab1.ts

## Explicación

### Estructura del proyecto
Class Book: Representa un libro con propiedades como ISBN, nombre, autor, categoría, precio y cantidad.

Class BtreeNode: Representa un nodo en el árbol B, que puede contener libros y otros nodos hijos.

Class Btree: Representa un árbol B que almacena y maneja libros.

Functiopn leer CSV: Lee un archivo CSV y ejecuta operaciones (INSERT, PATCH, DELETE) en el árbol B en función de las instrucciones en el archivo.

Function Salidatxt: Lee un archivo CSV y realiza búsquedas de libros por nombre, escribiendo los resultados en un archivo de texto.





