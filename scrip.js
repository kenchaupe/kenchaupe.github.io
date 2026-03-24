// ==========================================
// 1. CONFIGURACIÓN GLOBAL (SUPABASE)
// ==========================================
const supabaseUrl = 'https://pvniwivsxluujijyqqpc.supabase.co';
const supabaseKey = 'sb_publishable_ss0VcJwu1wR5OVrNn2aYUw_sGG4HiJh';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {







    // ==========================================
    // SISTEMA VIP: ENVÍO GRATIS 24H (2da Visita)
    // ==========================================
    let visitas = parseInt(localStorage.getItem('gruken_visitas')) || 0;
    
    // Solo sumamos una visita si es una sesión de navegación nueva
    if (!sessionStorage.getItem('visita_contada_hoy')) {
        visitas++;
        localStorage.setItem('gruken_visitas', visitas);
        sessionStorage.setItem('visita_contada_hoy', 'true');
    }

    // 1. REVISAMOS EL "CASTIGO" O DESCANSO DE 1 DÍA
    let cooldownFin = parseInt(localStorage.getItem('gruken_promo_descanso')) || 0;
    let enDescanso = Date.now() < cooldownFin;

    // Si tiene 2 visitas o más y NO está en descanso, es VIP
    window.esClienteVIP = (visitas >= 2) && !enDescanso; 

    if (window.esClienteVIP) {
        // Si no tiene fecha de fin, le damos 24 horas a partir de AHORA
        if (!localStorage.getItem('gruken_promo_fin')) {
            const finPromo = new Date().getTime() + (24 * 60 * 60 * 1000); 
            localStorage.setItem('gruken_promo_fin', finPromo);
        }

        const promoActiva = Date.now() < parseInt(localStorage.getItem('gruken_promo_fin'));

        if (promoActiva) {
            // Usamos memoria permanente para saber si ya vio el cartel
            const yaVioCartel = localStorage.getItem('gruken_banner_vip_mostrado');

            if (!yaVioCartel) {
                // 1. Crear el PopUp Dorado en el HTML
                const popUpVIP = document.createElement('div');
                popUpVIP.className = 'popup-vip-oro';
                popUpVIP.innerHTML = `
                    <h2>👑 Premio VIP</h2>
                    <p style="font-size: 14px; color: #ccc;">Por volver a visitarnos, tienes <strong style="color: red;">ENVÍO GRATIS</strong> en toda la tienda. ¡Aprovéchalo antes de que acabe el tiempo!</p>
                    <div class="cronometro-grande" id="reloj-vip-grande">24:00:00</div>
                `;
                document.body.appendChild(popUpVIP);

                // 2. Mostrarlo a los 15 segundos
                setTimeout(() => {
                    popUpVIP.classList.add('mostrar');
                    try { reproducirSonidoNotificacion(); } catch(e) {}

                    // Ocultar a los 7 segundos y RECIÉN AHÍ activar la magia
                    setTimeout(() => {
                        popUpVIP.classList.remove('mostrar');
                        document.body.classList.add('vip-desbloqueado');
                        
                        // Guardamos en MEMORIA que ya vio el show
                        localStorage.setItem('gruken_banner_vip_mostrado', 'true');
                        
                        if (typeof carritoHTML === "function") carritoHTML();
                    }, 7000);
                }, 15000);
            } else {
                // SI YA VIO EL CARTEL, encendemos los descuentos directamente sin sorpresas
                document.body.classList.add('vip-desbloqueado');
            }

            // 3. MOTOR DEL CRONÓMETRO (Ahora está AFUERA para que SIEMPRE corra)
            setInterval(() => {
                const fin = parseInt(localStorage.getItem('gruken_promo_fin'));
                const ahora = new Date().getTime();
                const distancia = fin - ahora;

                if (distancia > 0) {
                    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
                    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

                    const textoReloj = 
                        (horas < 10 ? "0" + horas : horas) + ":" + 
                        (minutos < 10 ? "0" + minutos : minutos) + ":" + 
                        (segundos < 10 ? "0" + segundos : segundos);

                    // Actualiza el reloj del cartel (si existe)
                    const relojGrande = document.getElementById('reloj-vip-grande');
                    if (relojGrande) relojGrande.innerText = textoReloj;

                    // Actualiza los relojes de TODAS las fotos
                    document.querySelectorAll('.timer-vip-chico').forEach(reloj => {
                        reloj.innerText = textoReloj;
                    });
                } else {
                    // SE ACABÓ EL TIEMPO (Pasaron las 24hs)
                    localStorage.removeItem('gruken_promo_fin');
                    localStorage.removeItem('gruken_banner_vip_mostrado');
                    
                    // Activamos el descanso de 24 horas (1 día sin promos)
                    const finDescanso = new Date().getTime() + (24 * 60 * 60 * 1000);
                    localStorage.setItem('gruken_promo_descanso', finDescanso);
                    
                    window.esClienteVIP = false;
                    document.body.classList.remove('vip-desbloqueado');
                    if (typeof carritoHTML === "function") carritoHTML();
                }
            }, 1000); // Se repite cada segundo

        } else {
            // Limpiador en caso de errores
            localStorage.removeItem('gruken_promo_fin');
            window.esClienteVIP = false;
        }
    } else if (enDescanso) {
        // Si está en su día de descanso y ya pasó ese día, lo liberamos
        if (Date.now() >= cooldownFin) {
            localStorage.removeItem('gruken_promo_descanso');
            // La próxima vez que entre, ¡volverá a ser VIP!
        }
    }
    // ==========================================

   
    // --- VARIABLES DE UI ---
    const carrito = document.querySelector('#lista-carrito tbody');
    const listaProductos = document.querySelector('#lista-1');
    const contenedorCarrito = document.querySelector('#carrito');
    const contadorProductos = document.querySelector('#contador-productos');
    const totalPagar = document.querySelector('#total-pagar');
    const btnComprar = document.querySelector('#Comprar');
    
    let articulosCarrito = JSON.parse(localStorage.getItem('carrito_gruken')) || [];

    // --- INICIALIZACIÓN ---
    carritoHTML();
    inicializarStockTienda(); 

    // --- EVENT LISTENERS ---
    if (listaProductos) listaProductos.addEventListener('click', agregarProducto);
    if (contenedorCarrito) contenedorCarrito.addEventListener('click', eliminarProducto);

    if (btnComprar) {
        btnComprar.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (articulosCarrito.length === 0) {
                alert("Tu carrito está vacío");
                return;
            }

            // Bloqueamos el botón para que no clickeen dos veces
            btnComprar.disabled = true;
            const textoOriginal = btnComprar.innerText;
            btnComprar.innerText = "Verificando stock...";

            try {
                let hayErrores = false;
                let mensajesError = [];

                // Recorremos el carrito
                for (let i = 0; i < articulosCarrito.length; i++) {
                    const p = articulosCarrito[i];
                    
                    // Buscamos la variante en minúsculas (importante por lo que hicimos antes)
                    const talleBusqueda = p.talla.toLowerCase().trim();
                    const colorBusqueda = p.color.toLowerCase().trim();

                    const { data: variante, error } = await _supabase
                        .from('productos_variantes')
                        .select('stock')
                        .eq('producto_id', p.id)
                        .ilike('talle', talleBusqueda)
                        .ilike('color', colorBusqueda)
                        .maybeSingle();

                    if (error) throw error;

                    if (!variante) {
                        hayErrores = true;
                        mensajesError.push(`❌ El producto "${p.titulo}" (${p.color}) ya no existe.`);
                        articulosCarrito.splice(i, 1);
                        i--;
                    } else if (variante.stock < p.cantidad) {
                        hayErrores = true;
                        if (variante.stock <= 0) {
                            mensajesError.push(`❌ Se agotó el stock de "${p.titulo}" (${p.color}).`);
                            articulosCarrito.splice(i, 1);
                            i--;
                        } else {
                            mensajesError.push(`⚠️ Solo quedan ${variante.stock} unidades de "${p.titulo}".`);
                            articulosCarrito[i].cantidad = variante.stock;
                        }
                    }
                }

                if (hayErrores) {
                    alert(mensajesError.join('\n'));
                    carritoHTML(); // Refrescamos el carrito visualmente
                    btnComprar.disabled = false;
                    btnComprar.innerText = textoOriginal;
                    return;
                }

                // Si todo está OK, vamos al checkout
                window.location.href = 'checkout.html';

            } catch (err) {
                console.error("Error en validación:", err);
                alert("Hubo un error al verificar el stock. Por favor intenta de nuevo.");
                btnComprar.disabled = false;
                btnComprar.innerText = textoOriginal;
            }
        });
    }
 

    // --- LÓGICA DE MÚSICA ---
    const audio = document.getElementById('musica-fondo');
    const btnMusica = document.getElementById('btn-musica');
    const iconoMusica = document.getElementById('icono-musica');

    if (btnMusica && audio) {
        btnMusica.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                iconoMusica.classList.replace('fa-play', 'fa-pause');
            } else {
                audio.pause();
                iconoMusica.classList.replace('fa-pause', 'fa-play');
            }
        });

        document.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => iconoMusica.classList.replace('fa-play', 'fa-pause')).catch(() => {});
            }
        }, { once: true });
    }

    // --- MANEJO DE SELECCIONES (Tallas, Colores, Cantidad) ---
    document.addEventListener('click', async (e) => {
        // Tallas y Colores
        if (e.target.classList.contains('swatch') || e.target.classList.contains('chip')) {
            const parent = e.target.parentElement;
            parent.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');

            const productoContenedor = e.target.closest('.item') || e.target.closest('.product-txt');
            if (productoContenedor) await verificarStockYPrecio(productoContenedor);
        }

        // Control de cantidad (+ y -)
        if (e.target.classList.contains('btn-cantidad')) {
            const input = e.target.parentElement.querySelector('.input-cantidad');
            let valor = parseInt(input.value);
            if (e.target.classList.contains('plus')) valor++;
            if (e.target.classList.contains('minus') && valor > 1) valor--;
            input.value = valor;
        }

        // Cierra la ventana de reseñas si se hace clic afuera
        if (!e.target.closest('.reputacion')) {
            document.querySelectorAll('.ventana-flotante-resenas').forEach(ventana => {
                ventana.classList.remove('mostrar-ventana');
            });
        }
    });

   // ==========================================
    // FUNCIONES DEL CARRITO Y STOCK LOCAL
    // ==========================================
    async function verificarStockYPrecio(productoContenedor) {
        const btnAgregar = productoContenedor.querySelector('.agregar-carrito');
        const precioEtiqueta = productoContenedor.querySelector('.precio');
        
        // El secreto 1: Convertimos el ID a número estricto
        const idTexto = btnAgregar.getAttribute('data-id');
        const idNumero = parseInt(idTexto); 
        
        const talla = productoContenedor.querySelector('.chip.selected')?.getAttribute('data-valor');
        const color = productoContenedor.querySelector('.swatch.selected')?.getAttribute('data-valor');

        if (!talla || !color) return;

        btnAgregar.textContent = "Consultando...";
        btnAgregar.disabled = true;

        // El secreto 2: Buscamos SOLO por ID
        const { data, error } = await _supabase
            .from('productos')
            .select('stock, precio')
            .eq('id', idNumero)
            .single();

        if (error || !data) {
            btnAgregar.textContent = "No disponible";
            return;
        }

        if (precioEtiqueta) precioEtiqueta.textContent = `$${data.precio.toLocaleString('es-AR')}`;

        if (data.stock <= 0) {
            btnAgregar.disabled = true;
            btnAgregar.textContent = "Agotado";
            btnAgregar.style.opacity = "0.5";
            btnAgregar.style.backgroundColor = "#ccc";
            btnAgregar.style.pointerEvents = "none";
        } else {
            btnAgregar.disabled = false;
            btnAgregar.textContent = "Agregar al carrito";
            btnAgregar.style.opacity = "1";
            btnAgregar.style.backgroundColor = ""; // Restaura color original
            btnAgregar.style.pointerEvents = "auto";
        }
    }

  async function agregarProducto(e) {
            if (e.target.classList.contains('agregar-carrito')) {
                e.preventDefault();
                const productoSeleccionado = e.target.closest('.item') || e.target.closest('.product-txt');
                
                const btn = e.target;
                const originalText = btn.textContent;
                btn.textContent = "Validando...";
                btn.disabled = true;

                const idTexto = btn.getAttribute('data-id').trim();
                
                // Leemos lo que eligió el cliente y lo pasamos a mayúsculas para comparar mejor
                const talla = productoSeleccionado.querySelector('.chip.selected')?.getAttribute('data-valor')?.trim().toUpperCase();
                const color = productoSeleccionado.querySelector('.swatch.selected')?.getAttribute('data-valor')?.trim().toUpperCase();
                const cantidadPedida = parseInt(productoSeleccionado.querySelector('.input-cantidad')?.value) || 1;

                if (!talla || !color) {
                    alert("Por favor selecciona talla y color");
                    btn.textContent = originalText;
                    btn.disabled = false;
                    return;
                }

                // LÓGICA BLINDADA: Traemos todas las variantes y buscamos la exacta ignorando espacios
                const { data, error } = await _supabase
                    .from('productos_variantes')
                    .select('talle, color, stock')
                    .ilike('producto_id', idTexto);

                if (error || !data || data.length === 0) {
                    alert("Lo sentimos, no pudimos verificar el stock en este momento.");
                } else {
                    // Buscamos la coincidencia exacta
                    const varianteExacta = data.find(v => 
                        v.talle.trim().toUpperCase() === talla && 
                        v.color.trim().toUpperCase() === color
                    );

                    if (!varianteExacta) {
                        alert("Lo sentimos, esa combinación de talla y color no existe o está agotada.");
                    } else if (varianteExacta.stock >= cantidadPedida) {
                        // ¡Si hay stock, lo agregamos al carrito!
                        leerDatosProducto(productoSeleccionado, varianteExacta.stock);
                    } else {
                        alert(`Lo sentimos, solo quedan ${varianteExacta.stock} unidades de ese color y talle.`);
                    }
                }

                btn.textContent = originalText;
                btn.disabled = false;
            }
        }

    function leerDatosProducto(producto, stockDisponible) {
        const infoProducto = {
            imagen: producto.querySelector('img')?.src || '', 
            titulo: producto.querySelector('h3').textContent,
            precio: producto.querySelector('.precio').textContent.replace(/[$.]/g, ''),
            id: producto.querySelector('.agregar-carrito').getAttribute('data-id').trim().toLowerCase(),
            color: producto.querySelector('.swatch.selected').getAttribute('data-valor'),
            talla: producto.querySelector('.chip.selected').getAttribute('data-valor'),
            cantidad: parseInt(producto.querySelector('.input-cantidad')?.value) || 1
        };

        const existe = articulosCarrito.find(p => p.id === infoProducto.id && p.color === infoProducto.color && p.talla === infoProducto.talla);
        
        if (existe) {
            if ((existe.cantidad + infoProducto.cantidad) > stockDisponible) {
                alert("Has alcanzado el límite de stock disponible para este producto.");
                return;
            }
            existe.cantidad += infoProducto.cantidad;
        } else {
            articulosCarrito.push(infoProducto);
        }

        carritoHTML();
        mostrarNotificacion(infoProducto.titulo);
    }

    function eliminarProducto(e) {
        if (e.target.classList.contains('borrar-producto')) {
            e.preventDefault();
            const id = e.target.getAttribute('data-id');
            const talla = e.target.getAttribute('data-talla');
            const color = e.target.getAttribute('data-color');

            articulosCarrito = articulosCarrito.filter(p => !(p.id === id && p.talla === talla && p.color === color));
            carritoHTML();
        }
    }

   function carritoHTML() {
        if (!carrito) return;
        carrito.innerHTML = '';
        let total = 0;
        let count = 0;

        articulosCarrito.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${p.imagen}" width="60" style="border-radius: 5px;"></td>
                <td>
                    <div class="carrito-info-prod">
                        <strong>${p.titulo}</strong><br>
                        <small>Color: ${p.color} | Talle: ${p.talla}</small>
                    </div>
                </td>
                <td>$${parseInt(p.precio).toLocaleString('es-AR')}</td>
                <td> - ${p.cantidad}</td>
                <td><a href="#" class="borrar-producto" data-id="${p.id}" data-talla="${p.talla}" data-color="${p.color}">✕</a></td>
            `;
            carrito.appendChild(row);
            total += parseInt(p.precio) * p.cantidad;
            count += p.cantidad;
        });

        // ==========================================
        // LÓGICA DE DESCUENTOS MÁGICA
        // ==========================================
        let cupon = localStorage.getItem('gruken_cupon') || "";
        let descuento = 0;
        let textoDescuento = "";

        // Revisamos qué cupón tiene guardado
        if (cupon === "GRUKEN15") { descuento = 0.15; textoDescuento = "15% OFF"; }
        else if (cupon === "GRUKEN10") { descuento = 0.10; textoDescuento = "10% OFF"; }
        else if (cupon === "ENVIOFREE") { textoDescuento = "Envío Gratis"; }

        // --- NUEVA LÓGICA VIP ---
        let promoActiva = window.esClienteVIP && 
                          localStorage.getItem('gruken_promo_fin') && 
                          Date.now() < parseInt(localStorage.getItem('gruken_promo_fin')) &&
                          localStorage.getItem('gruken_banner_vip_mostrado'); // <-- ¡Este es el candado permanente!

        if (promoActiva && textoDescuento !== "Envío Gratis") {
            // Si tiene promo VIP y no tenía otro envío gratis previo
            localStorage.setItem('gruken_envio_gratis', 'true');
        }

        // Calculamos la resta
        let montoDescuento = total * descuento;
        let totalFinal = total - montoDescuento;

        if (contadorProductos) contadorProductos.innerText = count;
        
        if (totalPagar) {
            // Actualizamos el número final
            totalPagar.innerText = totalFinal.toLocaleString('es-AR');
            
            // Creamos un cartel visual de descuento justo arriba del total
            let divDescuento = document.getElementById('cartel-descuento-carrito');
            if (!divDescuento) {
                divDescuento = document.createElement('div');
                divDescuento.id = 'cartel-descuento-carrito';
                divDescuento.style.marginBottom = '5px';
                divDescuento.style.textAlign = 'right';
                // Lo metemos justo antes de la línea del Total
                totalPagar.parentElement.parentElement.insertBefore(divDescuento, totalPagar.parentElement);
            }

           // Mostramos los textos según el premio
            if (descuento > 0) {
                divDescuento.innerHTML = `
                    <span style="color: #2e7d32; font-size: 15px; font-weight: bold;">🎁 Cupón aplicado (${textoDescuento}): -$${montoDescuento.toLocaleString('es-AR')}</span><br>
                    <span style="font-size: 13px; color: #888; text-decoration: line-through;">Subtotal sin descuento: $${total.toLocaleString('es-AR')}</span>
                `;
            } else if (textoDescuento === "Envío Gratis") {
                divDescuento.innerHTML = `<span style="color: #2e7d32; font-size: 15px; font-weight: bold;">🚚 ¡Envío Gratis Activado!</span>`;
            
            } else if (promoActiva) {
                // ==========================================
                // AGREGAMOS LA CLASE DE LATIDO AQUÍ (.texto-latido-carrito-vip)
                // ==========================================
                divDescuento.innerHTML = `
                    <span class="texto-latido-carrito-vip" style="color: #2e7d32; font-size: 15px; font-weight: bold;">
                        👑 ¡Beneficio VIP: 🚚 Envío GRATIS Activado!
                    </span>
                `;
            
            } else {
                divDescuento.innerHTML = ""; // Se oculta si no tiene premios
            }
        }

        // Guardamos las cosas en memoria
        localStorage.setItem('carrito_gruken', JSON.stringify(articulosCarrito));
        localStorage.setItem('gruken_total_final', totalFinal); // Clave para llevar el precio final al Checkout
    }

    function mostrarNotificacion(nombre) {
        let alerta = document.querySelector('.notificacion') || document.createElement('div');
        if (!alerta.classList.contains('notificacion')) {
            alerta.classList.add('notificacion');
            document.body.appendChild(alerta);
        }
        alerta.innerHTML = `✓ ${nombre} agregado al carrito`;
        alerta.classList.add('mostrar');
        setTimeout(() => alerta.classList.remove('mostrar'), 3000);
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW Error:", err));
    }
});

async function inicializarStockTienda() {
    console.log("Sincronizando tienda y organizando diseño...");
    
    try {
        const { data, error } = await _supabase.from('productos').select('*');
        if (error) throw error;
// ==========================================
        // CREACIÓN AUTOMÁTICA DE PRODUCTOS NUEVOS (CON SLIDER DE IMÁGENES)
        // ==========================================
        const contenedorPrincipal = document.querySelector('.contenedor-items'); 
        
        if (contenedorPrincipal && data) { 
            data.forEach(prodBD => {
                const existeEnPagina = document.querySelector(`.agregar-carrito[data-id="${prodBD.id}"]`);
                
                if (!existeEnPagina) {
                    const nuevaTarjeta = document.createElement('div');
                    nuevaTarjeta.className = 'item'; 
                    
                    
                    // 1. LÓGICA DE MÚLTIPLES IMÁGENES
                    // Separamos las URLs por comas (si no hay, usamos la por defecto)
                    let imagenesArray = (prodBD.imagen || 'images/default.jpg').split(',');
                    let htmlImagenes = '';

                    // ---> MAGIA VIP: Etiqueta de Envío sobre la imagen <---
                    let badgeVIP = window.esClienteVIP ? `<div class="badge-envio-vip">🚚 ENVÍO GRATIS <span class="timer-vip-chico">24:00:00</span></div>` : '';

                    // Si hay más de una imagen, armamos el HTML del mini-slider
                    if (imagenesArray.length > 1) {
                        let slides = imagenesArray.map(img => 
                            `<div class="swiper-slide"><img src="${img.trim()}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 10px;"></div>`
                        ).join('');
                        
                        htmlImagenes = `
                            <div class="swiper mini-slider-${prodBD.id}" style="border-radius: 10px; margin-bottom: 15px; position: relative;">
                                <div class="swiper-wrapper">
                                    ${slides}
                                </div>
                                <div class="swiper-pagination"></div>
                                <div class="swiper-button-next" style="color: #fff; transform: scale(0.6);"></div>
                                <div class="swiper-button-prev" style="color: #fff; transform: scale(0.6);"></div>
                                ${badgeVIP} </div>
                        `;
                    } else {
                        // Si hay una sola imagen, la mostramos normal con un contenedor relativo
                        htmlImagenes = `
                            <div style="position: relative; margin-bottom: 15px;">
                                <img src="${imagenesArray[0].trim()}" alt="${prodBD.nombre}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 10px;">
                                ${badgeVIP} </div>
                        `;
                    }

                    // ---> MAGIA MATEMÁTICA (Congelada por producto) <---
                    let idValor = String(prodBD.id).charCodeAt(0) + String(prodBD.nombre).length;
                    let ventasFijas = ((idValor * 73) % 3350) + 150;
                    let textoVentas = ventasFijas >= 1000 ? (ventasFijas / 1000).toFixed(1).replace('.0', '') + 'k' : ventasFijas;
                   // Antes era un <div> simple, ahora es nuestro botón rojo
                    let textoUltimas = (idValor % 3) === 0 ? '<div class="btn-ultimas-unidades">ÚLTIMAS UNIDADES</div>' : '';


                    // 2. DIBUJAMOS LA TARJETA (Versión limpia sin envío gratis)
                    nuevaTarjeta.innerHTML = `
                        ${htmlImagenes}
                        <div class="product-txt">
                            <h3>${prodBD.nombre}</h3>
                           <div class="contenedor-estrellas-viral">
                        <div class="estrellas-centro">
                            ${generarResenasAleatorias(prodBD.id)}
                        </div>
                        <button class="btn-compartir-viral" onclick="compartirProducto('${prodBD.nombre}', '${prodBD.id}')">
                            <i class="fa fa-share-alt"></i>
                        </button>
                    </div>
                            
                            <div class="selector-contenedor">
                                <span class="label-titulo">Cantidad:</span>
                                <div class="cantidad-control">
                                    <button class="btn-cantidad minus">-</button>
                                    <input type="number" class="input-cantidad" value="1" min="1" readonly>
                                    <button class="btn-cantidad plus">+</button>
                                </div>
                            </div>
                            
                            <div class="precio-contenedor">
                                <span class="precio">$${(prodBD.precio || 0).toLocaleString('es-AR')}</span>
                                <span class="cantidad-ventas"> 🔥 +${textoVentas} ventas</span>
                            </div>

                            <div class="contenedor-urgencia" style="display: flex; justify-content: center; width: 100%; margin-top: 10px;">
                                ${textoUltimas}
                            </div>
                            
                            <a href="#" class="float1 pulse1 agregar-carrito btn-2" data-id="${prodBD.id}">Agregar al carrito</a>
                        </div>
                    `;
                    
                    contenedorPrincipal.appendChild(nuevaTarjeta);
                    

                    // 3. ACTIVAMOS EL SLIDER SI HAY MÁS DE 1 IMAGEN
                    if (imagenesArray.length > 1) {
                        new Swiper(`.mini-slider-${prodBD.id}`, {
                            loop: true, // Para que gire infinitamente
                            pagination: {
                                el: ".swiper-pagination",
                                clickable: true,
                            },
                            navigation: {
                                nextEl: ".swiper-button-next",
                                prevEl: ".swiper-button-prev",
                            }
                        });
                    }
                }
            });
        }
        // ==========================================

        // AQUÍ SIGUE TU CÓDIGO ORIGINAL SIN CAMBIOS...
        const productoInfo = data.reduce((map, item) => {
            const limpiaId = item.id.trim().toLowerCase();
            if (!map[limpiaId]) {
                map[limpiaId] = {
                    nombre: item.nombre,
                    precio: item.precio,
                    imagen: item.imagen,
                    talles: item.talles || "Único",
                    colores: item.colores || "Único",
                    stockTotal: 0
                };
            }
            map[limpiaId].stockTotal += item.stock;
            return map;
        }, {});
        

        document.querySelectorAll('.agregar-carrito').forEach(btn => {
            const idHtml = btn.getAttribute('data-id').trim().toLowerCase();
            const datosBD = productoInfo[idHtml];

            if (datosBD) {
                const contenedorTexto = btn.closest('.product-txt');
                
                if (contenedorTexto) {
                    // ---> 1. LIMPIEZA DE SELECTORES VIEJOS (Evita duplicados) <---
                    let contenedorCantidad = null;
                    const selectoresViejos = contenedorTexto.querySelectorAll('.selector-contenedor');
                    
                    selectoresViejos.forEach(el => {
                        // Protegemos el selector de Cantidad para no borrarlo
                        if (el.textContent.includes('Cantidad')) {
                            contenedorCantidad = el; 
                        } 
                        // Borramos los colores y talles fijos del HTML viejo
                        else if (el.textContent.includes('Color') || el.textContent.includes('Talle')) {
                            el.remove(); 
                        }
                    });
                    // También borramos si quedaron inyecciones dinámicas previas
                    const duplicados = contenedorTexto.querySelectorAll('.selectores-dinamicos');
                    duplicados.forEach(el => el.remove());

                    // ---> 2. ACTUALIZACIÓN DE DATOS <---
                    const titulo = contenedorTexto.querySelector('h3');
                    if (titulo) titulo.textContent = datosBD.nombre;

                    const precioSpan = contenedorTexto.querySelector('.precio');
                    if (precioSpan) precioSpan.textContent = "$" + datosBD.precio.toLocaleString('es-AR');

                    const coloresHex = {
                     'canela': '#D2691E',
                     'blanco': '#FFFFFF',
                     'negro': '#000000',
                     'gris': '#808080',
                     'gris claro': '#D3D3D3',
                     'gris oscuro': '#A9A9A9',
                     'melange': '#B5B5B5',
                     'plata': '#C0C0C0',
                     'plomo': '#666666',
                      
                       // 🟤 Tonalidades Tierra, Nude y Cálidos
                     'beige': '#F5F5DC',
                     'crudo': '#F2EFE9',
                     'arena': '#F4A460',
                     'camel': '#C19A6B',
                     'topo': '#8B8589',
                     'marron': '#8B4513',
                     'chocolate': '#D2691E',
                     'terracota': '#E2725B',
                     'tostado': '#D2B48C',
                     'habano': '#593e26',

                       // 🔴 Rojos y Rosados
                     'rojo': '#FF0000',
                     'bordo': '#800000',
                     'granate': '#800000',
                     'coral': '#FF7F50',
                     'salmon': '#FA8072',
                     'rosa': '#FFC0CB',
                     'rosa bebe': '#F4C2C2',
                     'rosa chicle': '#FF69B4',
                     'rosa viejo': '#C08081',
                     'fucsia': '#FF00FF',
                     'magenta': '#FF00FF',

                       // 🔵 Azules y Celestes
                     'azul': '#0000FF',
                     'azul marino': '#000080',
                     'azul francia': '#318CE7',
                     'celeste': '#87CEEB',
                     'celeste bebe': '#BFEFFF',
                     'denim': '#1560BD',
                     'indigo': '#4B0082',
                     'turquesa': '#40E0D0',
                     'aqua': '#00FFFF',

                      // 🟢 Verdes
                     'verde': '#008000',
                     'verde militar': '#4B5320',
                     'verde oliva': '#808000',
                     'esmeralda': '#50C878',
                     'menta': '#98FF98',
                     'musgo': '#8A9A5B',
                     'lima': '#BFFF00',
                     'pistacho': '#93C572',
                      'cobre': '#B87333',
                      // 🟡 Amarillos y Naranjas
                     'amarillo': '#FFFF00',
                     'amarillo patito': '#FFFF99',
                     'mostaza': '#FFDB58',
                     'naranja': '#FFA500',
                     'ocre': '#CC7722',
                     'dorado': '#FFD700',
                      'durazno': '#FFDAB9',
                     'melange oscuro': '#5A5A5A',
                     'violeta': '#EE82EE',
                     'purpura': '#800080',
                     'lila': '#C8A2C8',
                     'lavanda': '#E6E6FA',
                     'ciruela': '#DDA0DD'
                    };

                    const tallesStr = String(datosBD.talles || "Único");
                    const htmlTalles = tallesStr.split(',').map(t => `<div class="chip" data-valor="${t.trim()}">${t.trim()}</div>`).join('');
                    
                    const coloresStr = String(datosBD.colores || "Único");
                    const htmlColores = coloresStr.split(',').map(c => {
                        let clave = c.trim().toLowerCase();
                        let fondo = coloresHex[clave] || '#eeeeee';
                        return `<div class="swatch" data-valor="${c.trim()}" style="background-color: ${fondo};" title="${c.trim()}"></div>`;
                    }).join('');

                    // ---> 3. CREACIÓN CON EL DISEÑO EXACTO ORIGINAL <---
                    const divSelectores = document.createElement('div');
                    divSelectores.className = 'selectores-dinamicos';
                    
                    // Recreamos exactamente la estructura de tu index.html original para que respete tu style.css
                    divSelectores.innerHTML = `
                        <div class="selector-contenedor">
                            <span class="label-titulo">Color:</span>
                            <div class="color-swatches" data-tipo="color">
                                ${htmlColores}
                            </div>
                        </div>
                        <div class="selector-contenedor">
                            <span class="label-titulo">Talle:</span>
                            <div class="talla-chips" data-tipo="talla">
                                ${htmlTalles}
                            </div>
                        </div>
                    `;

                    // ---> 4. INSERTAR EN EL LUGAR CORRECTO (Arriba de Cantidad) <---
                    if (contenedorCantidad) {
                        contenedorCantidad.parentNode.insertBefore(divSelectores, contenedorCantidad);
                    } else if (precioSpan) {
                        precioSpan.parentNode.insertBefore(divSelectores, precioSpan);
                    }
                    divSelectores.querySelectorAll('.chip, .swatch').forEach(el => {
                        el.onclick = (e) => {
                            const hermanos = el.parentElement.querySelectorAll(el.classList[0] === 'chip' ? '.chip' : '.swatch');
                            hermanos.forEach(h => {
                                h.style.border = '1px solid #ccc';
                                h.style.transform = 'scale(1)';
                            });
                            el.style.border = '2px solid #000';
                            if(el.classList.contains('swatch')) el.style.transform = 'scale(1.2)';
                        };
                    });
                }

                const sinStock = datosBD.stockTotal <= 0;
                btn.disabled = sinStock;
                btn.textContent = sinStock ? "Agotado" : "Agregar al carrito";
                btn.style.backgroundColor = sinStock ? "#ff0000" : "";
            }
        });
        // ==========================================
        // 🚀 ¡AQUÍ PEGA LA LÍNEA!
        // ==========================================
        iniciarNotificacionesVenta(data); 
        // ==========================================

    } catch (error) {
        console.error("Error:", error);
    }
}
window.compartirProducto = async function(nombre, id) {
    // Reemplaza "TU_ID_PROYECTO" por el ID que sale en tu URL de Supabase
    const linkInteligente = `https://TU_ID_PROYECTO.supabase.co/functions/v1/compartir?id=${id}`;
    
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Gruken Luxury',
                text: `¡Mira esta prenda de Gruken! 🧥\n`,
                url: linkInteligente
            });
        } else {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(nombre + " " + linkInteligente)}`, '_blank');
        }
    } catch (e) { console.log("Cerrado"); }
};

window.toggleRecomendaciones = function(boton) {
    const contenedorReputacion = boton.closest('.reputacion');
    const ventana = contenedorReputacion.querySelector('.ventana-flotante-resenas');

    document.querySelectorAll('.ventana-flotante-resenas').forEach(v => {
        if (v !== ventana) v.classList.remove('mostrar-ventana');
    });

    if (ventana) ventana.classList.toggle('mostrar-ventana');
};

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key.toLowerCase() === 'x') {
        toggleInventarioFlotante();
    }
});

function toggleInventarioFlotante() {
    let modal = document.getElementById('modal-inventario');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-inventario';
        modal.classList.add('activo');
        modal.innerHTML = `
            <div class="inventario-flotante" style="position: relative;">
                <button class="cerrar-inventario" onclick="cerrarYSalirInventario()" style="position: absolute; top: 15px; right: 20px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; font-size: 18px; cursor: pointer; z-index: 10000; box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: 0.3s;">
                    <i class="fa fa-times"></i>
                </button>
                <iframe src="admin.html" class="iframe-inventario" style="width: 100%; height: 100%; border: none; border-radius: 15px;"></iframe>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.classList.toggle('activo');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarStockTienda();
    aplicarConfiguracionWeb();
});

async function aplicarConfiguracionWeb() {
    const { data, error } = await _supabase.from('configuracion').select('*').eq('id', 1).single();
    
    if (error || !data) {
        console.error("No se pudo cargar la configuración visual:", error);
        return; 
    }

    if (data.nombre) document.getElementById('titulo-pagina').textContent = data.nombre;

    if (data.logo) {
        const logo = document.getElementById('logo-pagina');
        if (logo) logo.src = data.logo;
    }

    if (data.favicon) {
        const favicon = document.getElementById('favicon-pagina');
        if (favicon) favicon.href = data.favicon;
    }

    if (data.email) {
        const emailLi = document.getElementById('footer-email');
        if (emailLi) {
            emailLi.textContent = data.email;
            emailLi.href = "mailto:" + data.email;
        }
    }

    if (data.web) {
        const webLi = document.getElementById('footer-web');
        if (webLi) {
            webLi.textContent = data.web;
            webLi.href = data.web.startsWith('http') ? data.web : 'https://' + data.web;
        }
    }

    if (data.wsp) {
        const wspLimpio = data.wsp.replace(/[^0-9+]/g, ''); 
        
        const wspFooter = document.getElementById('footer-wsp');
        if (wspFooter) {
            wspFooter.textContent = data.wsp;
            wspFooter.href = `https://api.whatsapp.com/send?phone=${wspLimpio}`;
        }

        const wspFlotante = document.getElementById('wsp-flotante');
        if (wspFlotante) {
            wspFlotante.href = `https://api.whatsapp.com/send?phone=${wspLimpio}&text=Hola,%20me%20gustaría%20obtener%20más%20información`;
        }
    }

    if (data.tiktok) {
        const linkTikTok = document.getElementById('link-tiktok');
        if (linkTikTok) linkTikTok.href = data.tiktok;
    }
    if (data.facebook) {
        const linkFacebook = document.getElementById('link-facebook');
        if (linkFacebook) linkFacebook.href = data.facebook;
    }
    if (data.instagram) {
        const linkInstagram = document.getElementById('link-instagram');
        if (linkInstagram) linkInstagram.href = data.instagram;
    }
    if (data.youtube) {
        const linkYouTube = document.getElementById('link-youtube');
        if (linkYouTube) linkYouTube.href = data.youtube;
    }
}
function generarResenasAleatorias(idProducto) {
    // --- MAGIA MATEMÁTICA DEFINITIVA (Dispersión extrema) ---
    let valorBase = 0;
    let textoId = String(idProducto || "gruken");
    
    for (let i = 0; i < textoId.length; i++) {
        // Sumamos el valor de cada letra/número
        valorBase += textoId.charCodeAt(i) * (i + 1);
    }
    // Multiplicamos por un número primo grande para separar IDs consecutivos (ej: el 1 del 2)
    valorBase = valorBase * 8743; 
    
    let contadorAzar = 0;
    function azarFijo() {
        contadorAzar++;
        // Usamos trigonometría: salta de forma caótica pero siempre da el mismo resultado para el mismo ID
        let x = Math.sin(valorBase + contadorAzar) * 10000;
        return x - Math.floor(x);
    }
    // --------------------------------------------------------

    // Listas de datos para combinar (TU DISEÑO INTACTO)
   const nombres = [
        // Tus nombres anteriores + algunos nuevos
        "Jessica M.", "Juan G.", "Pedro S.", "Maria L.", "Ana G.", "Juan P.", 
        "Lucía M.", "Carlos R.", "Marta S.", "Roberto F.", "Camila T.", "Gastón B.",
        "Sofía R.", "Diego T.", "Valentina C.", "Martín L.", "Florencia B.", 
        "Eduardo M.", "Natalia R.", "Sergio L.", "Mariana V.", "Pablo D.",
        "Andrea C.", "Javier F.", "Laura P.", "Gonzalo S.", "Silvia N."
    ];
    const comentarios = [
        // Reseñas clásicas y entusiastas
        "Excelente tela.", 
        "Me encantó el talle.", 
        "Llegó muy rápido.", 
        "Muy buena atención.", 
        "Excelente calidad, muy recomendado.", 
        "Me encantó el producto, talle perfecto.", 
        "La tela es de primera.", 
        "Volveré a comprar sin duda.",
        "El algodón es súper suave, ideal para mi bebé.",
        "Hermoso diseño, tal cual se ve en la foto.",
        "Súper abrigadito para el invierno.",
        "Muy prolijas las costuras y las terminaciones.",
        
        // --- NUEVAS: Reseñas Neutras y Directas ---
        "Todo correcto, llegó a tiempo.",
        "El producto es tal cual la descripción.",
        "Buena relación calidad-precio.",
        "Cumple con lo esperado.",
        "Llegó bien embalado y en condiciones.",
        "El pedido llegó dentro del plazo establecido.",
        "Es exactamente lo que pedí.",
        "Talle correcto, sin problemas.",
        "Todo en orden con la compra.",
        "Satisfecha con el producto."
    ];

    // VOLVEMOS A TU RANGO ESTRELLA: Solo entre 4.7 y 5.0
    const puntuacion = (azarFijo() * (5.0 - 4.7) + 4.7).toFixed(1);
    
    // Entre 4 y 6 reseñas por prenda
    const cantResenas = Math.floor(azarFijo() * 3) + 4; 
    let listaHTML = '';

    for (let i = 0; i < cantResenas; i++) {
        const nom = nombres[Math.floor(azarFijo() * nombres.length)];
        const com = comentarios[Math.floor(azarFijo() * comentarios.length)];
        listaHTML += `<p>⭐ "${com}" - <strong>${nom}</strong></p>`;
    }

    return `
        <div class="reputacion" style="position: relative;">
            <button class="btn-ver-recomendaciones" onclick="toggleRecomendaciones(this)">
                <div class="estrellas">
                    <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>
                    <span class="puntuacion">${puntuacion}</span>
                </div>
                <small>Calificaciones</small>
            </button>
            <div class="ventana-flotante-resenas">
                <h4>Opiniones destacadas</h4>
                <div class="lista-scroll">
                    ${listaHTML}
                </div>
            </div>
        </div>
    `;
}

async function cerrarYSalirInventario() {
    let modal = document.getElementById('modal-inventario');
    
    if (modal) {
        modal.classList.remove('activo');
        let iframe = modal.querySelector('.iframe-inventario');
        if (iframe) iframe.src = 'admin.html';
    }
    
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error("Error al cerrar sesión:", error.message);
    }
}

// 🔍 LÓGICA DEL BUSCADOR DE PRODUCTOS
document.addEventListener('DOMContentLoaded', () => {
    const inputBuscador = document.getElementById('buscador-productos');

    if (inputBuscador) {
        inputBuscador.addEventListener('input', function(e) {
            // Pasamos lo que el usuario escribe a minúsculas
            const terminoDeBusqueda = e.target.value.toLowerCase().trim();
            
            // Seleccionamos todos los productos (las "cajas")
            const productosEnPantalla = document.querySelectorAll('.contenedor-items .item');

            productosEnPantalla.forEach(producto => {
                const tituloElemento = producto.querySelector('.product-txt h3');
                
                // Verificamos que el producto tenga un título (para no afectar a la plantilla oculta)
                if (tituloElemento && tituloElemento.textContent.trim() !== '') {
                    const nombreProducto = tituloElemento.textContent.toLowerCase();
                    
                    // Si el nombre incluye lo que se buscó, lo mostramos. Si no, lo ocultamos.
                    if (nombreProducto.includes(terminoDeBusqueda)) {
                        producto.style.display = ''; // Vuelve a su estado original (visible)
                    } else {
                        producto.style.display = 'none'; // Se oculta
                    }
                }
            });
        });
    }
});

// ==========================================
// 1. REGISTRO DEL SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Error SW:', err));
    });
}

// ==========================================
// 2. LÓGICA DEL BANNER (CON MEMORIA DE INSTALACIÓN)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let eventoDeInstalacion;
    const bannerInstalacion = document.getElementById('pwa-install-banner');
    const btnInstalar = document.getElementById('btn-instalar');
    const btnCerrar = document.getElementById('btn-cerrar-pwa');

    // 1. Revisamos la memoria y el modo de pantalla
    const yaInstalado = localStorage.getItem('gruken_app_instalada');
    const bannerCerrado = localStorage.getItem('gruken_banner_cerrado');
    // Detecta si la web ya se está abriendo como aplicación desde el celular
    const esModoApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Capturamos el permiso de instalación nativo
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        eventoDeInstalacion = e;
    });

    // 2. Solo mostramos el cartel a los 3 segundos si: 
    // NO está instalado, NO lo cerraron antes, y NO lo están viendo desde la app
    if (bannerInstalacion && !yaInstalado && !bannerCerrado && !esModoApp) {
        setTimeout(() => {
            bannerInstalacion.style.display = 'flex';
        }, 3000);
    }

    // Acción al tocar "Instalar"
    if (btnInstalar) {
        btnInstalar.addEventListener('click', async () => {
            bannerInstalacion.style.display = 'none';
            
            // Guardamos en la memoria que ya eligió instalar
            localStorage.setItem('gruken_app_instalada', 'true');

            if (eventoDeInstalacion) {
                eventoDeInstalacion.prompt();
                const resultado = await eventoDeInstalacion.userChoice;
                eventoDeInstalacion = null;
            } else {
                alert("Para instalar la app de Gruken:\n\n1. Toca los 3 puntitos del navegador.\n2. Selecciona 'Agregar a la pantalla principal' o 'Instalar aplicación'.");
            }
        });
    }

    // Acción al tocar la "X"
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            if (bannerInstalacion) {
                bannerInstalacion.style.display = 'none';
                
                // Guardamos en la memoria que cerró el cartel para no volver a mostrarlo
                localStorage.setItem('gruken_banner_cerrado', 'true');
            }
        });
    }
});
// ==========================================
// MOTOR PROPIO DE CONFETI PARA GRUKEN
// ==========================================
function lanzarCelebracion() {
    const duracion = 3 * 1000;
    const final = Date.now() + duracion;

    const intervalo = setInterval(function() {
        const tiempoRestante = final - Date.now();

        if (tiempoRestante <= 0) {
            return clearInterval(intervalo);
        }

        const particleCount = 50 * (tiempoRestante / duracion);
        
        // Lanzamos confeti desde dos puntos (izquierda y derecha)
        confetti(Object.assign({}, { 
            particleCount, 
            spread: 70, 
            origin: { x: 0.1, y: 0.5 },
            colors: ['#ff4444', '#ffffff', '#ffbb33'] 
        }));
        confetti(Object.assign({}, { 
            particleCount, 
            spread: 70, 
            origin: { x: 0.9, y: 0.5 },
            colors: ['#00C851', '#ffffff', '#333333'] 
        }));
    }, 250);
}
// ==========================================
// MOTOR FÍSICO DE LA RULETA (CÁMARA LENTA EXTREMA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const modalRuleta = document.getElementById('modal-ruleta');
    const btnCerrarRuleta = document.getElementById('btn-cerrar-ruleta');
    const btnGirar = document.getElementById('btn-girar-ruleta');
    const ruleta = document.getElementById('ruleta-giratoria');
    const mensajePremio = document.getElementById('mensaje-premio');
    const puntero = document.querySelector('.puntero-ruleta');

    const ruletaJugada = localStorage.getItem('gruken_ruleta_jugada');

    // Salto de espera inicial
    if (puntero) puntero.classList.add('puntero-esperando');

    if (modalRuleta && !ruletaJugada) {
        setTimeout(() => {
            modalRuleta.classList.remove('modal-ruleta-oculta');
            modalRuleta.classList.add('modal-ruleta-activa');
        }, 14000); // 14000 milisegundos = 14 segundos
    }

    if (btnCerrarRuleta) {
        btnCerrarRuleta.addEventListener('click', () => {
            modalRuleta.classList.remove('modal-ruleta-activa');
            modalRuleta.classList.add('modal-ruleta-oculta');
            localStorage.setItem('gruken_ruleta_jugada', 'true');
        });
    }

    // --- LA MAGIA DE LA CÁMARA LENTA ---
    // Esta curva hace que consuma casi todo el tiempo en el último 2% del giro
    function frenoCamaraLenta(t) {
        return 1 - Math.pow(1 - t, 3.5); 
    }

   if (btnGirar) {
        btnGirar.addEventListener('click', () => {
            // 1. VALIDAR CORREO ANTES DE GIRAR
            const emailInput = document.getElementById('email-ruleta');
            const mensajeError = document.getElementById('mensaje-error-ruleta');
            const correoUsuario = emailInput ? emailInput.value.trim() : '';

            // Si el correo está vacío o no tiene @, frenamos la ruleta
            if (!correoUsuario || !correoUsuario.includes('@')) {
                if (mensajeError) mensajeError.style.display = 'block';
                return; 
            }
            
            // Si está bien, ocultamos error y bloqueamos la casilla
            if (mensajeError) mensajeError.style.display = 'none';
            if (emailInput) {
                emailInput.disabled = true;
                emailInput.style.opacity = '0.5';
            }

            btnGirar.disabled = true;
            btnGirar.style.opacity = '0.5';
            mensajePremio.textContent = "¡Mucha suerte!...";
            
            if (puntero) puntero.classList.remove('puntero-esperando');
           // =========================================
            // CARGA DE SONIDOS
            // =========================================
            const sonidoTick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            sonidoTick.volume = 0.3;
            const sonidoFestejo = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
            sonidoFestejo.volume = 0.8;
            // =========================================
            const premios = [
                { texto: "¡25% OFF!", permitido: false },
                { texto: "¡Envío Gratis", permitido: true },
                { texto: "¡30% OFF!", permitido: false },
                { texto: "¡10% OFF!", permitido: true },
                { texto: "¡Envío Gratis!", permitido: true },
                { texto: "¡15% OFF!", permitido: true },
                { texto: "¡Envío Gratis!", permitido: true },
                { texto: "¡20% OFF!", permitido: false }
            ];

            const permitidos = [];
            premios.forEach((premio, index) => {
                if (premio.permitido) permitidos.push({ index: index, texto: premio.texto }); 
            });
            const ganador = permitidos[Math.floor(Math.random() * permitidos.length)];
            const gradosPorcion = (ganador.index * 45) + 22.5; 
            const gradosParada = 360 - gradosPorcion;
            const variacionVisual = Math.floor(Math.random() * 20) - 10;
            
            // Damos entre 10 y 14 vueltas para acumular mucha inercia inicial
            const girosDeAnimacion = (Math.floor(Math.random() * 5) + 10) * 360; 
            const giroTotal = girosDeAnimacion + gradosParada + variacionVisual;

            let tiempoInicio = null;
            // Extendemos el tiempo a 8.5 segundos para disfrutar el suspenso
            const duracionGiro = 8500; 
            let ultimoSectorPasado = 0;

            function animarFrames(tiempoActual) {
                if (!tiempoInicio) tiempoInicio = tiempoActual;
                let tiempoTranscurrido = tiempoActual - tiempoInicio;
                
                let progreso = Math.min(tiempoTranscurrido / duracionGiro, 1);
                let progresoFrenado = frenoCamaraLenta(progreso);
                let gradosMilisegundo = giroTotal * progresoFrenado;
                
                ruleta.style.transform = `rotate(${gradosMilisegundo}deg)`;

                let sectorActual = Math.floor(gradosMilisegundo / 45);
                
              if (sectorActual !== ultimoSectorPasado) {
                    ultimoSectorPasado = sectorActual;
                    
                    // =========================================
                    // REPRODUCIR TICK SIN DESCARGAR DE NUEVO
                    // =========================================
                    sonidoTick.currentTime = 0; // Lo rebobinamos al segundo cero para que suene rápido
                    sonidoTick.play().catch(() => {});
                    // =========================================

                    puntero.style.transform = 'translateX(-50%) rotate(-35deg)';
                    
                    // Sincronizamos el "cansancio" del puntero con la rueda
                    let velocidadRetorno = 30; // Arranca rapidísimo
                    if (progreso > 0.6) velocidadRetorno = 80;   // Empieza a frenar
                    if (progreso > 0.8) velocidadRetorno = 200;  // Lento
                    if (progreso > 0.9) velocidadRetorno = 450;  // Cámara lenta
                    if (progreso > 0.95) velocidadRetorno = 800; // Agónico final

                    setTimeout(() => {
                        puntero.style.transform = 'translateX(-50%) rotate(0deg)';
                    }, velocidadRetorno);
                }

         if (progreso < 1) {
                    requestAnimationFrame(animarFrames);
                } else {
                    // =========================================
                    // TARJETA BLACK & GOLD SOBRE LA RULETA
                    // =========================================
                    
                    // 1. SONIDO DE FIESTA
                    const audioVictoria = new Audio('https://soundbible.com/mp3/Kids%20Cheering-SoundBible.com-681813822.mp3');
                    audioVictoria.volume = 1.0;
                    audioVictoria.play().catch(() => {});

                    // 2. BUSCAMOS EL CÓDIGO DE DESCUENTO
                  // 2. BUSCAMOS EL CÓDIGO DE DESCUENTO
                    let codigoDescuento = "";
                    if (ganador.texto.includes("15% OFF")) codigoDescuento = "GRUKEN15";
                    else if (ganador.texto.includes("10% OFF")) codigoDescuento = "GRUKEN10";
                    else if (ganador.texto.includes("Envío Gratis")) codigoDescuento = "ENVIOFREE";

                    // === NUEVO: GUARDAR CUPÓN AUTOMÁTICAMENTE ===
                    if (codigoDescuento !== "") {
                        localStorage.setItem('gruken_cupon', codigoDescuento); // Se lo guarda en su celular
                        if (typeof carritoHTML === "function") carritoHTML(); // Actualiza el carrito al instante
                    }

                    // Estilos CSS de la Tarjeta VIP Flotante
                    const estiloTarjetaPremium = `
                        <style>
                            @keyframes revelarPremium {
                                0% { opacity: 0; transform: translate(-50%, -40%) scale(0.8) rotateX(20deg); }
                                100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotateX(0deg); }
                            }
                            .tarjeta-premium {
                                position: absolute; /* Esto hace que flote exactamente ENCIMA de la ruleta */
                                top: 45%;
                                left: 50%;
                                width: 85%;
                                max-width: 340px;
                                background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
                                border: 2px solid #D4AF37; /* Borde Dorado */
                                border-radius: 16px;
                                box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(212, 175, 55, 0.3);
                                padding: 35px 20px;
                                text-align: center;
                                color: #fff;
                                z-index: 2000; /* Para que tape todo lo demás */
                                animation: revelarPremium 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                                font-family: 'Poppins', sans-serif;
                            }
                            .tarjeta-premium h3 {
                                font-family: 'Oswald', sans-serif;
                                text-transform: uppercase;
                                font-size: 28px;
                                margin: 0 0 10px 0;
                                letter-spacing: 3px;
                                /* Letras color Oro con brillo */
                                background: linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                            }
                            .tarjeta-premium .codigo-gold {
                                background: rgba(212, 175, 55, 0.08);
                                border: 1px dashed #D4AF37;
                                color: #FCF6BA;
                                padding: 12px;
                                font-size: 24px;
                                font-weight: 600;
                                letter-spacing: 5px;
                                margin-top: 15px;
                                border-radius: 8px;
                                user-select: all;
                            }
                        </style>
                    `;

                    // Mostrar la tarjeta
                    if (codigoDescuento !== "") {
                        mensajePremio.innerHTML = estiloTarjetaPremium + `
                            <div class="tarjeta-premium">
                                <h3>VIP REWARD</h3>
                                <p style="color: #999; font-size: 13px; text-transform: uppercase; margin:0 0 5px 0; letter-spacing: 1px;">Has desbloqueado:</p>
                                <div style="font-size: 26px; font-weight: bold; color: #fff; margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${ganador.texto}</div>
                                <p style="color: #777; font-size: 11px; text-transform: uppercase; margin:0; letter-spacing: 2px;">Tu código exclusivo:</p>
                                <div class="codigo-gold" title="Copia tu código">${codigoDescuento}</div>
                            </div>
                        `;
                        if (typeof lanzarCelebracion === "function") lanzarCelebracion(); 
                    } else {
                        mensajePremio.innerHTML = estiloTarjetaPremium + `
                            <div class="tarjeta-premium">
                                <h3>VIP REWARD</h3>
                                <p style="color: #999; font-size: 13px; text-transform: uppercase; margin:0 0 5px 0; letter-spacing: 1px;">Has ganado:</p>
                                <div style="font-size: 28px; font-weight: bold; color: #fff; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${ganador.texto}</div>
                                <p style="color: #D4AF37; font-size: 16px; margin-top: 15px; font-weight: 600;">¡Felicidades!</p>
                            </div>
                        `;
                        if (typeof lanzarCelebracion === "function") lanzarCelebracion();
                    }

                    // 3. GUARDAR CORREO, PREMIO Y FECHA EN SUPABASE
                    localStorage.setItem('gruken_ruleta_jugada', 'true');
                    const emailInput = document.getElementById('email-ruleta');
                    const correoFinal = emailInput ? emailInput.value.trim() : '';
                    
                    const guardarEnBD = async () => {
                        if (typeof _supabase !== 'undefined') {
                            await _supabase.from('premios_ruleta').insert([{ 
                                contacto: correoFinal, 
                                premio: ganador.texto,
                                created_at: new Date().toISOString() 
                            }]);
                        }
                    };
                    guardarEnBD();

                    // 4. OCULTAR RULETA A LOS 10 SEGUNDOS (le damos un poco más de tiempo para que copie el código)
                    setTimeout(() => {
                        const modal = document.getElementById('modal-ruleta') || document.querySelector('.modal-ruleta');
                        if (modal) {
                            modal.classList.remove('modal-ruleta-activa');
                            modal.classList.add('modal-ruleta-oculta');
                            setTimeout(() => modal.style.display = 'none', 500);
                        }
                    }, 10000);
                }
            }

            requestAnimationFrame(animarFrames);
        });
    }
});


    let notificacionEnPantalla = false; // <-- El semáforo para evitar que se pisen

function iniciarNotificacionesVenta(productos) {
    if (!productos || productos.length === 0) return;

    // 1. Creamos el elemento en el HTML (solo una vez)
    const divNotif = document.createElement('div');
    divNotif.className = 'notificacion-compra';
    document.body.appendChild(divNotif);

    const nombres = [
        "Florencia", "Matías", "Agustina", "Juan", "Romina", "Lucas", "Valeria", "Gastón", "Paula", "Diego",
        "Camila", "Santiago", "Valentina", "Nicolás", "Sofía", "Martín", "Lucía", "Facundo", "Micaela", "Ignacio",
        "Julieta", "Tomás", "Antonella", "Joaquín", "Martina", "Federico", "Bautista", "Carolina", "Emiliano", 
        "Catalina", "Gonzalo", "Milagros", "Lautaro", "Guillermina", "Leandro", "Rocío", "Ezequiel", "Daniela"
    ];

    const ciudades = [
        // --- BUENOS AIRES Y CABA (Mayor cantidad) ---
        "CABA", "La Plata", "Mar del Plata", "Tandil", "Bahía Blanca", "Quilmes", "Lomas de Zamora", 
        "Morón", "Avellaneda", "San Isidro", "Vicente López", "Lanús", "San Martín", "Pilar", "Tigre", 
        "Zárate", "Campana", "Pergamino", "Junín", "Olavarría", "San Nicolás", "Ezeiza", "San Miguel",
        "Ituzaingó", "Tres de Febrero", "San Justo", "Chivilcoy", "Necochea",
        "Córdoba", "Rosario", "Mendoza", "Salta", "Neuquén", "San Miguel de Tucumán", "Santa Fe", 
        "San Juan", "Resistencia", "Posadas", "San Salvador de Jujuy", "Corrientes", "Paraná", 
        "Santiago del Estero", "Formosa", "Catamarca", "San Luis", "La Rioja", "Santa Rosa", 
        "Rawson", "Viedma", "Ushuaia", "Río Gallegos", "Bariloche", "San Rafael", "Villa Carlos Paz", 
        "Puerto Madryn", "Comodoro Rivadavia", "Concordia", "Gualeguaychú", "Trelew"
    ];

    const mostrarSiguienteVenta = () => {
        // --- VALIDACIÓN ANTI-CHOQUE ---
        // Si ya hay una notificación visible, esperamos 5 segundos y volvemos a intentar
        if (notificacionEnPantalla) {
            setTimeout(mostrarSiguienteVenta, 5000);
            return;
        }

        notificacionEnPantalla = true; // Bloqueamos el paso

        const producto = productos[Math.floor(Math.random() * productos.length)];
        const nombre = nombres[Math.floor(Math.random() * nombres.length)];
        const ciudad = ciudades[Math.floor(Math.random() * ciudades.length)];
        
        const minutos = Math.floor(Math.random() * 59) + 1;
        const horas = Math.floor(Math.random() * 2) + 1;
        const tiempoTexto = Math.random() > 0.6 ? `Hace ${horas} hora${horas > 1 ? 's' : ''}` : `Hace ${minutos} min.`;

        divNotif.innerHTML = `
            <img src="${producto.imagen.split(',')[0]}" class="img-notif">
            <div class="texto-notif">
                <strong>${nombre}</strong> compró <strong>${producto.nombre}</strong><br>
                <span class="tiempo-notif">
                    <span class="punto-vivo"></span> ${tiempoTexto} desde ${ciudad}
                </span>
            </div>
        `;

        // Aparece con la animación lenta que te gusta
        divNotif.classList.add('activa');

        // Se queda 7 segundos
        setTimeout(() => {
            divNotif.classList.remove('activa');
            
            // Esperamos 1.5 segundos extra (después de que baje) para liberar el semáforo
            setTimeout(() => {
                notificacionEnPantalla = false; 
            }, 1000);

        }, 7000);

        // Programamos la siguiente (entre 45s y 2min)
        const siguienteCita = Math.floor(Math.random() * 70000) + 50000;
        setTimeout(mostrarSiguienteVenta, siguienteCita);
    };

    setTimeout(mostrarSiguienteVenta, 25000);
}


// ==========================================
// AUTO-ZOOM AL HACER SCROLL EN CELULARES
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // Solo activamos esta magia si están viéndolo desde un celular
    if (window.innerWidth <= 768) {
        
        // Creamos nuestro "vigilante" de la pantalla (IntersectionObserver)
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                // Si el producto entra en la "zona mágica" del centro
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('enfocado-scroll');
                } else {
                    // Si el producto sale del centro (arriba o abajo), se achica de nuevo
                    entrada.target.classList.remove('enfocado-scroll');
                }
            });
        }, {
            // Esto recorta la pantalla: el efecto solo se activa en el 50% central (ignora los bordes de arriba y abajo)
            rootMargin: "-25% 0px -25% 0px", 
            threshold: 0.3 // Necesita que al menos el 30% del producto sea visible para hacer el efecto
        });

        // Buscamos todas las tarjetas de los productos y le decimos al vigilante que las observe
        const productos = document.querySelectorAll('.contenedor-items .item');
        productos.forEach(producto => {
            observador.observe(producto);
        });
    }
});




// ==========================================
// ESCUDO PROTECTOR GRUKEN (Anti-Copiado)
// ==========================================

// 1. Bloquear el clic derecho para que no puedan dar a "Inspeccionar"
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// 2. Bloquear atajos de teclado de desarrollador (F12, Ctrl+Shift+I, U)
document.onkeydown = function(e) {
    // Bloquear F12
    if(e.keyCode == 123) return false;
    
    // Bloquear Ctrl+Shift+I (Inspeccionar)
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
    
    // Bloquear Ctrl+Shift+J (Consola)
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
    
    // Bloquear Ctrl+U (Ver código fuente)
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
    
    // Bloquear Ctrl+S (Guardar página)
    if(e.ctrlKey && e.keyCode == 'S'.charCodeAt(0)) return false;
};

