const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Conexión con DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'TABLA-SOLICITUD-PRESTAMO';

// Función Lambda
exports.lambdaHandler = async (event) => {
  try {
    // Validar que el cuerpo del evento exista
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Solicitud inválida',
          details: 'No se encontró el cuerpo de la solicitud',
        }),
      };
    }

    // Parsear el cuerpo de la solicitud
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Solicitud inválida',
          details: 'El cuerpo de la solicitud no está en formato JSON válido',
        }),
      };
    }

    // Validar campos requeridos
    const { usuario_id, monto, descripcion = 'Solicitud de préstamo' } = data;

    if (!usuario_id || monto === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Solicitud inválida',
          details: 'Faltan campos obligatorios: usuario_id o monto',
        }),
      };
    }

    // Validar que el monto sea un número válido
    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Monto inválido',
          details: 'El monto debe ser un número válido y mayor que 0',
        }),
      };
    }

    // Crear la solicitud
    const solicitud_id = uuidv4();
    const fecha_creacion = new Date().toISOString();

    const item = {
      usuario_id,
      solicitud_id,
      monto: parsedMonto,
      descripcion,
      estado: 'pendiente',
      fecha_creacion,
    };

    // Guardar la solicitud en DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: item,
    };

    await dynamodb.put(params).promise();

    // Devolver el resultado
    return {
      statusCode: 200,
      body: JSON.stringify(item),
    };
  } catch (error) {
    // Manejo de errores generales
    console.error('Error al crear la solicitud:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al crear la solicitud',
        details: error.message,
      }),
    };
  }
};
