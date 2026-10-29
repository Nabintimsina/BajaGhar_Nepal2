import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Music2, SlidersHorizontal } from 'lucide-react'
import { api } from '../api/client'
import Tuner from '../components/Tuner'
import './TunerLab.css'

function TunerLab() {
  const { t, i18n } = useTranslation()
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('ne') ? 'ne' : 'en'

  const [instruments, setInstruments] = useState([])
  const [selectedInstrumentId, setSelectedInstrumentId] = useState('')
  const [selectedStandardId, setSelectedStandardId] = useState('')
  const [selectedInstrumentDetail, setSelectedInstrumentDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadInstruments = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await api.get('tuner/', { lang: activeLanguage })
        const items = Array.isArray(response) ? response : response?.results || []

        if (!isMounted) {
          return
        }

        setInstruments(items)

        if (items.length > 0) {
          setSelectedInstrumentId(String(items[0].id))
        } else {
          setSelectedInstrumentId('')
          setSelectedInstrumentDetail(null)
          setSelectedStandardId('')
        }
      } catch (err) {
        if (!isMounted) {
          return
        }
        setError(err.message)
        setInstruments([])
        setSelectedInstrumentId('')
        setSelectedInstrumentDetail(null)
        setSelectedStandardId('')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInstruments()

    return () => {
      isMounted = false
    }
  }, [activeLanguage])

  useEffect(() => {
    if (!selectedInstrumentId) {
      return
    }

    setDetailLoading(true)
    const selected = instruments.find((instrument) => String(instrument.id) === String(selectedInstrumentId))
    const configs = selected?.tuner_configs || []
    setSelectedInstrumentDetail(selected || null)

    const activeConfigId = selected?.tuner_config?.id || configs[0]?.id
    setSelectedStandardId((current) => {
      if (current && configs.some((config) => String(config.id) === String(current))) {
        return current
      }
      return activeConfigId ? String(activeConfigId) : ''
    })
    setDetailLoading(false)
  }, [selectedInstrumentId, instruments])

  const tunerOptions = selectedInstrumentDetail?.tuner_configs || []

  const selectedConfig = useMemo(() => {
    if (tunerOptions.length === 0) {
      return null
    }

    return (
      tunerOptions.find((option) => String(option.id) === String(selectedStandardId)) ||
      selectedInstrumentDetail?.tuner_config ||
      tunerOptions[0]
    )
  }, [tunerOptions, selectedStandardId, selectedInstrumentDetail])

  return (
    <div className="tuner-lab-page">
      <div className="page-header">
        <div className="container">
          <h1>{t('learn.tuner')}</h1>
          <p>{t('tuner.pageSubtitle')}</p>
        </div>
      </div>

      <div id='tuner-lab-content' className="container tuner-lab-content">
        <section className="tuner-lab-panel">
          <div className="tuner-panel-heading">
            <div className="tuner-panel-icon"><Music2 size={20} /></div>
            <div>
              <span className="eyebrow">BajaGhar tuner</span>
            </div>
            <SlidersHorizontal className="tuner-panel-mark" size={22} aria-hidden="true" />
          </div>
          <div className="tuner-control-grid">
            <div className="tuner-control-field">
              <label htmlFor="tuner-instrument-select"><Music2 size={15} /> {t('tuner.selectInstrument')}</label>
              <select
                id="tuner-instrument-select"
                value={selectedInstrumentId}
                onChange={(event) => setSelectedInstrumentId(event.target.value)}
                disabled={isLoading || instruments.length === 0}
              >
                {instruments.length === 0 ? (
                  <option value="">{t('tuner.noTunerEnabledInstruments')}</option>
                ) : (
                  instruments.map((instrument) => (
                    <option key={instrument.id} value={instrument.id}>
                      {instrument.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="tuner-control-field">
              <label htmlFor="tuner-standard-select"><SlidersHorizontal size={15} /> {t('tuner.selectStandard')}</label>
              <select
                id="tuner-standard-select"
                value={selectedStandardId}
                onChange={(event) => setSelectedStandardId(event.target.value)}
                disabled={detailLoading || tunerOptions.length === 0}
              >
                {tunerOptions.length === 0 ? (
                  <option value="">{t('tuner.noStandardConfigured')}</option>
                ) : (
                  tunerOptions.map((standard) => (
                    <option key={standard.id} value={standard.id}>
                      {standard.tuning_name}{standard.is_default ? ` (${t('tuner.default')})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {error && <p className="tuner-lab-error">{error}</p>}

          {!error && !isLoading && !detailLoading && selectedConfig && (
            <div className="tuner-lab-tuner">
              <Tuner
                tunerConfig={selectedConfig}
                compact
                instrumentName={selectedInstrumentDetail?.name || ''}
              />
            </div>
          )}

          {!error && !isLoading && !detailLoading && !selectedConfig && (
            <div className="tuner-lab-empty">
              <p>{t('tuner.noStandardConfigured')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default TunerLab
