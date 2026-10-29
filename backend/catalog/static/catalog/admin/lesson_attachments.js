(() => {
  const attachmentFields = [
    'attachment_photo',
    'attachment_3d_model',
    'photo',
    'model_3d',
    'video_url',
  ]

  const fieldAttachmentTypes = {
    attachment_photo: 'photo',
    attachment_3d_model: '3d_model',
    photo: 'photo',
    model_3d: '3d_model',
    video_url: 'video',
  }

  const updateAttachmentFields = (form, select) => {
    const isLessonForm = Boolean(form.querySelector('.field-attachment_video'))
    attachmentFields.forEach((fieldName) => {
      if (fieldName === 'video_url' && isLessonForm) return

      const row = form.querySelector(`.field-${fieldName}`)
      if (row) {
        row.style.display = select.value === fieldAttachmentTypes[fieldName] ? '' : 'none'
      }
    })
  }

  const initializeAttachmentSelectors = (root = document) => {
    root.querySelectorAll('select[name$="-attachment_type"], select[name="attachment_type"]').forEach((select) => {
      const form = select.closest('.inline-related') || select.closest('form')
      if (!form) return

      updateAttachmentFields(form, select)
      select.addEventListener('change', () => updateAttachmentFields(form, select))
    })

    root.querySelectorAll('.inline-group[id$="lessonattachment_set-group"]').forEach((group) => {
      const attachmentTypeField = group.querySelector('.field-attachment_type')
      const addRowLink = group.querySelector('.add-row a')
      if (!attachmentTypeField || !addRowLink || attachmentTypeField.querySelector('.add-attachment-link')) return

      const addAttachmentLink = document.createElement('a')
      addAttachmentLink.href = addRowLink.href
      addAttachmentLink.className = 'add-attachment-link'
      addAttachmentLink.textContent = 'Add another attachment'
      addAttachmentLink.addEventListener('click', (event) => {
        event.preventDefault()
        addRowLink.click()
      })
      attachmentTypeField.querySelector('select')?.parentElement.append(addAttachmentLink)
    })
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeAttachmentSelectors()

    document.body.addEventListener('formset:added', (event) => {
      initializeAttachmentSelectors(event.target)
    })
  })
})()
