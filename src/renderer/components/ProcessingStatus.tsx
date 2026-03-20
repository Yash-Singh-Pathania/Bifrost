import React from 'react'
import { ProcessingProgress, ProcessingStage } from '../../shared/types'

interface ProcessingStatusProps {
  progress: ProcessingProgress
}

const STAGES: { key: ProcessingStage; label: string; step: number }[] = [
  { key: 'extracting-audio',  label: 'Extracting Audio',   step: 1 },
  { key: 'transcribing',      label: 'Transcribing',       step: 2 },
  { key: 'extracting-frames', label: 'Extracting Frames',  step: 3 },
  { key: 'embedding-text',    label: 'Embedding Text',     step: 4 },
  { key: 'embedding-frames',  label: 'Embedding Frames',   step: 5 },
  { key: 'storing',           label: 'Storing in DB',      step: 6 },
  { key: 'done',              label: 'Done',               step: 7 },
]

function getStageIndex(stage: ProcessingStage): number {
  return STAGES.findIndex(s => s.key === stage)
}

export default function ProcessingStatus({ progress }: ProcessingStatusProps) {
  const currentIndex = getStageIndex(progress.stage)

  return (
    <div className="processing-status">
      {/* Overall progress bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="stage-list">
        {STAGES.map((stage, i) => {
          let status = 'pending'
          if (i < currentIndex) status = 'complete'
          else if (i === currentIndex) status = 'active'

          return (
            <div key={stage.key} className={`stage-item stage-${status}`}>
              <span className="stage-icon">
                {status === 'complete' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="stage-step-number">{stage.step}</span>
                )}
              </span>
              <span className="stage-label">{stage.label}</span>
              {status === 'active' && <span className="stage-spinner" />}
            </div>
          )
        })}
      </div>

      {/* Status message */}
      <p className="processing-message">{progress.message}</p>
    </div>
  )
}
