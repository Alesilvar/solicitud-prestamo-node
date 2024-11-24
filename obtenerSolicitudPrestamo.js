const AWS = require('aws-sdk');

// Conexión a DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'TABLA-SOLICITUD-PRESTAMO';

// Función auxiliar para convertir Decimals a JSON serializables (DocumentClient ya maneja esto, pero lo incluimos por compatibilidad)
const decimalToSerializable = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(decimalToSerializable);
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[key] = decimalToSerializable(value);
      return acc;
    }, {});
  }
  return obj;
};

// Función Lambda
exports.lambdaHandler = async (event) => {
  try {
    // Validar y parsear el cuerpo de la solicitud
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

    // Validar entrada
    if (!usuario_id || !solicitud_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Solicitud inválida',
          details: 'Los campos usuario_id y solicitud_id son obligatorios',
        }),
      };
    }

    // Obtener la solicitud de DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Key: { usuario_id, solicitud_id },
    };

    const response = await dynamodb.get(params).promise();
    const solicitud = response.Item;

    if (!solicitud) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Solicitud no encontrada' }),
      };
    }

    // Convertir Decimal a tipos JSON serializables (si es necesario)
    const solicitudSerializable = decimalToSerializable(solicitud);

    return {
      statusCode: 200,
      body: JSON.stringify(solicitudSerializable),
    };
  } catch (error) {
    // Manejo de errores generales
    console.error('Error al obtener la solicitud:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al obtener la solicitud',
        details: error.message,
      }),
    };
  }
};
