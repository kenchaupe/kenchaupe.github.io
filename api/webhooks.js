export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');

    // Mercado Pago envía la info en el cuerpo o en el query
    const { body, query } = req;
    
    // El "id" de la operación llega aquí
    const id = body.data?.id || query.id;
    const topic = body.type || query.topic;

    console.log(`Notificación recibida: Tipo ${topic} - ID ${id}`);

    // IMPORTANTE: Mercado Pago exige que respondas 200 rápido
    // para saber que recibiste el mensaje.
    res.status(200).send('OK');
}