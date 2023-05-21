# Arquitectura Cloud POC

## Descripción
**Bright Coin** permite a sus usuarios tener, en un solo lugar, toda su información financiera. La herramienta tiene la capacidad de consolidar la información financiera del usuario, ya sea información de movimientos bancarios (de productos como cuentas de ahorro, tarjetas de crédito, inversiones) o de flujos de efectivo. Por esta razón, el componente de seguridad dentro de la aplicación es prioritario.

En este POC se despliega una serie de recursos en la nube AWS con el fin de evaluar qué capas de seguridad se pueden añadir con el fin de cumplir con el ASR expuesto en la documentación del proyecto.

### Restricciones

* Cada servicio expuesto debe tener un protocolo seguro (HTTPS)
* Cada servicio debe tener los permisos mínimos para cumplir con su responsabilidad
* El servicio para solicitar una URL pre-firmada para subir archivos únicamente puede ser consumida por un usuario autenticado
* La URL pre-firmada para subir archivos debe tener una duración máxima de 5 minutos
* Cada archivo almacenado debe estar cifrado en reposo
## Arquitectura

![Cloud POC Arch](./doc/Cloud%20POC%20Arch.png "Cloud POC Arch")

### Servicios

* API Gateway con un único stage (dev) que expone servicios HTTPS
* AWS Cognito con un único User Pool que está integrado con el API Gateway
* 4 AWS Lambda con funciones únicas y diferentes las cuales son invocadas por los eventos de API Gateway
* Bucket S3 donde se almacenan los archivos de los usuarios

Las rutas expuestas por API Gateway son las siguientes:

1. ``POST /signup`` Permite crear un usuario al proveer un email, nombre y contraseña válidos
2. ``POST /verify-code`` Permite confirmar un usuario al proveer el *username* previamente creado junto con el código de verificación enviado al correo
3. ``POST /login`` Permite autenticar a un usuario ya creado/confirmado
4. ``POST /upload-file`` Permite solicitar una URL pre-firmada para subir archivos al proveer el nombre del archivo

