<script setup lang="ts">
import { computed, ref } from 'vue'
import AuthStage from '@/components/auth/AuthStage.vue'
import AuthSubmitButton from '@/components/auth/AuthSubmitButton.vue'
import AuthSwitchLink from '@/components/auth/AuthSwitchLink.vue'
import AuthTextField from '@/components/auth/AuthTextField.vue'
import { useFieldError } from '@/composables/useFieldError'
import { useLoginExit } from '@/composables/useLoginExit'
import { AuthMessageTone } from '@/enums/auth-message-tone'
import { login } from '@/services/auth-service'
import { validatePassword, validateUsername } from '@/utils/auth-form'
import { toUserMessage } from '@/utils/business-error'
import { openRegister, returnFromLogin } from '@/utils/navigation'

useLoginExit()

const username = ref('')
const password = ref('')
const passwordVisible = ref(false)
const submitting = ref(false)
const feedback = ref('')
const feedbackTone = ref<AuthMessageTone>(AuthMessageTone.Idle)

const {
  error: usernameRule,
  visibleError: usernameError,
  touch: touchUsername,
  reveal: revealUsername
} = useFieldError((): string => validateUsername(username.value))

const {
  error: passwordRule,
  visibleError: passwordError,
  touch: touchPassword,
  reveal: revealPassword
} = useFieldError((): string => validatePassword(password.value))

const isFormValid = computed((): boolean => usernameRule.value.length === 0 && passwordRule.value.length === 0)
const submitDisabled = computed((): boolean => !isFormValid.value)

const formMessage = computed((): string => {
  if (feedback.value.length > 0) {
    return feedback.value
  }
  if (usernameError.value.length > 0) {
    return usernameError.value
  }
  if (passwordError.value.length > 0) {
    return passwordError.value
  }
  return ''
})

const messageTone = computed((): AuthMessageTone => {
  if (feedback.value.length > 0) {
    return feedbackTone.value
  }
  if (formMessage.value.length > 0) {
    return AuthMessageTone.Error
  }
  return AuthMessageTone.Idle
})

function clearFeedback(): void {
  feedback.value = ''
  feedbackTone.value = AuthMessageTone.Idle
}

function updateUsername(value: string): void {
  username.value = value
  clearFeedback()
}

function updatePassword(value: string): void {
  password.value = value
  clearFeedback()
}

function updatePasswordVisible(value: boolean): void {
  passwordVisible.value = value
}

function revealErrors(): void {
  revealUsername()
  revealPassword()
  clearFeedback()
}

async function handleSubmit(): Promise<void> {
  if (submitting.value) {
    return
  }
  revealErrors()
  if (!isFormValid.value) {
    return
  }
  submitting.value = true
  try {
    await login({
      username: username.value,
      password: password.value
    })
    returnFromLogin()
  } catch (error) {
    feedback.value = toUserMessage(error, '登录失败，请稍后再试')
    feedbackTone.value = AuthMessageTone.Error
  } finally {
    submitting.value = false
  }
}

function handleOpenRegister(): void {
  openRegister()
}
</script>

<template>
  <AuthStage title="欢迎回来" description="你的植物还在营地里等你。" :message="formMessage" :tone="messageTone">
    <template #fields>
      <AuthTextField
        label="用户名"
        placeholder="字母、汉字、数字或下划线"
        :model-value="username"
        :error="usernameError"
        :maxlength="32"
        @update:model-value="updateUsername"
        @blur="touchUsername"
        @confirm="handleSubmit"
      />
      <AuthTextField
        label="密码"
        placeholder="8 到 128 位"
        password
        :model-value="password"
        :revealed="passwordVisible"
        :error="passwordError"
        :maxlength="600"
        @update:model-value="updatePassword"
        @update:revealed="updatePasswordVisible"
        @blur="touchPassword"
        @confirm="handleSubmit"
      />
    </template>
    <template #actions>
      <AuthSubmitButton text="登录" :disabled="submitDisabled" :loading="submitting" @submit="handleSubmit" @invalid="revealErrors" />
      <AuthSwitchLink prefix="还没有账号？" action="去创建植物世界" @tap="handleOpenRegister" />
    </template>
  </AuthStage>
</template>
