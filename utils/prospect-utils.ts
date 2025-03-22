interface Advisor {
  id: string
  name: string
  specialties: string[]
  currentLoad: number
  maxLoad: number
  performance: number
  language: string
}

interface Prospect {
  id: string
  name: string
  interestedArea: string
  status: string
  assignedTo?: string
  preferredLanguage: string
}

/**
 * Calculates a score for matching an advisor to a prospect
 * Higher score means better match
 * @param advisor The advisor to evaluate
 * @param prospect The prospect to match
 * @returns A score from 0-100 representing match quality
 */
export function calculateAssignmentScore(advisor: Advisor, prospect: Prospect): number {
  let score = 0

  // Check if advisor has capacity
  if (advisor.currentLoad >= advisor.maxLoad) {
    return 0 // No capacity, can't assign
  }

  // Check language match (important)
  if (advisor.language === prospect.preferredLanguage) {
    score += 30
  }

  // Check specialty match
  const specialtyMatch = advisor.specialties.some(
    (specialty) => prospect.interestedArea.includes(specialty) || specialty.includes(prospect.interestedArea),
  )

  if (specialtyMatch) {
    score += 40
  }

  // Consider advisor performance
  score += (advisor.performance / 100) * 20

  // Consider current load (prefer more balanced assignments)
  const loadFactor = 1 - advisor.currentLoad / advisor.maxLoad
  score += loadFactor * 10

  return Math.min(100, score)
}

