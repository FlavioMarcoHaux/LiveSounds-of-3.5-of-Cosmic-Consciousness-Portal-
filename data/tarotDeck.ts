import { Card } from '../types';

export const majorArcana: string[] = [
    "O Louco", "O Mago", "A Sacerdotisa", "A Imperatriz", "O Imperador",
    "O Hierofante", "Os Amantes", "A Carruagem", "A Força", "O Eremita",
    "Roda da Fortuna", "A Justiça", "O Enforcado", "A Morte", "A Temperança",
    "O Diabo", "A Torre", "A Estrela", "A Lua", "O Sol", "O Julgamento", "O Mundo"
];

export const suits: string[] = ["Paus", "Copas", "Espadas", "Ouros"];
export const ranks: string[] = [
    "Ás", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez",
    "Pajem", "Cavaleiro", "Rainha", "Rei"
];

const minorArcana: string[] = suits.flatMap(suit => ranks.map(rank => `${rank} de ${suit}`));

export const tarotDeck: Card[] = [...majorArcana, ...minorArcana].map(name => ({ name }));
