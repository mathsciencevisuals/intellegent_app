export class ParsingService {
  parse(input: { extractedText: string | null }) {
    return {
      text: input.extractedText?.trim() ?? "",
    };
  }
}
