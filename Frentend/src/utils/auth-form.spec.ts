import { describe, expect, it } from 'vitest'
import {
  normalizeUsername,
  unicodeLength,
  utf8ByteLength,
  validateConfirmPassword,
  validateNickname,
  validatePassword,
  validateUsername
} from '@/utils/auth-form'

describe('登录注册表单校验', () => {
  it('接受中文、英文、数字和下划线用户名，并做 trim 与 NFC', () => {
    expect(validateUsername('摘星重现')).toBe('')
    expect(validateUsername('Flora')).toBe('')
    expect(validateUsername('flora_01')).toBe('')
    expect(validateUsername('  Flora  ')).toBe('')
    const decomposed = 'Cafe\u0301xy'
    expect(normalizeUsername(`  ${decomposed}  `)).toBe('Caféxy')
    expect(validateUsername(`  ${decomposed}  `)).toBe('')
  })

  it('按码点拒绝过短、过长、数字或符号开头的用户名', () => {
    expect(validateUsername('')).toBe('请输入用户名')
    expect(validateUsername('   ')).toBe('请输入用户名')
    expect(validateUsername('植物园')).toBe('用户名至少 4 个字符')
    expect(validateUsername('植物园门')).toBe('')
    expect(validateUsername('a'.repeat(20))).toBe('')
    expect(validateUsername('a'.repeat(21))).toBe('用户名最多 20 个字符')
    expect(validateUsername('1flora')).toBe('用户名需以字母或汉字开头，随后只能使用字母、汉字、数字或下划线')
    expect(validateUsername('_flora')).toContain('字母或汉字开头')
    expect(validateUsername('flo ra')).toContain('字母或汉字开头')
    expect(validateUsername('flo-ra')).toContain('字母或汉字开头')
    expect(validateUsername('flora🌿')).toContain('字母或汉字开头')
  })

  it('保留无法合成的组合附加符号', () => {
    const username = 'qqq\u0300'
    expect(unicodeLength(username)).toBe(4)
    expect(validateUsername(username)).toBe('')
  })

  it('密码按 8–128 个码点和 512 字节校验，且不裁剪空白', () => {
    expect(validatePassword('')).toBe('请输入密码')
    expect(validatePassword('abcdefg')).toBe('密码至少 8 位')
    expect(validatePassword('abcdefgh')).toBe('')
    expect(validatePassword('a'.repeat(128))).toBe('')
    expect(validatePassword('a'.repeat(129))).toBe('密码最多 128 位')
    expect(validatePassword('  Flora@  ')).toBe('')
    expect(validatePassword('青苔密码测试用之')).toBe('')
    expect(utf8ByteLength('🌱')).toBe(4)
    expect(utf8ByteLength('🌱'.repeat(128))).toBe(512)
    expect(validatePassword('🌱'.repeat(128))).toBe('')
    expect(validatePassword('🌱'.repeat(129))).toBe('密码最多 128 位')
  })

  it('确认密码必须一致，昵称可空且最多 64 个码点', () => {
    expect(validateConfirmPassword('abcdefgh', '')).toBe('请再次输入密码')
    expect(validateConfirmPassword('abcdefgh', 'abcdefgH')).toBe('两次输入的密码不一致')
    expect(validateConfirmPassword('  Flora@  ', '  Flora@  ')).toBe('')
    expect(validateNickname('')).toBe('')
    expect(validateNickname('   ')).toBe('')
    expect(validateNickname('星辰')).toBe('')
    expect(validateNickname('苔'.repeat(64))).toBe('')
    expect(validateNickname('苔'.repeat(65))).toBe('昵称最多 64 个字符')
    expect(validateNickname('🌱'.repeat(64))).toBe('')
    expect(validateNickname('🌱'.repeat(65))).toBe('昵称最多 64 个字符')
  })
})
