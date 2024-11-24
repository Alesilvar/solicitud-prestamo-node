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

    console.log(`Datos recibidos: usuario_id=${usuario_id}, solicitud_id=${solicitud_id}`);

    // Validar que los campos requeridos estén presentes
    if (!usuario_id || !solicitud_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Solicitud inválida',
          details: 'El usuario_id y el solicitud_id son obligatorios',
        }),
      };
    }

    // Verificar si la solicitud existe
    const getParams = {
      TableName: TABLE_NAME,
      Key: { usuario_id, solicitud_id },
    };

    const response = await dynamodb.get(getParams).promise();

    if (!response.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Solicitud no encontrada',
          details: `No se encontró la solicitud con usuario_id ${usuario_id} y solicitud_id ${solicitud_id}`,
        }),
      };
    }

    // Eliminar la solicitud
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: { usuario_id, solicitud_id },
    };

    await dynamodb.delete(deleteParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Solicitud ${solicitud_id} del usuario ${usuario_id} eliminada correctamente`,
      }),
    };
  } catch (error) {
    console.error(`Error inesperado: ${error.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al eliminar la solicitud',
        details: error.message,
      }),
    };
  }
};
