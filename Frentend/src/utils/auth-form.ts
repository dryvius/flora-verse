/**
 * 用户名、密码和昵称与后端 `registration-policy` 一致。
 * 用户名先 trim 再 NFC。密码不裁剪首尾空白。
 */
const USERNAME_PATTERN = /^\p{L}[\p{L}\p{M}\p{N}_]*$/u
const USERNAME_MIN_CODE_POINTS = 4
const USERNAME_MAX_CODE_POINTS = 20
const PASSWORD_MIN_CODE_POINTS = 8
const PASSWORD_MAX_CODE_POINTS = 128
const PASSWORD_MAX_UTF8_BYTES = 512
const NICKNAME_MAX_CODE_POINTS = 64

export function unicodeLength(value: string): number {
  return [...value].length
}

export function utf8ByteLength(value: string): number {
  let bytes = 0
  for (const symbol of value) {
    const point = symbol.codePointAt(0) ?? 0
    if (point <= 0x7f) {
      bytes += 1
    } else if (point <= 0x7ff) {
      bytes += 2
    } else if (point <= 0xffff) {
      bytes += 3
    } else {
      bytes += 4
    }
  }
  return bytes
}

export function normalizeUsername(username: string): string {
  return username.trim().normalize('NFC')
}

export function validateUsername(raw: string): string {
  const username = normalizeUsername(raw)
  if (username.length === 0) {
    return '请输入用户名'
  }
  const length = unicodeLength(username)
  if (length < USERNAME_MIN_CODE_POINTS) {
    return '用户名至少 4 个字符'
  }
  if (length > USERNAME_MAX_CODE_POINTS) {
    return '用户名最多 20 个字符'
  }
  if (!USERNAME_PATTERN.test(username)) {
    return '用户名需以字母或汉字开头，随后只能使用字母、汉字、数字或下划线'
  }
  return ''
}

export function validatePassword(password: string): string {
  if (password.length === 0) {
    return '请输入密码'
  }
  const length = unicodeLength(password)
  if (length < PASSWORD_MIN_CODE_POINTS) {
    return '密码至少 8 位'
  }
  if (length > PASSWORD_MAX_CODE_POINTS) {
    return '密码最多 128 位'
  }
  if (utf8ByteLength(password) > PASSWORD_MAX_UTF8_BYTES) {
    return '密码不能超过 512 字节'
  }
  return ''
}

export function validateConfirmPassword(password: string, confirmPassword: string): string {
  if (confirmPassword.length === 0) {
    return '请再次输入密码'
  }
  if (confirmPassword !== password) {
    return '两次输入的密码不一致'
  }
  return ''
}

export function validateNickname(nickname: string): string {
  if (nickname.trim().length === 0) {
    return ''
  }
  if (unicodeLength(nickname) > NICKNAME_MAX_CODE_POINTS) {
    return '昵称最多 64 个字符'
  }
  return ''
}
