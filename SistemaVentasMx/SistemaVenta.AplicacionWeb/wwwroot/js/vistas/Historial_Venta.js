let productoData = "";
let cliente = "";
let dataCliente = "";
let negocioData = "";

const VISTA_BUSQUEDA = {

    busquedaFecha: () => {

        $("#txtFechaInicio").val("")
        $("#txtFechaFin").val("")
        $("#txtNumeroVenta").val("")

        $(".busqueda-fecha").show()
        $(".busqueda-venta").hide()
    }, busquedaVenta: () => {

        $("#txtFechaInicio").val("")
        $("#txtFechaFin").val("")
        $("#txtNumeroVenta").val("")

        $(".busqueda-fecha").hide()
        $(".busqueda-venta").show()
    }
}

$(document).ready(function () {
    VISTA_BUSQUEDA["busquedaFecha"]()

    $.datepicker.setDefaults($.datepicker.regional["es"])

    $("#txtFechaInicio").datepicker({ dateFormat: "dd/mm/yy" })
    $("#txtFechaFin").datepicker({ dateFormat: "dd/mm/yy" })

})

$("#cboBuscarPor").change(function () {

    if ($("#cboBuscarPor").val() == "fecha") {
        VISTA_BUSQUEDA["busquedaFecha"]()
    } else {
        VISTA_BUSQUEDA["busquedaVenta"]()
    }

})


$("#btnBuscar").click(function () {

    if ($("#cboBuscarPor").val() == "fecha") {

        if ($("#txtFechaInicio").val().trim() == "" || $("#txtFechaFin").val().trim() == "") {
            toastr.warning("", "Debe ingresar fecha inicio y fin")
            return;
        }
    } else {

        if ($("#txtNumeroVenta").val().trim() == "") {
            toastr.warning("", "Debe ingresar el numero de venta")
            return;
        }
    }

    let numeroVenta = $("#txtNumeroVenta").val()
    let fechaInicio = $("#txtFechaInicio").val()
    let fechaFin = $("#txtFechaFin").val()


    $(".card-body").find("div.row").LoadingOverlay("show");

    fetch(`/Venta/Historial?numeroVenta=${numeroVenta}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
        .then(response => {
            $(".card-body").find("div.row").LoadingOverlay("hide");
            return response.ok ? response.json() : Promise.reject(response);
        })
        .then(responseJson => {

            $("#tbventa tbody").html("");

            if (responseJson.length > 0) {

                responseJson.forEach((venta, index) => {
                    /*console.log(venta)*/
                    // Realizar solicitud para obtener los datos del cliente por su ID
                    fetch(`/Cliente/ObtenerPorId?clienteId=${venta.idCliente}`)
                        .then(response => response.json())
                        .then(clienteData => {
                            // Una vez obtenidos los datos del cliente, mostrar el nombre en lugar del ID
                            const nombreCliente = clienteData.data;
                            /*console.log(nombreCliente)*/

                            const row = $("<tr>").append(
                                    $('<td>').addClass("align-middle").text(venta.fechaRegistro),
                                    $("<td>").addClass("align-middle").text(nombreCliente.nombre),
                                    $("<td>").addClass("align-middle").text(venta.numeroVenta),
                                    $("<td>").addClass("align-middle text-center").text(venta.total),
                                    $('<td class="text-center">').append(
                                        $("<div>").append(
                                            $("<button>").addClass("btn btn-info btn-lg mr-1").append(
                                                $("<i>").addClass("fas fa-clipboard-list").text(" Ver Detalles")
                                            ).data("venta", venta),
                                            $("<button>").attr("type", "button").addClass("btn btn-success btn-lg").append(
                                                $("<i>").addClass("far fa-money-bill-alt").text(" Solicitar Factura")
                                            ).data("venta", venta)
                                        )
                                    )
                            )

                            setTimeout(() => {
                                $("#tbventa tbody").append(row);

                                // Agregar la clase después de insertar el elemento si es necesario
                                row.addClass('animate__animated animate__fadeInLeft'); // Puedes cambiar 'fadeIn' a la clase que prefieras
                            }, 300 * index); // Multiplicamos por el índice para que haya un retraso incremental para cada fila

                        })
                        .catch(error => {
                            console.error("Error al obtener datos del cliente:", error);
                        });

                })

            }

        })

})
/*=========================================
=============NUEVO======================
===========================================*/
$("#tbventa tbody").on("click", ".btn-success", function () {

    /*AQUI ESTA SE OBTIENE TODA LA VENTA*/
    let d = $(this).data("venta");
    console.log("Datos de venta:", d.detalleVenta)

    fetch("/Cliente/ObtenerPorId?clienteId=" + d.idCliente)
        .then(response => response.json())
        .then(data => {
            cliente = data.data;
            /*console.log("Datos del cliente:", cliente)*/
            dataCliente = cliente;


            $("#txtFechaRegistro").val(d.fechaRegistro)
            $("#txtNumVenta").val(d.numeroVenta)
            $("#txtUsuarioRegistro").val(d.usuario)
            $("#txtTipoDocumento").val(d.tipoDocumentoVenta)
            $("#txtCliente").val(cliente.nombre)
            $("#txtRFC").val(cliente.rfc)
            $("#txtCorreo").val(cliente.correo)
            $("#txtSubTotal").val(d.subTotal)
            $("#txtIGV").val(d.impuestoTotal)
            $("#txtTotal").val(d.total)

            $("#tbProductos tbody").html("");

            d.detalleVenta.forEach((item) => {

                $("#tbProductos tbody").append(
                    $("<tr>").append(
                        $("<td>").text(item.descripcionProducto),
                        $("<td>").text(item.cantidad),
                        $("<td>").text(item.precio),
                        $("<td>").text(item.total),
                    )
                )
                buscarProducto(item.idProducto);
            })

            /*$("#linkFacturar").attr("href", `/Facturacion/Index?numeroVenta=${d.numeroVenta}`)*/

            document.getElementById("linkFacturar").addEventListener("click", async () => {
                console.log("Se ejecuto linkFacturar")
                let datos = "";
                mostrarPantallaDeCarga();
                try {
                    await obtenerInfoNegocio(); //Función devuelve la info del negocio

                    datos = {
                        Venta: {
                            idLocal: d.numeroVenta,
                            version: "4.0",
                            folio: "01",
                            formaPago: "01",
                            subTotal: d.subTotal,
                            descuento: d.descuento,
                            moneda: negocioData.simboloMoneda,
                            tipoCambio: "1.0",
                            total: d.total,
                            tipoDeComprobante: "I",
                            metodoPago: "PUE",
                            lugarExpedicion: negocioData.direccion,
                            regimenFiscal: negocioData.telefono,
                            rfc: dataCliente.rfc,
                            nombre: dataCliente.nombre,
                            domicilioFiscalReceptor: dataCliente.domicilioFiscalReceptor,
                            regimenFiscalReceptor: dataCliente.regimenFiscalReceptor,
                            usoCFDI: "S01"

                        },
                        DetalleVenta: [],
                        totalImporteTranslado: "0"
                    };
                    let descuentoProductos = 0;
                    await Promise.all(
                        d.detalleVenta.map(async detalle => {
                            const productoData = await buscarProducto(detalle.idProducto);
                            const descuentoProducto = detalle.precio * detalle.cantidad * (productoData.descuento / 100); // Descuento para el producto individual
                            descuentoProductos += descuentoProducto; // Sumar al descuento total
                            const tasaCuotaa = productoData.valorImpuesto / 100;
                            const detalleVenta = {
                                claveProdServ: productoData.claveProductoSat,
                                noIdentificacion: detalle.idProducto.toString(),
                                cantidad: detalle.cantidad.toString(),
                                claveUnidad: productoData.unidadMedidaSat,
                                unidad: productoData.unidadMedida,
                                descripcion: detalle.descripcionProducto,
                                valorUnitario: detalle.precio.toString(),
                                importe: (detalle.cantidad * detalle.precio).toString(),
                                descuento: descuentoProducto.toString(), // Descuento para el producto individual
                                objetoImp: productoData.objetoImpuesto,
                                base: (detalle.cantidad * detalle.precio).toString(),
                                impuesto: productoData.impuesto,
                                tipoFactor: productoData.factorImpuesto,
                                tasaOCuota: tasaCuotaa,
                                importeTranslado: (((detalle.cantidad * detalle.precio) * productoData.valorImpuesto) / 100).toString(),
                            };

                            datos.DetalleVenta.push(detalleVenta);
                        })
                    );

                    console.log("Descuento total:", descuentoProductos); // Descuento total para todos los productos
                    const totalImporteTranslado = datos.DetalleVenta.reduce((total, detalle) => {
                        return total + parseFloat(detalle.importeTranslado);
                    }, 0);

                    // Asignamos el total al campo correspondiente en datos.Venta
                    console.log(totalImporteTranslado)
                    datos.totalImporteTranslado = totalImporteTranslado.toString();
                    // Aquí se solicitaría el XML
                    let xmlGenerado = generarXML(datos);
                    let datosCFDI = JSON.stringify(xmlGenerado);;
                    console.log(datosCFDI);
                    console.log("El numero de venta es:", d.numeroVenta)
                    // Realizar la solicitud HTTP POST al backend con el XML generado
                    const response = await fetch('/Facturacion/Facturar', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: datosCFDI // Pasar el XML generado como cuerpo de la solicitud
                    });

                    // Verificar el estado de la respuesta
                    if (response.ok) {
                        // La solicitud se realizó con éxito
                        mostrarMensajeExito();
                        console.log('La facturación se realizó correctamente.');
                        //setTimeout(() => {
                        //    location.reload();
                        //}, 2000);
                    } else {
                        // Hubo un error en la solicitud
                        mostrarMensajeError();
                        //setTimeout(() => {
                        //    location.reload();
                        //}, 1000);
                        console.error('Error al intentar facturar:', response.statusText);
                    }

                } catch (error) {
                    console.error(error);
                    // Manejar errores según sea necesario
                } finally {
                    // Ocultar pantalla de carga
                    ocultarPantallaDeCarga();
                }
            });

            $("#modalFacturar").modal("show");

        })
        .catch(error => {
            console.error('Error:', error);
        });
})




/*=========================================
=============ANTIGUOO======================
===========================================*/
$("#tbventa tbody").on("click", ".btn-info", function () {
    
    /*AQUI ESTA SE OBTIENE TODA LA VENTA*/
    let d = $(this).data("venta");
    console.log("Datos de venta:", d.detalleVenta)

    fetch("/Cliente/ObtenerPorId?clienteId=" + d.idCliente)
        .then(response => response.json()) 
        .then(data => {
            cliente = data.data; 
            /*console.log("Datos del cliente:", cliente)*/
            dataCliente = cliente;


            $("#txtFechaRegistro").val(d.fechaRegistro)
            $("#txtNumVenta").val(d.numeroVenta)
            $("#txtUsuarioRegistro").val(d.usuario)
            $("#txtTipoDocumento").val(d.tipoDocumentoVenta)
            $("#txtCliente").val(cliente.nombre)
            $("#txtRFC").val(cliente.rfc)
            $("#txtCorreo").val(cliente.correo)
            $("#txtSubTotal").val(d.subTotal)
            $("#txtIGV").val(d.impuestoTotal)
            $("#txtTotal").val(d.total)

            $("#tbProductos tbody").html("");

            d.detalleVenta.forEach((item) => {

                $("#tbProductos tbody").append(
                    $("<tr>").append(
                        $("<td>").text(item.descripcionProducto),
                        $("<td>").text(item.cantidad),
                        $("<td>").text(item.precio),
                        $("<td>").text(item.total),
                    )
                )
                buscarProducto(item.idProducto);
            })

            $("#modalData").modal("show");
            $("#linkImprimir").attr("href", `/Venta/MostrarPDFVenta?numeroVenta=${d.numeroVenta}`)

        })
        .catch(error => {
            console.error('Error:', error);
        });
})


async function buscarProducto(idProducto) {
    try {
        const response = await fetch("/Producto/ObtenerPorId?idProducto=" + idProducto);
        if (!response.ok) {
            throw new Error('Error al obtener datos del producto');
        }
        const dataProductoResponse = await response.json();
        const dataProducto = dataProductoResponse.data;
        console.log("dataProducto Devuelve lo sig:",dataProducto);
        return dataProducto;
    } catch (error) {
        console.error('Error:', error);
        // Maneja el error según sea necesario
        return null; // O devuelve algún valor por defecto
    }
}

function obtenerInfoNegocio() {
    return fetch("/Negocio/Obtener")
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener datos del negocio');
            }
            $(".card-body").LoadingOverlay("hide");
            return response.json();
        })
        .then(responseJson => {
            if (responseJson.estado) {
                negocioData = responseJson.objeto;
            } else {
                swal("Lo sentimos", responseJson.mensaje, "error");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Agrega manejo de errores más específico según sea necesario
        });
}

function generarXML(datos) {
    let xml = `<Comprobante>`;
    xml += `<idLocal>1231231-${datos.Venta.idLocal}</idLocal>`;
    xml += `<version>${datos.Venta.version}</version>`;
    xml += `<serie/>`;
    xml += `<folio>${datos.Venta.folio}</folio>`;
    xml += `<formaPago>${datos.Venta.formaPago}</formaPago>`;
    xml += `<condicionesDePago>CONTADO</condicionesDePago>`;
    xml += `<subTotal>${datos.Venta.subTotal}</subTotal>`;
    xml += `<descuento>${datos.Venta.descuento}</descuento>`;
    xml += `<moneda>${datos.Venta.moneda}</moneda>`;
    xml += `<tipoCambio>${datos.Venta.tipoCambio}</tipoCambio>`;
    xml += `<exportacion>01</exportacion>`;
    xml += `<total>${datos.Venta.total}</total>`;
    xml += `<tipoDeComprobante>${datos.Venta.tipoDeComprobante}</tipoDeComprobante>`;
    xml += `<metodoPago>${datos.Venta.metodoPago}</metodoPago>`;
    xml += `<lugarExpedicion>${datos.Venta.lugarExpedicion}</lugarExpedicion>`;
    xml += `<confirmacion></confirmacion>`;
    xml += `<Relacionado/>`;
    xml += `<regimenFiscal>${datos.Venta.regimenFiscal}</regimenFiscal>`;
    xml += `<rfc>${datos.Venta.rfc}</rfc>`;
    xml += `<nombre>${datos.Venta.nombre}</nombre>`;
    xml += `<residenciaFiscal></residenciaFiscal>`;
    xml += `<numRegIdTrib></numRegIdTrib>`;
    xml += `<domicilioFiscalReceptor>${datos.Venta.domicilioFiscalReceptor}</domicilioFiscalReceptor>`;
    xml += `<regimenFiscalReceptor>${datos.Venta.regimenFiscalReceptor}</regimenFiscalReceptor>`;
    xml += `<usoCFDI>${datos.Venta.usoCFDI}</usoCFDI>`;

    // Agregar cada Concepto dinámicamente (pueden ser múltiples)
    datos.DetalleVenta.forEach(detalle => {
        xml += `<Concepto>`;
        xml += `<claveProdServ>${detalle.claveProdServ}</claveProdServ>`;
        xml += `<noIdentificacion>${detalle.noIdentificacion}</noIdentificacion>`;
        xml += `<cantidad>${detalle.cantidad}</cantidad>`;
        xml += `<claveUnidad>${detalle.claveUnidad}</claveUnidad>`;
        xml += `<unidad>${detalle.unidad}</unidad>`;
        xml += `<descripcion>${detalle.descripcion}</descripcion>`;
        xml += `<valorUnitario>${detalle.valorUnitario}</valorUnitario>`;
        xml += `<importe>${detalle.importe}</importe>`;
        xml += `<descuento>${detalle.descuento}</descuento>`;
        xml += `<objetoImp>${detalle.objetoImp}</objetoImp>`;
        xml += `<Traslado>`;
        xml += `<base>${detalle.base}</base>`;
        xml += `<impuesto>${detalle.impuesto}</impuesto>`;
        xml += `<tipoFactor>${detalle.tipoFactor}</tipoFactor>`;
        xml += `<tasaOCuota>${detalle.tasaOCuota}</tasaOCuota>`;
        xml += `<importe>${detalle.importeTranslado}</importe>`;
        xml += `</Traslado>`;
        xml += `</Concepto>`;
    });

    xml += `<totalImpuestosTrasladados>${datos.totalImporteTranslado}</totalImpuestosTrasladados>`;
    xml += `</Comprobante>`;

    return xml;
}

function mostrarPantallaDeCarga() {
    // Mostrar la pantalla de carga
    document.getElementById('pantalla-de-carga').style.display = 'flex';
}

function ocultarPantallaDeCarga() {
    // Ocultar la pantalla de carga
    document.getElementById('pantalla-de-carga').style.display = 'none';
}
function mostrarMensajeExito() {
    // Mostrar mensaje de éxito
    document.getElementById('mensaje-exito').style.display = 'block';
}

function mostrarMensajeError() {
    // Mostrar mensaje de error
    document.getElementById('mensaje-error').style.display = 'block';
}