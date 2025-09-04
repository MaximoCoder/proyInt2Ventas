using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Xml;
using TimbradoService; // Agregar esta directiva

namespace SistemaVenta.AplicacionWeb.Controllers
{
    public class FacturacionController : Controller
    {
        [HttpPost]
        public async Task<IActionResult> Facturar([FromBody] string xmlGenerado)
        {
            try
            {
                string idLocal = null;
                // Cargar el XML en un XmlDocument
                XmlDocument xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(xmlGenerado);  // Asumiendo que xmlGenerado es un string con el XML

                // Obtener el valor de <idLocal>
                XmlNode idLocalNode = xmlDoc.SelectSingleNode("//idLocal");

                if (idLocalNode != null)
                {
                   idLocal = idLocalNode.InnerText; // Obtener el valor de idLocal
                    Console.WriteLine("idLocal: " + idLocal); // Imprimir en consola el valor de idLocal
                }

                // Dividir el idLocal por el guion (-)
                idLocal = idLocal.Split('-')[1];

                // Llamar al método del servicio web
                string user = "FIME";
                string password = "s9%4ns7q#eGq";


                // Crear una instancia del cliente del servicio web
                var client = new TimbradoSoapClient(TimbradoSoapClient.EndpointConfiguration.TimbradoSoap);


                // Llamar al método del servicio web y procesar la respuesta
                TimbradoService.TimbrarFResponse response = await client.TimbrarFAsync(user, password, xmlGenerado);


                // Obtener los bytes de la respuesta
                byte[] resultadoTimbradoBytes = response.Body.TimbrarFResult;


                // Procesar la respuesta cuando es exitosa
                if (resultadoTimbradoBytes != null && resultadoTimbradoBytes.Length > 0)
                {
                    // Crear un directorio para almacenar los archivos
                    string directorioSalida = @"C:\Users\claud\Downloads\Facturas"; // Cambia esta ruta según tu necesidad
                    Directory.CreateDirectory(directorioSalida);

                    // Guardar el archivo ZIP en disco
                    string archivoZip = Path.Combine(directorioSalida, "Facturacion_" + idLocal + ".zip");
                    await System.IO.File.WriteAllBytesAsync(archivoZip, resultadoTimbradoBytes);

                    // Devolver una respuesta de éxito si todo salió bien
                    return Ok();
                }
                else
                {
                    return StatusCode(500, "El servicio web devolvió una respuesta vacía.");
                }
            }
            catch (Exception ex)
            {
                // Manejar errores y devolver una respuesta de error
                return StatusCode(500, $"Error al llamar al servicio web: {ex.Message}");
            }
        }
    }
}