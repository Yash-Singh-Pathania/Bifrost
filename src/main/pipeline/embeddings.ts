import { Ollama } from 'ollama'
import { AppSettings } from '../../shared/types'

/**
 * Embedding provider interface — swap implementations easily
 */
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>
}

/**
 * Ollama embedding provider (default, free, local)
 * Uses nomic-embed-text by default
 */
class OllamaEmbeddings implements EmbeddingProvider {
  private client: Ollama
  private model: string

  constructor(baseUrl: string, model: string) {
    this.client = new Ollama({ host: baseUrl })
    this.model = model
  }

  async embed(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = []

    // Ollama embeddings API — batch by sending one at a time
    // (some models have batch support, but this is universally compatible)
    for (const text of texts) {
      const response = await this.client.embed({
        model: this.model,
        input: text
      })
      embeddings.push(response.embeddings[0])
    }

    return embeddings
  }
}

// ─── Future providers (uncomment when adding API support) ───
//
// class OpenAIEmbeddings implements EmbeddingProvider {
//   private apiKey: string
//   private model: string
//
//   constructor(apiKey: string, model: string = 'text-embedding-3-small') {
//     this.apiKey = apiKey
//     this.model = model
//   }
//
//   async embed(texts: string[]): Promise<number[][]> {
//     const response = await fetch('https://api.openai.com/v1/embeddings', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${this.apiKey}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ model: this.model, input: texts })
//     })
//     const data = await response.json()
//     return data.data.map((d: any) => d.embedding)
//   }
// }

/**
 * Factory: get the right embedding provider based on settings
 */
export function getEmbeddingProvider(settings: AppSettings): EmbeddingProvider {
  switch (settings.embeddingProvider) {
    case 'ollama':
      return new OllamaEmbeddings(
        settings.ollamaBaseUrl,
        settings.ollamaEmbeddingModel
      )
    // case 'openai':
    //   return new OpenAIEmbeddings(settings.openaiApiKey!, settings.openaiEmbeddingModel!)
    default:
      return new OllamaEmbeddings(
        settings.ollamaBaseUrl,
        settings.ollamaEmbeddingModel
      )
  }
}
