import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');

    const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN 
    });

    const preference = new Preference(client);
    
    // Recibimos los items y la info del comprador (email y nombre) desde el HTML
    const { items, comprador } = req.body;

    try {
        const result = await preference.create({
            body: {
                items: items.map(p => ({
                    id: p.id || 'gruken-001', // Acción recomendada: Código del item
                    title: p.titulo, // Acción recomendada: Nombre del item
                    description: `Prenda Gruken: ${p.color} - Talle ${p.talla}`, // Acción recomendada: Descripción
                    category_id: 'fashion', // Acción recomendada: Categoría
                    quantity: Number(p.cantidad), // Acción recomendada: Cantidad
                    unit_price: Number(p.precio), // Acción recomendada: Precio
                    currency_id: 'ARS'
                })),
                payer: {
                    email: comprador.email, // Acción obligatoria: Email
                    name: comprador.nombre, // Acción recomendada: Nombre
                    surname: comprador.apellido // Acción recomendada: Apellido
                },
                // EL CAMBIO CLAVE PARA WEBHOOKS:
                notification_url: "https://www.gruken.com/api/webhooks",
                
                back_urls: { // Acción recomendada: Back URLs
                    success: "https://www.gruken.com/success.html",
                    failure: "https://www.gruken.com/checkout.html",
                    pending: "https://www.gruken.com/pending.html"
                },
                auto_return: "approved",
                statement_descriptor: "GRUKEN SHOP", // Acción recomendada: Resumen tarjeta
                external_reference: "PEDIDO-" + Date.now(), // Acción obligatoria: Referencia externa
                binary_mode: true // Buenas prácticas: Respuesta binaria
            }
        });

        res.status(200).json({ id: result.id });
    } catch (error) {
        console.error("Error en Mercado Pago:", error);
        res.status(500).json({ error: error.message });
    }
}