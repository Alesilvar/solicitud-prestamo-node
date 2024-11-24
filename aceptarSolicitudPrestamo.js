const AWS = require('aws-sdk');

// Conexión a DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'TABLA-SOLICITUD-PRESTAMO';

exports.lambdaHandler = async (event) => {
  try {
    // Validar el cuerpo de la solicitud
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Solicitud inválida',
          details: 'No se encontró el cuerpo de la solicitud',
        }),
      };
    }

    const data = JSON.parse(event.body);

    const { usuario_id, solicitud_id } = data;

    // Validar que usuario_id y solicitud_id estén presentes
    if (!usuario_id || !solicitud_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Solicitud inválida',
          details: 'Los campos usuario_id y solicitud_id son obligatorios',
        }),
      };
    }

    // Obtener la solicitud desde DynamoDB
    const getParams = {
      TableName: TABLE_NAME,
      Key: { usuario_id, solicitud_id },
    };

    const response = await dynamodb.get(getParams).promise();
    const solicitud = response.Item;

    // Validar si la solicitud existe
    if (!solicitud) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Solicitud no encontrada' }),
      };
    }

    // Manejar estados de la solicitud
    const estadoActual = solicitud.estado;

    if (estadoActual === 'rechazado') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'La solicitud ya fue rechazada',
          estado_actual: estadoActual,
        }),
      };
    } else if (estadoActual === 'aceptado') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'La solicitud ya fue aceptada previamente',
          estado_actual: estadoActual,
        }),
      };
    } else if (estadoActual === 'pendiente') {
      // Actualizar el estado de la solicitud a 'aceptado'
      const updateParams = {
        TableName: TABLE_NAME,
        Key: { usuario_id, solicitud_id },
        UpdateExpression: 'SET estado = :estado',
        ExpressionAttributeValues: {
          ':estado': 'aceptado',
        },
      };

      await dynamodb.update(updateParams).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Solicitud aceptada exitosamente',
          usuario_id,
          solicitud_id,
          nuevo_estado: 'aceptado',
        }),
      };
    }

    // Manejo de estados desconocidos
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Estado desconocido',
        estado_actual: estadoActual,
      }),
    };
  } catch (error) {
    // Manejo de errores generales
    console.error('Error interno al procesar la solicitud:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al procesar la solicitud',
        details: error.message,
      }),
    };
  }
};
