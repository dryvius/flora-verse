import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ConfirmationType } from '@/enums/confirmation-type'
import { createIdempotencyKey } from '@/utils/id'
import type { CaptureSuccessView } from '@/types/views'
import type { RecognitionCandidate, RecognitionTask } from '@/types/recognition'

export const useCaptureSessionStore = defineStore('capture-session', () => {
  const localFilePath = ref('')
  const imageKey = ref('')
  const task = ref<RecognitionTask | null>(null)
  const selectedSpeciesId = ref('')
  const confirmationType = ref<ConfirmationType>(ConfirmationType.AiPrimary)
  const idempotencyKey = ref('')
  const submitting = ref(false)
  const successView = ref<CaptureSuccessView | null>(null)

  function beginSession(filePath: string): void {
    localFilePath.value = filePath
    imageKey.value = ''
    task.value = null
    selectedSpeciesId.value = ''
    confirmationType.value = ConfirmationType.AiPrimary
    idempotencyKey.value = createIdempotencyKey()
    submitting.value = false
    successView.value = null
  }

  function setImageKey(key: string): void {
    imageKey.value = key
  }

  function setTask(nextTask: RecognitionTask): void {
    task.value = nextTask
    const primary = nextTask.candidates[0]
    if (primary) {
      selectedSpeciesId.value = primary.speciesId
      confirmationType.value = ConfirmationType.AiPrimary
    }
  }

  function selectCandidate(candidate: RecognitionCandidate, type: ConfirmationType): void {
    selectedSpeciesId.value = candidate.speciesId
    confirmationType.value = type
  }

  function setSuccess(view: CaptureSuccessView): void {
    successView.value = view
  }

  function reset(): void {
    localFilePath.value = ''
    imageKey.value = ''
    task.value = null
    selectedSpeciesId.value = ''
    confirmationType.value = ConfirmationType.AiPrimary
    idempotencyKey.value = ''
    submitting.value = false
    successView.value = null
  }

  return {
    localFilePath,
    imageKey,
    task,
    selectedSpeciesId,
    confirmationType,
    idempotencyKey,
    submitting,
    successView,
    beginSession,
    setImageKey,
    setTask,
    selectCandidate,
    setSuccess,
    reset
  }
})
