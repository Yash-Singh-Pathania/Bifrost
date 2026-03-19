import React from 'react'
import { ProcessingProgress, ProcessingStage } from '../../shared/types'

interface ProcessingStatusProps {
  progress: ProcessingProgress
}

const STAGES: { key: ProcessingStage; label: string; icon: string }[] = [
  { key: 'extracting-audio',  label: 'Extracting Audio',   icon: '○' },
  { key: 'transcribing',      label: 'Transcribing',       icon: '○' },
  { key: 'extracting-frames', label: 'Extracting Frames',  icon: '○' },
  { key: 'embedding-text',    label: 'Embedding Text',     icon: '○' },
  { key: 'embedding-frames',  label: 'Embedding Frames',   icon: '○' },
  { key: 'storing',           label: 'Storing in DB',      icon: '○' },
  { key: 'done',              label: 'Done',               icon: '○' },
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
              <span className="stage-icon">{stage.icon}</span>
              <span className="stage-label">{stage.label}</span>
              {status === 'active' && <span className="stage-spinner" />}
              {status === 'complete' && <span className="stage-check">✓</span>}
            </div>
          )
        })}
      </div>

      {/* Status message */}
      <p className="processing-message">{progress.message}</p>
    </div>
  )
}
