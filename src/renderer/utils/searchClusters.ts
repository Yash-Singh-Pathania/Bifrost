import { SearchResult } from '../../shared/types'

export interface ClusteredSearchResult {
  best: SearchResult
  results: SearchResult[]
  source: 'transcript' | 'visual'
  startTime: number
  endTime: number
  score: number
  snippet: string
}

const CLUSTER_GAP_SECONDS = 8

export function clusterSearchResults(results: SearchResult[]): ClusteredSearchResult[] {
  if (results.length === 0) return []

  const transcripts = results
    .filter(result => result.source === 'transcript')
    .sort((a, b) => a.timestamp - b.timestamp)

  const visuals = results
    .filter(result => result.source === 'visual')
    .sort((a, b) => a.timestamp - b.timestamp)

  function buildClusters(sorted: SearchResult[]): ClusteredSearchResult[] {
    if (sorted.length === 0) return []

    const clusters: ClusteredSearchResult[] = []
    let current: SearchResult[] = [sorted[0]]

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1]
      const currentResult = sorted[index]

      if (currentResult.timestamp - previous.timestamp <= CLUSTER_GAP_SECONDS) {
        current.push(currentResult)
      } else {
        clusters.push(finalizeCluster(current))
        current = [currentResult]
      }
    }

    clusters.push(finalizeCluster(current))
    return clusters
  }

  function finalizeCluster(group: SearchResult[]): ClusteredSearchResult {
    const best = group.reduce((bestResult, result) => (result.score > bestResult.score ? result : bestResult), group[0])

    return {
      best,
      results: group,
      source: group[0].source,
      startTime: group[0].timestamp,
      endTime: group[group.length - 1].timestamp,
      score: best.score,
      snippet: best.snippet
    }
  }

  return [...buildClusters(transcripts), ...buildClusters(visuals)].sort((a, b) => b.score - a.score)
}
