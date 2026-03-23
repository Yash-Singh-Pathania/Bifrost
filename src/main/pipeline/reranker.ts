import { Ollama } from 'ollama'
import { SearchResult } from '../../shared/types'

/**
 * LLM-based reranking for search results
 * Uses Ollama to semantically rerank top results for better relevance
 */
export async function rerankResults(
  query: string,
  results: SearchResult[],
  ollamaBaseUrl: string = 'http://localhost:11434'
): Promise<SearchResult[]> {
  if (results.length === 0) return results
  if (results.length <= 5) return results // Don't rerank small result sets

  try {
    const ollama = new Ollama({ baseUrl: ollamaBaseUrl })

    // Build reranking prompt
    const resultsList = results.slice(0, 20).map((r, i) =>
      `${i + 1}. [${r.source.toUpperCase()}] ${r.text.substring(0, 100)}... (score: ${r.score.toFixed(2)})`
    ).join('\n')

    const prompt = `You are a search result reranker. Given a user query and search results, rerank them by relevance.

Query: "${query}"

Search Results:
${resultsList}

Return ONLY a numbered list of the result indices in order of relevance (most relevant first), with no explanations.
Format: 1, 3, 2, 4, ...`

    console.log('[Reranker] Calling Ollama for reranking...')
    const response = await ollama.generate({
      model: 'mistral',
      prompt: prompt,
      stream: false
    })

    // Parse the response to get reranked indices
    const order = response.response
      .trim()
      .split(',')
      .map((s: string) => parseInt(s.trim()) - 1)
      .filter((i: number) => i >= 0 && i < results.length)

    if (order.length === 0) return results

    // Reorder results
    const reranked = order.map(i => ({
      ...results[i],
      reranked: true
    }))

    // Add any results that weren't ranked
    const ranked = new Set(order)
    for (let i = 0; i < results.length; i++) {
      if (!ranked.has(i)) {
        reranked.push(results[i])
      }
    }

    console.log('[Reranker] Reranking complete')
    return reranked
  } catch (error) {
    console.error('[Reranker] Error during reranking:', error)
    // If reranking fails, return original results
    return results
  }
}
