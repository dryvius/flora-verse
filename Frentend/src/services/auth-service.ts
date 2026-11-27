import { AuthStatus } from '@/enums/auth-status'
import { getRepositories } from '@/repositories/create-repository'
import { useUserStore } from '@/stores/user-store'
import type { LoginPayload, LoginResult, RegisterPayload, RegisterResult } from '@/types/auth'
import { normalizeUsername } from '@/utils/auth-form'
import { BusinessError } from '@/utils/business-error'
import { getAccessToken } from '@/utils/token-storage'

const IDENTITY_UNCONFIRMED = 'IDENTITY_UNCONFIRMED'
const REGISTER_FALLBACK = '注册服务暂时不可用，请稍后再试'
const LOGIN_FALLBACK = '登录服务暂时不可用，请稍后再试'
const IDENTITY_UNAVAILABLE_MESSAGE = '登录凭证已保存，但暂时无法确认身份，请稍后重试'
const IDENTITY_REJECTED_MESSAGE = '暂时无法确认身份，请重新登录'

const REGISTER_MESSAGES: Record<string, string> = {
  USERNAME_ALREADY_EXISTS: '这个用户名已经有人使用了',
  INVALID_USERNAME: '用户名不符合规则',
  INVALID_PASSWORD: '密码不符合规则',
  INVALID_NICKNAME: '昵称不符合规则',
  VALIDATION_ERROR: '注册信息没有通过校验',
  NETWORK_ERROR: '网络异常，请稍后重试',
  API_BASE_URL_MISSING: '尚未配置服务器地址，暂时无法注册'
}

const LOGIN_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: '用户名或密码不正确',
  USER_NOT_ACTIVE: '这个账号暂时无法登录',
  INVALID_USERNAME: '用户名或密码格式不正确',
  INVALID_PASSWORD: '用户名或密码格式不正确',
  VALIDATION_ERROR: '用户名或密码格式不正确',
  NETWORK_ERROR: '网络异常，请稍后重试',
  API_BASE_URL_MISSING: '尚未配置服务器地址，暂时无法登录'
}

const LOGIN_CANCELLED = 'LOGIN_CANCELLED'
const LOGIN_CANCELLED_MESSAGE = '登录已取消'

interface LoginTask {
  epoch: number
  promise: Promise<void>
}

let loginTask: LoginTask | null = null

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  try {
    return await getRepositories().auth.register(toRegisterPayload(payload))
  } catch (error) {
    throw mapAuthError(error, REGISTER_MESSAGES, REGISTER_FALLBACK)
  }
}

export function login(payload: LoginPayload): Promise<void> {
  const store = useUserStore()
  const epoch = store.currentAuthEpoch()
  if (loginTask && loginTask.epoch === epoch) {
    return loginTask.promise
  }
  const task: LoginTask = {
    epoch,
    promise: Promise.resolve()
  }
  const promise = performLogin(payload, task).finally(() => {
    if (loginTask === task) {
      loginTask = null
    }
  })
  task.promise = promise
  loginTask = task
  return promise
}

async function performLogin(payload: LoginPayload, task: LoginTask): Promise<void> {
  const epoch = task.epoch
  const result = await requestLogin(payload)
  const store = useUserStore()
  if (store.currentAuthEpoch() !== epoch) {
    throw new BusinessError(LOGIN_CANCELLED, LOGIN_CANCELLED_MESSAGE)
  }
  const epochBeforeConfirmation = store.currentAuthEpoch()
  const confirmation = store.confirmSession(result.accessToken)
  const enteredConfirmation = store.currentAuthEpoch() !== epochBeforeConfirmation
  if (loginTask === task) {
    task.epoch = store.currentAuthEpoch()
  }
  let generation = epoch
  try {
    generation = await confirmation
  } catch (error) {
    if (enteredConfirmation && getAccessToken() && store.authStatus === AuthStatus.Unavailable) {
      throw new BusinessError(IDENTITY_UNCONFIRMED, IDENTITY_UNAVAILABLE_MESSAGE, errorDetails(error))
    }
    throw mapAuthError(error, LOGIN_MESSAGES, LOGIN_FALLBACK)
  }
  if (store.currentAuthEpoch() !== generation) {
    throw new BusinessError(LOGIN_CANCELLED, LOGIN_CANCELLED_MESSAGE)
  }
  if (store.authStatus !== AuthStatus.Authenticated) {
    throw new BusinessError(IDENTITY_UNCONFIRMED, IDENTITY_REJECTED_MESSAGE)
  }
}

async function requestLogin(payload: LoginPayload): Promise<LoginResult> {
  try {
    return await getRepositories().auth.login({
      username: normalizeUsername(payload.username),
      password: payload.password
    })
  } catch (error) {
    throw mapAuthError(error, LOGIN_MESSAGES, LOGIN_FALLBACK)
  }
}

function toRegisterPayload(payload: RegisterPayload): RegisterPayload {
  const body: RegisterPayload = {
    username: normalizeUsername(payload.username),
    password: payload.password
  }
  if (typeof payload.nickname === 'string' && payload.nickname.trim().length > 0) {
    body.nickname = payload.nickname
  }
  return body
}

function mapAuthError(error: unknown, messages: Record<string, string>, fallback: string): BusinessError {
  if (!(error instanceof BusinessError)) {
    return new BusinessError('AUTH_REQUEST_FAILED', fallback)
  }
  return new BusinessError(error.code, messages[error.code] ?? fallback, {
    statusCode: error.statusCode,
    requestId: error.requestId
  })
}

function errorDetails(error: unknown): { statusCode: number | null; requestId: string | null } {
  if (!(error instanceof BusinessError)) {
    return { statusCode: null, requestId: null }
  }
  return {
    statusCode: error.statusCode,
    requestId: error.requestId
  }
}
