import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../api/client'
import './VideoTutorial.css'

function VideoTutorial({ tutorials = [], defaultExpanded = true, compact = false, videoOnly = false, instructorProfiles = {} }) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [selectedTutorial, setSelectedTutorial] = useState(tutorials.length > 0 ? tutorials[0] : null)
  
  const videoRef = useRef(null)

  useEffect(() => {
    if (tutorials.length === 0) {
      setSelectedTutorial(null)
      return
    }

    const stillAvailable = selectedTutorial && tutorials.some((tutorial) => tutorial.id === selectedTutorial.id)
    if (!stillAvailable) {
      setSelectedTutorial(tutorials[0])
    }
  }, [tutorials, selectedTutorial])

  

  if (!tutorials || tutorials.length === 0) {
    return null
  }

  const extractVideoId = (url) => {
    if (!url) return null
    // Handle YouTube URLs
    let match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([^&\n?#/]+)/i)
    if (match && match[1]) return match[1]
    // If it's already a video ID or direct URL
    return isYouTubeUrl(url) ? null : url
  }

  const resolveVideoUrl = (url) => {
    if (!url) return ''

    try {
      return new URL(url, API_URL).toString()
    } catch {
      return url
    }
  }

  const isYouTubeUrl = (url) => Boolean(url && /(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url))

  const isDirectVideoFile = (url) => {
    if (!url) return false
    return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)
  }

  

  const getEmbedUrl = (url) => {
    const videoId = extractVideoId(url)
    if (videoId && isYouTubeUrl(url)) {
      const origin = encodeURIComponent(window.location.origin)
      return `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&rel=0&playsinline=1&fs=0&disablekb=1&iv_load_policy=3&origin=${origin}`
    }
    return resolveVideoUrl(url)
  }

  const formatDuration = (duration) => {
    if (!duration) return ''
    return duration.includes(':') ? duration : `${duration} minutes`
  }

  const getExpertProfilePath = (instructorName) => {
    if (!instructorName) return null
    const expertId = instructorProfiles[instructorName.trim().toLowerCase()]
    return expertId ? `/experts/${expertId}` : null
  }

  const content = (
    <>
      <div className="video-player-container">
        <div className="video-frame">
          {selectedTutorial && selectedTutorial.video_url ? (
            isYouTubeUrl(selectedTutorial.video_url) ? (
              <div
                className="youtube-embed-wrap"
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
              >
                <iframe
                  src={getEmbedUrl(selectedTutorial.video_url)}
                  title={selectedTutorial.title}
                  frameBorder="0"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                />
                <span className="youtube-player-shield youtube-player-shield-title" aria-hidden="true" contentEditable="false" draggable="false" />
                <span className="youtube-player-shield youtube-player-shield-left" aria-hidden="true" contentEditable="false" draggable="false" />
                <span className="youtube-player-shield youtube-player-shield-right" aria-hidden="true" contentEditable="false" draggable="false" />
              </div>
            ) : isDirectVideoFile(selectedTutorial.video_url) ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  controlsList="nodownload"
                  playsInline
                  preload="metadata"
                  src={resolveVideoUrl(selectedTutorial.video_url)}
                  title={selectedTutorial.title}
                  crossOrigin="anonymous"
                >
                  {selectedTutorial.caption_en_url && (
                    <track
                      kind="captions"
                      srcLang="en"
                      label="English"
                      src={selectedTutorial.caption_en_url}
                    />
                  )}
                  {selectedTutorial.caption_ne_url && (
                    <track
                      kind="captions"
                      srcLang="ne"
                      label="Nepali"
                      src={selectedTutorial.caption_ne_url}
                    />
                  )}
                </video>
              </>
            ) : (
              <iframe
                src={resolveVideoUrl(selectedTutorial.video_url)}
                title={selectedTutorial.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )
          ) : (
            <div className="video-placeholder">
              <p>{compact ? t('learn.chooseTutorial') : t('learn.videoUnavailable')}</p>
            </div>
          )}
        </div>
      </div>

      {!videoOnly && selectedTutorial && (
        <div className="tutorial-info">
          <h3>{selectedTutorial.title}</h3>
          <div className="tutorial-meta">
            {selectedTutorial.instructor_name ? (
              <span className="instructor">
                <strong>{t('learn.instructor')}:</strong>{' '}
                {getExpertProfilePath(selectedTutorial.instructor_name) ? (
                  <Link to={getExpertProfilePath(selectedTutorial.instructor_name)} className="instructor-link">
                    {selectedTutorial.instructor_name}
                  </Link>
                ) : (
                  selectedTutorial.instructor_name
                )}
              </span>
            ) : null}
            {formatDuration(selectedTutorial.duration) && (
              <span className="duration">
                <strong>{t('learn.duration')}:</strong> {formatDuration(selectedTutorial.duration)}
              </span>
            )}
          </div>
          <p className="tutorial-description">{selectedTutorial.description}</p>
        </div>
      )}

      {!videoOnly && <div className="tutorials-list">
        <h4>{compact ? t('learn.tutorialList') : t('learn.moreTutorials')}</h4>
        <div className="tutorial-cards">
          {tutorials.map((tutorial) => (
            <button
              key={tutorial.id}
              type="button"
              className={`tutorial-card ${selectedTutorial?.id === tutorial.id ? 'active' : ''}`}
              onClick={() => setSelectedTutorial(tutorial)}
            >
              <div className="tutorial-card-icon">
                <Play size={16} />
              </div>
              <div className="tutorial-card-content">
                <h5>{tutorial.title}</h5>
                <p>{tutorial.description}</p>
                {(tutorial.instructor_name || formatDuration(tutorial.duration)) && (
                  <span className="tutorial-card-meta">
                    {tutorial.instructor_name || ''}
                    {tutorial.instructor_name && formatDuration(tutorial.duration)
                      ? ` • ${formatDuration(tutorial.duration)}`
                      : !tutorial.instructor_name && formatDuration(tutorial.duration)
                        ? formatDuration(tutorial.duration)
                        : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>}
    </>
  )

  

  if (compact) {
    return <div className="video-tutorial-compact">{content}</div>
  }

  return (
    <section className="section video-tutorial-section">
      <div className="container">
        <div className="tutorial-header" onClick={() => setIsExpanded(!isExpanded)}>
          <h2 className="section-title">
            <Play size={24} />
            {t('learn.tutorials')}
          </h2>
          <button className="expand-btn" aria-label="Toggle section">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>

        {isExpanded && (
          content
        )}
      </div>
    </section>
  )
}

export default VideoTutorial
