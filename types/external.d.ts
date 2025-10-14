declare module "stopwords-es" {
  const words: string[];
  export default words;
}
declare module "snowball-stemmers" {
  export class StemmerEs {
    stem(term: string): string;
  }
}
