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

    // Validar si la solicitud ya fue revisada
    if (solicitud.estado !== 'pendiente') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'La solicitud ya fue revisada',
          estado_actual: solicitud.estado,
        }),
      };
    }

    // Actualizar el estado de la solicitud a 'rechazado'
    const updateParams = {
      TableName: TABLE_NAME,
      Key: { usuario_id, solicitud_id },
      UpdateExpression: 'SET estado = :estado',
      ExpressionAttributeValues: {
        ':estado': 'rechazado',
      },
    };

    await dynamodb.update(updateParams).promise();

    // Retornar respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Solicitud rechazada exitosamente',
        usuario_id,
        solicitud_id,
        nuevo_estado: 'rechazado',
      }),
    };
  } catch (error) {
    // Manejo de errores generales
    console.error('Error interno al rechazar la solicitud:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al rechazar la solicitud',
        details: error.message,
      }),
    };
  }
};
