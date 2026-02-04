/**
 * 通用文本命令检测
 *
 * 用于不支持原生命令菜单的渠道（飞书、企业微信、钉钉等），
 * 通过文本匹配检测用户意图并转换为标准命令。
 */

import { matchZhCommandAlias } from "../auto-reply/commands-i18n.js";
import { generateCommandHelpText } from "../auto-reply/commands-help.js";

export type TextCommandResult =
  | { type: "help" }
  | { type: "command"; key: string; args?: string }
  | { type: "none" };

/**
 * 帮助菜单触发词
 */
const HELP_TRIGGERS = new Set([
  // 中文
  "菜单",
  "命令",
  "命令列表",
  "帮助",
  "怎么用",
  "使用帮助",
  // 英文
  "menu",
  "commands",
  "help",
  // 标点
  "?",
  "？",
]);

/**
 * 检测文本是否触发帮助菜单
 */
export function isHelpTrigger(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return HELP_TRIGGERS.has(normalized);
}

/**
 * 检测并解析文本命令
 *
 * 支持的格式：
 * 1. 中文别名: "新对话"、"停止"、"模型"
 * 2. 斜杠命令: "/new"、"/stop"、"/model claude-opus"
 * 3. 帮助触发: "菜单"、"命令"、"?"
 */
export function parseTextCommand(text: string): TextCommandResult {
  const trimmed = text.trim();

  // 检查帮助触发
  if (isHelpTrigger(trimmed)) {
    return { type: "help" };
  }

  // 检查斜杠命令
  if (trimmed.startsWith("/")) {
    const withoutSlash = trimmed.slice(1);
    const spaceIndex = withoutSlash.indexOf(" ");

    if (spaceIndex === -1) {
      // 无参数: /new
      return { type: "command", key: withoutSlash };
    }

    // 有参数: /model claude-opus
    const key = withoutSlash.slice(0, spaceIndex);
    const args = withoutSlash.slice(spaceIndex + 1).trim();
    return { type: "command", key, args: args || undefined };
  }

  // 检查中文别名
  const matchedKey = matchZhCommandAlias(trimmed);
  if (matchedKey) {
    return { type: "command", key: matchedKey };
  }

  // 检查带参数的中文命令 (如 "模型 claude-opus")
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex > 0) {
    const potentialAlias = trimmed.slice(0, spaceIndex);
    const matchedKeyWithArgs = matchZhCommandAlias(potentialAlias);
    if (matchedKeyWithArgs) {
      const args = trimmed.slice(spaceIndex + 1).trim();
      return { type: "command", key: matchedKeyWithArgs, args: args || undefined };
    }
  }

  return { type: "none" };
}

/**
 * 获取帮助菜单文本
 */
export function getHelpMenuText(): string {
  return generateCommandHelpText({
    showGroups: true,
    showEnglishName: true,
  });
}

/**
 * 将文本命令结果转换为标准斜杠命令格式
 */
export function toSlashCommand(result: TextCommandResult): string | null {
  if (result.type === "command") {
    if (result.args) {
      return `/${result.key} ${result.args}`;
    }
    return `/${result.key}`;
  }
  if (result.type === "help") {
    return "/commands";
  }
  return null;
}
