# GanáYa — Estrategia de monetización y estado del proyecto

Última actualización: 26/10/2026

## 1. Qué hay hoy en el repo

- Landing de waitlist en Next.js 14 (`ganaya-waitlist/`), un solo componente cliente (`app/GanayaWaitlist.js`).
- Funnel: hero → 6 preguntas de perfilado (edad, género, ciudad, premios, tipo de misión, apps que usa) → email + WhatsApp opcional → pantalla de referidos.
- Persistencia: Supabase REST directo desde el navegador (`/rest/v1/waitlist`) con la anon key.
- Tracking: PostHog (autocapture + eventos de funnel), Meta Pixel (`Lead` al completar), UTMs guardadas en sessionStorage.
- Referidos: código `GY` + 6 caracteres aleatorios generado en el cliente, link `?ref=` y share por WhatsApp.
- Último commit: 25/04/2026. No hay producto todavía (ni offerwall, ni saldo, ni canje).

## 2. Reflexión sobre lo que hay

### Lo que está bien
- El perfilado es oro para el negocio: ya preguntás qué apps usan (MercadoPago, Ualá, Brubank, Lemon, Personal, Claro). Eso es exactamente lo que necesita un anunciante CPA argentino.
- Instrumentación correcta desde el día 1 (PostHog + Pixel + UTMs): permite medir CAC por canal.
- Loop viral por WhatsApp, que es el canal correcto en Argentina.

### Problemas a resolver
1. **Seguridad de datos (prioridad alta).** El cliente usa la anon key para `POST` y para `GET ?select=id`. Si la política RLS de `waitlist` permite `SELECT` a `anon`, cualquiera puede leer emails y teléfonos con `?select=*`. Verificar en Supabase que `anon` solo tenga `INSERT`, y mover el conteo a una función RPC `security definer` que devuelva solo el número.
2. **Repo público.** Este repo es público; la URL del proyecto Supabase está en el README. Evaluar pasarlo a privado.
3. **Datos personales sin política de privacidad.** Se recolectan edad, género, ciudad, email y teléfono sin términos ni política (Ley 25.326). Es requisito para casi cualquier red de monetización y para las wallets de Apple/Google.
4. **Referidos sin backend real.** El código se genera con `Math.random` sin chequear unicidad, no se cuenta cuántos referidos tiene cada usuario, la "posición en la lista" es el total de registros y los hitos (3/10/25 invitados) se muestran apagados sin progreso. Además se promete una gift card de USD 5 a los 25 referidos: es un pasivo sin anti-fraude.
5. **Probable causa de los rechazos.** Las redes de monetización evalúan tráfico activo y un producto donde mostrar el offerwall. Hoy solo hay una waitlist, sin usuarios activos ni app/web logueada; es esperable que rechacen.

## 3. ¿Adjoe como monetización rápida?

No es el camino rápido:
- Sin alta autoservicio: hay que contactar a partnerships; el account manager entrega el SDK hash y habilita sandbox ([docs adjoe](https://docs.adjoe.io/rewarded-solutions/integration/playtime-sdk-for-android/get-started)).
- La aceptación depende de volumen y calidad de tráfico; rinde mejor en apps medianas/grandes de Tier 1 ([PublisherGrowth](https://publishergrowth.com/software/adjoe)).
- Producto centrado en SDK Android con payouts S2S; existe PlaytimeWeb como alternativa web ([checklist adjoe](https://docs.adjoe.io/rewarded-solutions/resources/playtime-integration-and-launch-checklist)).

Conclusión: aplicar a Adjoe más adelante, con métricas de usuarios activos y retención.

### Alternativas de entrada rápida (web, sin SDK)
| Red | Por qué | Fuente |
|--|--|--|
| Offerwall.gg | Sin mínimo de tráfico, alta inmediata, integración de una línea, retiro desde USD 30 | [offerwall.gg](https://offerwall.gg/) |
| Torox, ayeT-Studios, BitLabs, Lootably, MyChips, RevU | Walls web por iframe/link para sitios de recompensas | [Sharklio](https://sharklio.com/academy/monetization/best-offerwalls-for-publishers) |
| CPX Research | Encuestas, suele rendir bien en LATAM | [Cusenware](https://cusenware.com/blog/best-offerwall-providers-2025/) |

### Diferencial local (más valor que cualquier offerwall global)
Las respuestas de la waitlist muestran el uso de fintechs y telcos. Los payouts de juegos en Argentina son bajos, pero los CPA de onboarding de fintech (abrir cuenta, primera carga) son altos. Ir directo a Ualá, Lemon, Brubank, Personal y Claro, o a sus agencias de performance, con la base segmentada como argumento.

## 4. Modelo Gravy Pass (pase en la wallet)

Cómo funciona:
- El usuario agrega un pase a Apple Wallet o Google Wallet desde la web, sin tienda de apps ([Gravy Pass](https://www.gravypass.com/)).
- El pase funciona como hub: links a juegos, encuestas y saldo, que se abren como páginas web ([Google Play](https://play.google.com/store/apps/details?id=com.gravypass.app)).
- Ganan como afiliados: cobran al anunciante y le comparten una parte al usuario ([Términos](https://gravypass.com/terms.html)).
- Retención: alertas SMS y referidos (USD 2 al que invita, USD 1 al invitado, con verificación de ID) ([referidos](https://services.gravypass.com/pass/sharing?passId=2c9914af-844f-4cdd-bc59-4cd72231db4b)).
- Solo EE.UU., mayores de 18 ([Términos](https://gravypass.com/terms.html)), así que LATAM está libre.

Por qué encaja con GanáYa: web + pase de wallet + offerwalls web evita depender de una app nativa y de su revisión en las tiendas.

Requisitos técnicos:
- Apple: cuenta Apple Developer, Pass Type ID y certificado para firmar `.pkpass`; web service para actualizar el pase (saldo) y mandar notificaciones.
- Google: cuenta de emisor en Google Wallet API, clase Generic Pass y solicitud de acceso de publicación.

Riesgos:
- Reputación: proliferan landings clon con promesas infladas ("USD 74 diarios") ([ejemplo](https://mygravypass.com/)) y quejas en BBB por recompensas impagas ([BBB](https://www.bbb.org/us/ca/san-francisco/profile/mobile-gaming/gravy-pass-1116-978985/complaints?page=1)).
- Reversiones: si acreditás antes de la confirmación del offerwall, cada reversión la pagás vos ([RevBoost](https://www.revboost.com/best/offerwall-networks-for-rewards-sites)). Usar saldo pendiente y un mínimo de retiro.

## 5. Estrategia: ¿publicidad pre-lanzamiento y pitch a marcas?

No conviene invertir fuerte en llenar la waitlist. Las marcas pagan por acciones (cuenta abierta, primer pago), no por emails, y una waitlist pierde valor si pasan meses sin producto. La secuencia recomendada:

1. MVP con offerwalls de alta rápida, para tener ingreso desde el día uno.
2. Prueba chica de Meta Ads (USD 300–500) para medir costo por registro y por usuario activado.
3. Pitch a marcas con datos de activación y retención, no con una lista.

Referencias de costo en Argentina: algunas guías citan USD 0,20–0,45 por lead con formulario nativo de Meta ([Marketing Digital Mendoza](https://marketingdigitalmendoza.com/blog/meta-ads-mendoza-guia-completa)) y otras USD 3–18 según rubro ([Dario Interweb](https://dariointerweb.com.ar/marketing-para-pymes/)). Con mensajes de "ganá premios" la métrica que importa es el costo por usuario que completa una misión.

### A qué offerwalls aplicar ahora

| Red | Por qué | Fuente |
|--|--|--|
| CPX Research | Líder en encuestas en español para Argentina; alta gratis, NET30, mínimo USD 25 | [Shark Earnings](https://sharkearnings.com/academy/insider/best-offers-by-region-guide), [CPX](https://www.cpx-research.com/main/en/) |
| BitLabs | Encuestas, complemento de CPX | [Cusenware](https://cusenware.com/blog/best-offerwall-providers-2025/) |
| Offerwall.gg | Sin tráfico mínimo, activo en el día | [Offerwall.gg](https://offerwall.gg/) |
| TimeWall | Tareas cortas, estable en LATAM | [Shark Earnings](https://sharkearnings.com/academy/insider/best-offers-by-region-guide) |

### Por qué fintechs primero (y no SMBs)

Las fintechs ya pagan caro por usuario: Mercado Pago da \$10.000 por referido que hace su primer pago ([iProUP](https://www.iproup.com/economia-digital/63517-mercado-pago-sistema-de-referidos-como-ganar-1-millon-de-pesos-en-2026)) y Lemon USD 3 a cada uno cuando el invitado valida y compra USD 6 en acciones ([Lemon](https://help.lemon.me/es/articles/11420040-en-que-consiste-el-programa-de-referidos)). Un CPA directo debería valer más. Ojo: usar links personales de referidos como negocio probablemente viola sus términos; hay que negociar acuerdo directo o vía red de afiliados.

| | Fintechs / telcos | SMBs |
|--|--|--|
| Valor por usuario | Alto (LTV de años) | Bajo |
| Hábito de pagar por acción | Sí, con equipos de UA | Poco |
| Medición | MMP (AppsFlyer, Adjust) | Difícil si la conversión es offline |
| Costo de venta | Similar por cuenta, mucho más ingreso | Alto relativo al ticket |
| Producto necesario | Postback del MMP | Panel autoservicio completo |

SMBs para más adelante: pymes digitales (ecommerce, apps chicas), vía agregadores (Tiendanube, Rappi, PedidosYa, redes de afiliados), misiones locales con QR si hay densidad de usuarios, y un panel autoservicio con CPA fijo.

## 6. Plan de ejecución

El MVP web ya está armado en el repo privado [`wliu-dev/ganaya-web`](https://github.com/wliu-dev/ganaya-web) (Next.js + Supabase + Vercel): login con magic link, ledger de puntos con créditos pendientes, CPX Research con postback firmado, canjes con panel admin y pase de Google Wallet. Detalle día por día en `docs/plan-semana.md` de ese repo.

| Semanas | Qué hacer |
|--|--|
| 1 | Cerrar RLS de la waitlist, términos y privacidad, MVP en producción con CPX, primeros usuarios desde la waitlist |
| 2 | Offerwall.gg y TimeWall, Google Wallet con saldo actualizado, emails de reactivación |
| 3–4 | Prueba de USD 300–500 en Meta; medir registro → primera misión → retención D7/D30 y ARPU |
| 5–10 | Con 1.000–2.000 usuarios activos: pitch a Ualá, Lemon, Brubank, Personal, Claro y Mercado Pago; misiones directas con postback del MMP; aplicar a adjoe; Apple Wallet |
