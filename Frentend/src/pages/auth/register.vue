<script setup lang="ts">
import { computed, ref } from 'vue'
import AuthStage from '@/components/auth/AuthStage.vue'
import AuthSubmitButton from '@/components/auth/AuthSubmitButton.vue'
import AuthSwitchLink from '@/components/auth/AuthSwitchLink.vue'
import AuthTextField from '@/components/auth/AuthTextField.vue'
import { useFieldError } from '@/composables/useFieldError'
import { AuthMessageTone } from '@/enums/auth-message-tone'
import { register } from '@/services/auth-service'
import {
  validateConfirmPassword,
  validateNickname,
  validatePassword,
  validateUsername
} from '@/utils/auth-form'
import { toUserMessage } from '@/utils/business-error'
import { backToLogin } from '@/utils/navigation'

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordVisible = ref(false)
const confirmVisible = ref(false)
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
  error: nicknameRule,
  visibleError: nicknameError,
  touch: touchNickname,
  reveal: revealNickname
} = useFieldError((): string => validateNickname(nickname.value))

const {
  error: passwordRule,
  visibleError: passwordError,
  touch: touchPassword,
  reveal: revealPassword
} = useFieldError((): string => validatePassword(password.value))

const {
  error: confirmRule,
  visibleError: confirmError,
  touch: touchConfirm,
  reveal: revealConfirm
} = useFieldError((): string => validateConfirmPassword(password.value, confirmPassword.value))

const isFormValid = computed(
  (): boolean =>
    usernameRule.value.length === 0 &&
    nicknameRule.value.length === 0 &&
    passwordRule.value.length === 0 &&
    confirmRule.value.length === 0
)
const submitDisabled = computed((): boolean => !isFormValid.value)

const formMessage = computed((): string => {
  if (feedback.value.length > 0) {
    return feedback.value
  }
  if (usernameError.value.length > 0) {
    return usernameError.value
  }
  if (nicknameError.value.length > 0) {
    return nicknameError.value
  }
  if (passwordError.value.length > 0) {
    return passwordError.value
  }
  if (confirmError.value.length > 0) {
    return confirmError.value
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

function updateNickname(value: string): void {
  nickname.value = value
  clearFeedback()
}

function updatePassword(value: string): void {
  password.value = value
  clearFeedback()
}

function updateConfirmPassword(value: string): void {
  confirmPassword.value = value
  clearFeedback()
}

function updatePasswordVisible(value: boolean): void {
  passwordVisible.value = value
}

function updateConfirmVisible(value: boolean): void {
  confirmVisible.value = value
}

function revealErrors(): void {
  revealUsername()
  revealNickname()
  revealPassword()
  revealConfirm()
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
    await register({
      username: username.value,
      password: password.value,
      nickname: nickname.value
    })
    uni.showToast({
      title: '注册成功',
      icon: 'success'
    })
    backToLogin()
  } catch (error) {
    feedback.value = toUserMessage(error, '注册失败，请稍后再试')
    feedbackTone.value = AuthMessageTone.Error
  } finally {
    submitting.value = false
  }
}

function handleBackToLogin(): void {
  backToLogin()
}
</script>

<template>
  <AuthStage title="创建你的植物世界" description="取一个名字，种下第一株属于你的植物。" :message="formMessage" :tone="messageTone">
    <template #fields>
      <AuthTextField
        label="用户名"
        placeholder="4 到 20 位，字母或汉字开头"
        :model-value="username"
        :error="usernameError"
        :maxlength="32"
        @update:model-value="updateUsername"
        @blur="touchUsername"
        @confirm="handleSubmit"
      />
      <AuthTextField
        label="昵称"
        placeholder="营地里怎么称呼你"
        optional
        :model-value="nickname"
        :error="nicknameError"
        :maxlength="80"
        @update:model-value="updateNickname"
        @blur="touchNickname"
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
      <AuthTextField
        label="确认密码"
        placeholder="再写一次密码"
        password
        :model-value="confirmPassword"
        :revealed="confirmVisible"
        :error="confirmError"
        :maxlength="600"
        @update:model-value="updateConfirmPassword"
        @update:revealed="updateConfirmVisible"
        @blur="touchConfirm"
        @confirm="handleSubmit"
      />
    </template>
    <template #actions>
      <AuthSubmitButton text="注册" :disabled="submitDisabled" :loading="submitting" @submit="handleSubmit" @invalid="revealErrors" />
      <AuthSwitchLink prefix="已有账号？" action="返回登录" @tap="handleBackToLogin" />
    </template>
  </AuthStage>
</template>
