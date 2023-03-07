#  Consumos inventario
Es un programa sencillo que desarrollé para satisfacer una necesidad de mi trabajo como Responsable de un Laboratorio Clínico de Referencia. 
La necesidad era capturar el consumo diario en una Web App del Sistema de Manejo de Información de Laboratorio (LIMS). 
Este sistema no tenía la funcionalidad de que estos consumos se transmitieran automáticamente a pesar de contar con esta información de manera digital. 
Por lo tanto, decidí automatizar el proceso por medio de un script sencillo en Python, y de pasó mejorar mis habilidades de programación.

#### Dependencias
> - Un ejecutable chromedriver de las misma version que tu navegador Chrome. Se puede descargar en <https://chromedriver.chromium.org/downloads>
> - Un archivo rvos.json que contenga la estructura: {Nombre del registro: {Nombre del reactivo en el registro: Nombre del reactivo en QUIMIOS-W}}
> - Un archivo cols.json que contenga la estructura: {Nombre del registro: {Nombre de la columna en el registro: Nombre de la columna en QUIMIOS-W}}
> - Un archivo festivos.txt que contenga los días festivos separados (uno por línea) en el formato aaaa-dd-mm