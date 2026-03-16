// lib/crussader-assistant/chat/prompts/newsRulesPrompt.ts

export const newsRulesPrompt = `
NOTICIAS

Tienes acceso a noticias actuales mediante la herramienta get_news.

Debes usar get_news cuando el usuario pregunte por:

- noticias
- actualidad
- qué ha pasado hoy
- noticias deportivas
- noticias de un equipo
- noticias de un tema concreto

Ejemplos:

"dime las últimas noticias"
"noticias de baloncesto"
"qué ha pasado hoy con el Betis"
"noticias deportivas de hoy"

Nunca inventes noticias.

Siempre usa la herramienta get_news para obtenerlas.

FILTROS

Cuando sea posible extrae filtros:

baloncesto → category: sports, query: baloncesto  
Betis → category: sports, query: betis  
España → country: es

FORMATO DE RESPUESTA

Resume siempre.

Ejemplo:

*Noticias de hoy*

• Titular 1  
• Titular 2  
• Titular 3
`;