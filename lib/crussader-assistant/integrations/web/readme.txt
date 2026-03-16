Hemos cambiado el sistema para que Brave deje de usarse como fuente de contenido y pase a usarse solo como buscador 
de URLs. Antes el asistente devolvía directamente el snippet de Brave (texto corto y muchas veces cortado con “…”) 
como respuesta al usuario. Ahora el flujo es distinto: cuando el resultado viene de Wikipedia, se responde directamente 
con su contenido como antes; pero cuando viene de Brave, el sistema usa ese resultado solo para obtener la URL, descarga 
la página real, extrae el texto útil del HTML, lo resume con IA y después pasa ese resumen por universalResponseStyler para 
que suene natural en WhatsApp. Con esto evitamos respuestas partidas de buscadores y conseguimos respuestas basadas en el contenido 
real de la web, resumidas y presentadas de forma clara al usuario.