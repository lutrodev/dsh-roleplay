import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { apply, DEFAULT_WRITING_STYLE, dispatchBrowser, RpWritingStyles } from '../src/index.js'

const configFor = libraryDir => ({ libraryDir, maxTextCharacters: 30000, maxStylesPerSession: 3, exposeBrowser: false })
const CHARACTER_DESCRIPTION_GUIDANCE = '重要人物初次出现或成为场景焦点，或其样貌、神态、衣着、伤痕与装束影响识别、关系、行动或气氛时，从当前视角选取最有辨识度的细节，使形象清晰可感、便于代入与想象；尊重既有人设与用户留白，已有特征只在变化或产生新意义时重提，不作从头到脚的清单。'
const PREVIOUS_LONG_FORM_STYLE_INFORMATION = '设定、背景和前情只在影响当下判断、选择或后果时进入正文，借观察、比较、回忆、冲突或误解自然显露。给足理解当前场景所需的信息，不一次讲完世界，也不重复已经明确的内容。'
const PREVIOUS_LONG_FORM_STYLE_ENDING = `## 篇幅与收束

篇幅由完整呈现当前场景及其必要叙事节拍所需决定，不设字数、段数或对白比例。该展开的决定、发现、失误、关系转折与余波充分展开，该压缩的常规移动、重复动作和已知信息利落带过；不为显得丰富而填充，也不在第一层反应后截断。让结尾落在后果、新压力或自然静止点，不用作者总结或通用钩子代替收束。`
const PREVIOUS_ENDING_IMITATION_STYLE_ENDING = `## 篇幅与收束

篇幅由完整呈现当前场景及其必要叙事节拍所需决定，不设字数、段数或对白比例。该展开的决定、发现、失误、关系转折与余波充分展开，该压缩的常规移动、重复动作和已知信息利落带过；不为显得丰富而填充，也不在第一层反应后截断。

结尾选择与当前场景最相称的落点：可以是完成、决定、关系变化、后果、余波、暂时平静，或已有问题的自然延伸。不要惯性追加新秘密、新人物、更大危机、倒计时或“最后一行反转”，并避免连续重复同类收束；不用作者总结或通用钩子代替结尾。`
const PREVIOUS_VERBOSE_ENDING_STYLE_GUIDANCE = '承接前文的事实、人物声音和因果，不照抄最近结尾的表达骨架。若近期已用窗外、天色或风雨等景物切出，或以角色提问、沉默、欲言又止、离场动作、突发声响、单句揭示收尾，除非刻意照应能产生新的含义或后果，不再复用相同的观察对象、动作、句法和段落节奏；由本场景自身变化决定落点，不为求异机械轮换，也不用作者总结或通用钩子代替结尾。'
const PREVIOUS_SINGLE_TURN_STYLE_SCENE = '把场景写成正在发生的事件，而不是剧情梗概。常见的内在因果是：外界变化—主角感知与判断—选择、行动或对白—他人回应、后果或新信息；它可以省略、交错或拉长，只用于保持因果清楚，不要机械逐项书写。叙述定位变化并承载细节，对白让人物带着各自目的相互作用，内心把感知转为判断与选择；三者按场景需要自然交替，共同推进同一节拍。'
const PREVIOUS_SINGLE_TURN_STYLE_ENDING = `## 篇幅与收束

篇幅由完整呈现当前场景及其必要叙事节拍所需决定，不设字数、段数或对白比例。该展开的决定、发现、失误、关系转折与余波充分展开，该压缩的常规移动、重复动作和已知信息利落带过；不为显得丰富而填充，也不在第一层反应后截断。

结尾选择与当前场景最相称的落点：可以是完成、决定、关系变化、后果、余波、暂时平静，或已有问题的自然延伸。不要惯性追加新秘密、新人物、更大危机、倒计时或“最后一行反转”，并避免连续重复同类收束。

承接前文的事实、人物声音和因果，但不要机械复用近期结尾的景物切换、角色提问、动作、句法或段落节奏；除非刻意照应能产生新的含义或后果，结尾应由当前场景自然形成，不用作者总结或通用钩子代替。`
const PREVIOUS_EXPANSION_BALANCE_STYLE_ENDING = `## 篇幅与收束

篇幅由完整呈现本轮必要叙事节拍所需决定，不设字数、段数或对白比例。该展开的决定、发现、失误、关系转折与余波充分展开，该压缩的常规移动、重复动作和已知信息利落带过；不为显得丰富而填充，不在第一层反应后截断，也不为一次写完整个场景而过度推进。

一个场景可以跨越多轮。本轮落点应与场景进程相称：可以完成当前节拍，也可以停在尚未闭合但态势清楚、已有可读进展的过程节点。不随意切断正在形成意义的动作、对白或情绪，也不用停顿和留白掩盖缺少推进。不要惯性追加新秘密、新人物、更大危机、倒计时或“最后一行反转”。

承接前文的叙述声音与场景状态，但不机械复用近期回复的观察落点、句法、段落节奏或收束形式；有意照应须产生新的含义或后果，不用作者总结或通用钩子代替结尾。`
const PREVIOUS_CORRECTIVE_STYLE_ENDING = `## 篇幅与收束

篇幅随内容和节奏自然伸缩，不设字数、段数或对白比例。关键动作、交流、发现、关系变化与直接余波充分展开，常规移动、重复动作和已知信息利落带过；不为显得丰富而填充。

本轮可以完成当前节拍，也可以在态势清楚、已有充分进展的过程节点停下。不随意切断正在形成意义的动作、对白或情绪，也不为得到结尾强行推进场景；不用停顿和留白掩盖缺少推进。不要惯性追加新秘密、新人物、更大危机、倒计时或“最后一行反转”。

承接前文的叙述声音与场景状态，但不机械复用近期回复的观察落点、句法、段落节奏或收束形式；有意照应须产生新的含义或后果，不用作者总结或通用钩子代替结尾。`
const PREVIOUS_TARGET_STYLE_ENDING = `## 篇幅与收束

篇幅服从内容分量和场景节奏，不设字数、段数或对白比例。重要交流、关键动作、发现、关系变化和直接余波获得与其分量相称的展开；常规移动、重复动作和已知信息简洁处理。句段在快慢、疏密之间随场景自然变化。

本轮落在当前叙述焦点已经形成清楚进展的位置：可以完成当前节拍，也可以停在态势明确、能够自然接续的过程节点。让正在形成意义的动作、对白与情绪得到承接，悬念和接续力从已经发生的变化、尚未完成的关系或清楚可见的后果中生长。

承接前文的叙述声音与场景状态，根据当前内容重新选择观察落点、句法、段落节奏和收束形式；需要照应近期表达时，让照应产生新的含义或后果。让结尾的意义落在人物行动与后果中。`
const PREVIOUS_DIALOGUE_PARAGRAPH_OPENING = '对白使用双引号，按说话人、动作变化或叙述焦点自然分段。'
const CURRENT_DIALOGUE_PARAGRAPH_OPENING = '对白使用双引号，按说话人、动作变化或叙述焦点自然分段，保持发言归属清楚。'
const CURRENT_SHORT_DIALOGUE_GUIDANCE = '连续短对话可以独立成段，但不要长期维持等长、等距的单句往返。'
const MOVED_RHYTHM_GUIDANCE = '句段在快慢、疏密之间随场景自然变化。'
const PREVIOUS_PROTAGONIST_THOUGHT_GUIDANCE = '主角内心默认融入自由间接引语，让叙述自然带上其判断、偏见和欲望；需要锋利、私密或富有角色声音的瞬间，才短暂使用直接念头。内心应解释证据、暴露误判或影响下一步，不复述刚发生的事，也不替读者总结。'
const PREVIOUS_PROMPT_AUDIT_STYLE_DESCRIPTION = '清晰、具体、有节奏的主角锚定叙事，让叙述、对白与内心自然交织。'
const PREVIOUS_PROMPT_AUDIT_STYLE_CONTENT = `没有其他明确要求时，采用贴近主角感受的第三人称限知叙事；用户明确指定人称、视角或文体时随之调整。叙述距离可以随节奏拉近或稍远，所知范围仍以主角为锚；对白是人物发言，不会自动切换视角。预设若允许“配角心声”，只按该规则作短暂例外。对白使用双引号，按说话人、动作变化或叙述焦点自然分段，保持发言归属清楚。

## 场景组织与叙述焦点

把场景写成正在发生的事件，而不是剧情梗概。让感知、判断、对白、行动与回应保持清楚的因果关联；根据当前张力决定从何处展开、停留或略过，不预设固定链条，也不要求每轮闭合。叙述定位变化并承载细节，对白让人物带着各自目的相互作用，内心把感知转为判断与选择；三者按场景需要自然交织，共同推进当前节拍。

每段围绕一个清晰的叙述焦点组织。优先写会改变读者理解或场面感受的细节，人物、环境和物件只选当前有作用的部分；尽量让一个细节同时承担人物、氛围、信息或推进中的多种作用。日常过程适度压缩，在发现、触碰、失言、迟疑或局势转折等关键瞬间展开，不要平均用力或逐项清点。

## 语言与节奏

使用准确、自然、易读的语言和具体动词。句子长短随动作速度、观察深度和情绪压力变化：关键瞬间可以放慢，过渡与常规动作应利落带过。避免整段维持同一节拍、连续堆叠碎句、用逗号串起过多动作，或把每个动作拆成等重的步骤。句段在快慢、疏密之间随场景自然变化。

## 描写、动作与空间

重要人物初次出现或成为场景焦点，或其样貌、神态、衣着、伤痕与装束影响识别、关系、行动或气氛时，从当前视角选取最有辨识度的细节，融入观察、动作与互动，使形象清晰可感、便于代入与想象；尊重既有人设与用户留白，已有特征只在变化或产生新意义时重提，不作从头到脚的清单。

设定、背景和前情只在影响当下判断、选择或后果时进入正文，借观察、比较、回忆、冲突或误解逐步显露。给足理解当前场景所需的信息，把其余内容留到人物真正接触或因果需要时再展开；避免在同一处密集引入彼此无关的新设定、人物关系、谜团和支线，也不重复已经明确的内容。

动作写清主体、顺序、方向、距离与可见结果。多人同场时，用站位、视线、遮挡和物件关系维持空间感，避免人物突然换位或动作互相冲突。感官描写选择场景最突出的线索，让声音、温度、触感、气味或光线参与当下动作，不轮流罗列五感。

## 对白与内心

对白既要符合人物声音，也要服务其当下目标，可以短促、含混、被打断、答非所问，也可以用于试探、遮掩、交换、拒绝、拖延或言不由衷；人物差异来自用词、句式、回避方式和知识边界。连续短对话可以独立成段，但不要长期维持等长、等距的单句往返。在动作、观察或念头能够改变一句话的分量、潜台词、场面关系、节奏或下一步时穿插叙述，不必给每句话配表情、语气标签和内心解释。避免反复使用“说完”“闻言”“不由得”、省略号或相同肢体反应维持节拍。

## 情绪与修辞

情绪可以落在选择、感知、念头、沉默、身体反应、注意力变化或物件使用上，选择最有分量的方式，不逐项罗列心跳、呼吸、目光和指尖。比喻保持简短、具体并贴合人物经验，同一段落不要混用多个意象。避免套话式情绪标签、模板化网络表达、抽象概念堆叠、对称口号和解释句子自身意义的文字。

成稿应具体、流畅、层次清楚，既不是聊天记录，也不是密集说明墙。不要预设明快、甜美、幽默、抒情或沉重等固定基调；让措辞、密度和节奏服从当前人物、场景与题材。

## 收束

本轮落在当前叙述焦点已经形成清楚进展的位置：可以完成当前节拍，也可以停在态势明确、能够自然接续的过程节点。让正在形成意义的动作、对白与情绪得到承接，悬念和接续力从已经发生的变化、尚未完成的关系或清楚可见的后果中生长。

承接前文的叙述声音与场景状态，根据当前内容重新选择观察落点、句法、段落节奏和收束形式；需要照应近期表达时，让照应产生新的含义或后果。让结尾的意义落在人物行动与后果中。`

function previousChecklistActionWritingStyle() {
  const style = structuredClone(DEFAULT_WRITING_STYLE)
  const content = style.content.replace(
    '动作描写以行动过程和空间关系清楚可辨为准：让读者理解谁在做什么、人物彼此处于何处，以及动作产生了什么变化；先后、方向和距离在影响理解时自然交代。多人同场时，用必要的站位、视线、遮挡和物件关系维持空间与动作连续，避免人物突然换位或动作互相冲突。感官描写选取能够参与行动、关系或气氛的少数线索，不轮流罗列五感。',
    '动作写清主体、顺序、方向、距离与可见结果。多人同场时，用站位、视线、遮挡和物件关系维持空间与动作连续，避免人物突然换位或动作互相冲突。感官描写选取能够参与行动、关系或气氛的少数线索，不轮流罗列五感。',
  )
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousReducedDetailWritingStyle() {
  const style = previousChecklistActionWritingStyle()
  const replacements = [
    [
      '段落围绕当前叙述焦点自然组织。优先选择会改变读者理解或场面感受的细节，人物、环境和物件按当前视角与节奏取舍；合适时让一个细节同时承担人物、氛围、信息或推进作用。日常过程适度压缩，在发现、触碰、失言、迟疑或局势转折等关键瞬间展开，避免平均用力或逐项清点，并为必要的氛围与情绪留出呼吸。',
      '段落随当前叙述焦点自然组织。优先选择会改变读者理解或场面感受的细节，人物、环境和物件按当前视角与节奏取舍。日常过程适度压缩，在发现、触碰、失言、迟疑或局势转折等关键瞬间展开，并为必要的氛围与情绪留出呼吸。',
    ],
    [
      '使用准确、自然、易读的语言和具体动词。句子与段落在快慢、疏密之间随动作速度、观察深度和情绪压力变化；关键瞬间可以放慢，过渡与常规动作利落带过。避免长时间维持单一节拍、连续堆叠碎句、用逗号串起过多动作，或把连续动作拆成等重步骤。观察落点、句法和段落节奏由当前内容决定；有意照应近期表达时，使照应产生新的含义或后果。',
      '使用准确、自然、易读的语言和具体动词。句子与段落在快慢、疏密之间随动作速度、观察深度和情绪压力变化；关键瞬间可以放慢，过渡与常规动作利落带过，避免长时间维持单一节拍或把连续动作拆成等重步骤。观察落点、句法和段落节奏由当前内容决定；有意照应近期表达时，使照应产生新的含义或后果。',
    ],
    [
      '动作写清主体、顺序、方向、距离与可见结果。多人同场时，用站位、视线、遮挡和物件关系维持空间与动作连续，避免人物突然换位或动作互相冲突。感官描写选取能够参与行动、关系或气氛的少数线索，不轮流罗列五感。',
      '动作写清主体、顺序、方向、距离与可见结果。多人同场时，用站位、视线、遮挡和物件关系维持空间感，使人物移动与动作关系保持连续。感官描写选取能够参与行动、关系或气氛的少数线索。',
    ],
    [
      '对白既要符合人物声音，也要服务其当下目标，可以短促、含混、被打断、答非所问，也可以用于试探、遮掩、交换、拒绝、拖延或言不由衷；人物差异来自用词、句式、回避方式和知识边界。连续短对话可以独立成段，但不要长期维持等长、等距的单句往返。动作、观察或场面变化能够改变一句话的分量、潜台词、场面关系、节奏或下一步时，穿插必要叙述，使发言归属与互动进展保持清楚；无需为每句话配套表情、语气标签和解释。避免反复使用“说完”“闻言”“不由得”、省略号或相同肢体反应维持节拍。',
      '对白既要符合人物声音，也要服务其当下目标，可以短促、含混、被打断、答非所问，也可以用于试探、遮掩、交换、拒绝、拖延或言不由衷；人物差异来自用词、句式、回避方式和知识边界。连续短对话可以独立成段；在动作、观察或场面变化能够改变话语分量、潜台词、节奏或下一步时穿插叙述，使发言归属与互动进展保持清楚，无需为每句话配套表情和解释。',
    ],
    [
      '情绪可以落在选择、感知、沉默、身体反应、注意力变化或物件使用上，也可在最需要清晰时简洁点明；选择当前最有分量的方式，不逐项罗列心跳、呼吸、目光和指尖。比喻保持简短、具体并贴合人物经验，同一段落不要混用多个意象。避免套话式情绪标签、模板化网络表达、抽象概念堆叠、对称口号和解释已经呈现的意义。',
      '情绪可以落在选择、感知、沉默、可见反应、注意力变化或物件使用上，也可在最需要清晰时简洁点明；选择当前最有分量的方式。比喻保持简短、具体并贴合人物经验。避免套话、抽象概念堆叠和解释已经呈现的意义。',
    ],
  ]
  for (const [current, previous] of replacements) {
    const content = style.content.replace(current, previous)
    assert.notEqual(content, style.content)
    style.content = content
  }
  return style
}

function previousPromptAuditWritingStyle() {
  const style = structuredClone(DEFAULT_WRITING_STYLE)
  style.description = PREVIOUS_PROMPT_AUDIT_STYLE_DESCRIPTION
  style.content = PREVIOUS_PROMPT_AUDIT_STYLE_CONTENT
  return style
}

function previousTargetOrganizationWritingStyle() {
  const style = previousPromptAuditWritingStyle()
  const rhythm = style.content.replace(MOVED_RHYTHM_GUIDANCE, '')
  assert.notEqual(rhythm, style.content)
  const content = rhythm.replace(/## 收束[\s\S]*$/, PREVIOUS_TARGET_STYLE_ENDING)
  assert.notEqual(content, rhythm)
  style.content = content
  return style
}

function previousCorrectiveWritingStyle() {
  const style = previousTargetOrganizationWritingStyle()
  const content = style.content.replace(/## 篇幅与收束[\s\S]*$/, PREVIOUS_CORRECTIVE_STYLE_ENDING)
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousExpansionBalanceWritingStyle() {
  const style = previousTargetOrganizationWritingStyle()
  const content = style.content.replace(/## 篇幅与收束[\s\S]*$/, PREVIOUS_EXPANSION_BALANCE_STYLE_ENDING)
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousProtagonistThoughtWritingStyle() {
  const style = previousExpansionBalanceWritingStyle()
  const marker = '\n\n## 情绪与修辞'
  const content = style.content.replace(marker, `\n\n${PREVIOUS_PROTAGONIST_THOUGHT_GUIDANCE}${marker}`)
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousDialogueParagraphWritingStyle() {
  const style = previousProtagonistThoughtWritingStyle()
  const opening = style.content.replace(CURRENT_DIALOGUE_PARAGRAPH_OPENING, PREVIOUS_DIALOGUE_PARAGRAPH_OPENING)
  assert.notEqual(opening, style.content)
  const content = opening.replace(CURRENT_SHORT_DIALOGUE_GUIDANCE, '')
  assert.notEqual(content, opening)
  style.content = content
  return style
}

function previousSingleTurnArcWritingStyle() {
  const style = previousDialogueParagraphWritingStyle()
  const currentScene = '把场景写成正在发生的事件，而不是剧情梗概。让感知、判断、对白、行动与回应保持清楚的因果关联；根据当前张力决定从何处展开、停留或略过，不预设固定链条，也不要求每轮闭合。叙述定位变化并承载细节，对白让人物带着各自目的相互作用，内心把感知转为判断与选择；三者按场景需要自然交织，共同推进当前节拍。'
  const scene = style.content.replace(currentScene, PREVIOUS_SINGLE_TURN_STYLE_SCENE)
  assert.notEqual(scene, style.content)
  const content = scene.replace(/## 篇幅与收束[\s\S]*$/, PREVIOUS_SINGLE_TURN_STYLE_ENDING)
  assert.notEqual(content, scene)
  style.content = content
  return style
}

function previousVerboseEndingWritingStyle() {
  const style = previousSingleTurnArcWritingStyle()
  const content = style.content.replace(
    '承接前文的事实、人物声音和因果，但不要机械复用近期结尾的景物切换、角色提问、动作、句法或段落节奏；除非刻意照应能产生新的含义或后果，结尾应由当前场景自然形成，不用作者总结或通用钩子代替。',
    PREVIOUS_VERBOSE_ENDING_STYLE_GUIDANCE,
  )
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousEndingImitationWritingStyle() {
  const style = previousSingleTurnArcWritingStyle()
  const content = style.content.replace(/## 篇幅与收束[\s\S]*$/, PREVIOUS_ENDING_IMITATION_STYLE_ENDING)
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousLongFormWritingStyle() {
  const style = previousSingleTurnArcWritingStyle()
  const content = style.content
    .replace(
      /设定、背景和前情只在影响[\s\S]*?\n\n动作写清/,
      `${PREVIOUS_LONG_FORM_STYLE_INFORMATION}\n\n动作写清`,
    )
    .replace(/## 篇幅与收束[\s\S]*$/, PREVIOUS_LONG_FORM_STYLE_ENDING)
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousIntegratedWritingStyle() {
  return {
    name: '通用叙事',
    description: '主角锚定、因果紧密，叙述、对白与内心自然交织的通用文风。',
    content: `没有其他明确要求时，采用贴近主角的第三人称限知叙事；用户明确指定人称、视角或文体时随之调整。叙述距离可以随节奏拉近或稍远，所知范围仍以主角为锚；对白是人物发言，不会自动切换视角。预设若允许“配角心声”，只按该规则作短暂例外。对白使用双引号，按说话人、动作转折或认知变化自然分段。

## 推进与组织

把场景写成正在发生的事件，而非剧情梗概。常用的内在链条是：外界变化—主角感知与判断—选择、行动或对白—他人回应、后果或新信息。它只用于维持因果，可以省略、交错或拉长，不要机械逐项书写。叙述定位变化并承载细节，对白推动立场与关系，内心连接感知和选择；三者按场景需要交替，共同推动同一节拍。

## 对白与内心

对白服务人物当下目标，可以试探、遮掩、交换、拒绝、拖延、误解或言不由衷；人物声音来自用词、句式、回避方式和知识边界。只在动作、观察或念头改变一句话的分量、潜台词或下一步时穿插叙述，不给每句话配套表情和解释。

主角内心默认融入自由间接引语，让叙述自然带上其判断、偏见和欲望；需要锋利、私密或富有角色声音的瞬间，才短暂使用直接念头。内心应解释证据、暴露误判或影响下一步，不复述刚发生的事，也不替读者总结。

## 描写与详略

${CHARACTER_DESCRIPTION_GUIDANCE}

设定、背景和前情只在影响当下判断、选择或后果时进入正文，借观察、比较、回忆、冲突或误解分散交代。给足理解场景所需的信息，不一次讲完世界。常规移动、重复动作和已知信息压缩；决定、发现、失误、关系转折与不可逆结果展开。动作写清主体、方向、距离和可见结果，多人同场用站位、视线与物件维持空间连续。

## 语言与节奏

语言准确、自然、易读。短句用于加速或落锤，长句承载观察、推理与余韵；句段长短随压力变化，不维持单一节拍。优先使用具体动词和符合当前角色注意力的细节，让一个细节或一句对白同时承担氛围、人物、信息或推进中的多种作用。

情绪可以经感知、念头、沉默、动作或身体反应呈现，选最有力的方式，不逐项罗列。比喻简短、具体并符合人物经验。成稿既不是聊天记录，也不是密集说明墙；不预设明快、甜美、幽默或沉重，让基调服从人物与场景。

## 篇幅与收束

篇幅服从一个完整、有意义的叙事节拍，不设字数、段数或对白比例。该展开的转折与余波充分展开，该压缩的过渡利落带过；不为显得丰富而填充，也不在第一层反应后截断。让本轮给出可感的回答、发现、得失、决定、关系变化、亲近、恐惧或代价，再落到后果、新压力或自然静止点，不用作者总结或通用钩子代替收束。`,
  }
}

function previousPreAppearanceWritingStyle() {
  const style = previousIntegratedWritingStyle()
  const content = style.content.replace(`## 描写与详略\n\n${CHARACTER_DESCRIPTION_GUIDANCE}\n\n`, '## 信息与详略\n\n')
  assert.notEqual(content, style.content)
  style.content = content
  return style
}

function previousDefaultWritingStyle() {
  return {
    name: '通用叙事',
    description: '清晰、具体、有节奏的近距离叙事，兼顾对白、动作与氛围。',
    content: `没有其他明确要求时，采用贴近主角感受的第三人称限知叙事；用户明确指定人称、视角或文体时随之调整。对白使用双引号，按说话人、动作变化或叙述焦点自然分段。

## 语言与节奏

使用准确、自然、易读的语言。句子长短随动作速度、观察深度和情绪压力变化：关键瞬间可以放慢，过渡与常规动作应利落带过。避免整段维持同一节拍、连续堆叠碎句、用逗号串起过多动作，或把每个动作拆成等重的步骤。

## 叙述焦点

每段围绕一个清晰的叙述焦点组织。优先写会改变读者理解或场面感受的细节，人物外貌、衣着、环境和物件只选当前有作用的部分。日常过程适度压缩，在发现、触碰、失言、迟疑或局势转折等关键瞬间展开；不要平均用力或逐项清点。

## 动作与空间

动作写清主体、顺序、方向、距离与可见结果。多人同场时，用站位、视线、遮挡和物件关系维持空间感，避免人物突然换位或动作互相冲突。感官描写选择场景最突出的少数线索，让声音、温度、触感、气味或光线参与当下动作；不要轮流罗列五感。

## 对白与段落

对白可以短促、含混、被打断或答非所问，让语气和用词承担潜台词。叙述只在动作改变对白含义、场面关系或节奏时穿插，不必给每句话配表情、语气标签和内心解释。避免反复使用“说完”“闻言”“不由得”、省略号和相同肢体反应维持节拍。

## 情绪与修辞

情绪先落在可观察的选择、身体反应、注意力变化或物件使用上，再决定是否直说；一种有分量的迹象通常胜过连续罗列心跳、呼吸、目光和指尖。比喻保持简短、具体并贴合人物经验，同一段落不要混用多个意象。避免套话式情绪标签、模板化网络表达、抽象概念堆叠、对称口号和解释句子自身意义的文字。

成稿应具体、流畅、层次清楚。不要预设明快、甜美、幽默、抒情或沉重等固定基调；让措辞、密度和节奏服从当前人物、场景与题材。`,
  }
}

test('seeds one default general style and preserves it across service instances', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-default-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const first = new RpWritingStyles(firstCtx, configFor(root))
  const second = new RpWritingStyles(secondCtx, configFor(root))
  try {
    const [seeded, same] = await Promise.all([first.ensureDefault(), second.ensureDefault()])
    assert.equal(seeded.name, DEFAULT_WRITING_STYLE.name)
    assert.equal(seeded.description, DEFAULT_WRITING_STYLE.description)
    assert.equal(seeded.isDefault, true)
    assert.match(seeded.content, /第三人称限知叙事/)
    assert.match(seeded.content, /所知范围仍以主角为锚/)
    assert.match(seeded.content, /对白是人物发言，不会自动切换视角/)
    assert.match(seeded.content, /“配角心声”/)
    assert.match(seeded.content, /对白使用双引号/)
    assert.match(seeded.content, /保持发言归属清楚/)
    assert.match(seeded.content, /## 场景呈现与叙述焦点/)
    assert.match(seeded.content, /叙述负责定位变化、承载细节与维持因果/)
    assert.match(seeded.content, /对白让人物带着各自目的相互作用，行动与可见反应改变场面/)
    assert.match(seeded.content, /根据当前张力决定哪里展开、停留或略过/)
    assert.match(seeded.content, /表达方式自然交织而不成为固定链条/)
    assert.match(seeded.content, /段落围绕当前叙述焦点自然组织/)
    assert.match(seeded.content, /人物、环境和物件按当前视角与节奏取舍/)
    assert.match(seeded.content, /一个细节同时承担人物、氛围、信息或推进作用/)
    assert.match(seeded.content, /日常过程适度压缩/)
    assert.match(seeded.content, /避免平均用力或逐项清点/)
    assert.match(seeded.content, /为必要的氛围与情绪留出呼吸/)
    assert.match(seeded.content, /句子与段落在快慢、疏密之间随动作速度、观察深度和情绪压力变化/)
    assert.match(seeded.content, /避免长时间维持单一节拍、连续堆叠碎句、用逗号串起过多动作/)
    assert.match(seeded.content, /把连续动作拆成等重步骤/)
    assert.match(seeded.content, /观察落点、句法和段落节奏由当前内容决定/)
    assert.match(seeded.content, /有意照应近期表达时，使照应产生新的含义或后果/)
    assert.doesNotMatch(`${seeded.description}\n${seeded.content}`, /主角内心默认融入|自由间接引语|直接念头|内心|念头/)
    assert.match(seeded.content, /## 描写、动作与空间/)
    assert.match(seeded.content, /重要人物初次出现或成为场景焦点/)
    assert.match(seeded.content, /样貌、神态、衣着、伤痕与装束/)
    assert.match(seeded.content, /从当前视角选取最有辨识度的细节/)
    assert.match(seeded.content, /融入观察、动作与互动/)
    assert.match(seeded.content, /形象清晰可感、便于代入与想象/)
    assert.match(seeded.content, /尊重既有人设与用户留白/)
    assert.match(seeded.content, /不作从头到脚的清单/)
    assert.doesNotMatch(seeded.content, /设定、背景和前情只在影响|把其余内容留到人物真正接触|密集引入彼此无关的新设定/)
    assert.match(seeded.content, /动作描写以行动过程和空间关系清楚可辨为准/)
    assert.match(seeded.content, /让读者理解谁在做什么、人物彼此处于何处，以及动作产生了什么变化/)
    assert.match(seeded.content, /先后、方向和距离在影响理解时自然交代/)
    assert.match(seeded.content, /用必要的站位、视线、遮挡和物件关系维持空间与动作连续/)
    assert.match(seeded.content, /避免人物突然换位或动作互相冲突/)
    assert.match(seeded.content, /感官描写选取能够参与行动、关系或气氛的少数线索/)
    assert.match(seeded.content, /不轮流罗列五感/)
    assert.match(seeded.content, /## 对白与人物反应/)
    assert.match(seeded.content, /对白既要符合人物声音，也要服务其当下目标/)
    assert.match(seeded.content, /短促、含混、被打断、答非所问/)
    assert.match(seeded.content, /连续短对话可以独立成段/)
    assert.match(seeded.content, /不要长期维持等长、等距的单句往返/)
    assert.match(seeded.content, /动作、观察或场面变化能够改变一句话的分量、潜台词、场面关系、节奏或下一步/)
    assert.match(seeded.content, /发言归属与互动进展保持清楚/)
    assert.match(seeded.content, /无需为每句话配套表情、语气标签和解释/)
    assert.match(seeded.content, /避免反复使用“说完”“闻言”“不由得”、省略号或相同肢体反应维持节拍/)
    assert.match(seeded.content, /情绪可以落在选择、感知、沉默、身体反应、注意力变化或物件使用上/)
    assert.match(seeded.content, /最需要清晰时简洁点明/)
    assert.match(seeded.content, /不逐项罗列心跳、呼吸、目光和指尖/)
    assert.match(seeded.content, /同一段落不要混用多个意象/)
    assert.match(seeded.content, /避免套话式情绪标签、模板化网络表达、抽象概念堆叠、对称口号/)
    assert.match(seeded.content, /不要预设明快、甜美、幽默、抒情或沉重等固定基调/)
    assert.doesNotMatch(seeded.content, /## (?:篇幅与)?收束|本轮落在当前叙述焦点|结尾的意义|悬念和接续力/)
    assert.doesNotMatch(seeded.content, /篇幅|字数|段数|对白比例/)
    assert.doesNotMatch(seeded.content, /篇幅随内容和节奏自然伸缩|不为得到结尾强行推进|不要惯性追加新秘密|不机械复用近期回复/)
    assert.doesNotMatch(seeded.content, /篇幅由完整呈现本轮必要叙事节拍|不在第一层反应后截断|不为一次写完整个场景而过度推进/)
    assert.doesNotMatch(seeded.content, /外界变化—主角感知与判断—/)
    assert.doesNotMatch(seeded.content, /\d+\s*字|固定.{0,4}段|对白.{0,4}%/)
    assert.doesNotMatch(`${seeded.description}\n${seeded.content}`, /轻小说|Light Novel/i)
    assert.equal(same.id, seeded.id)
    const listed = await first.list()
    assert.equal(listed.total, 1)
    assert.equal(listed.defaultId, seeded.id)
    assert.equal(listed.items[0].isDefault, true)
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the style from before action guidance became scene-oriented', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-action-guidance-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousChecklistActionWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the style from before intentional prose details were restored', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-detail-restore-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousReducedDetailWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the style from before prompt responsibilities were separated', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-responsibility-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousPromptAuditWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the style from before length moved to output requirements', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-length-separation-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousTargetOrganizationWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous corrective-expansion general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-target-organization-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousCorrectiveWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous minimum-expansion general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-expansion-balance-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousExpansionBalanceWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous protagonist-thought general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-protagonist-thought-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousProtagonistThoughtWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous dialogue-paragraphing general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-dialogue-paragraphing-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousDialogueParagraphWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the immediately previous single-turn arc style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-multi-turn-balance-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousSingleTurnArcWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous verbose ending rule', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-ending-rule-trim-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousVerboseEndingWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous ending-variation general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-ending-imitation-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousEndingImitationWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous long-form general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-long-form-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousLongFormWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the previous integrated managed general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-latest-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousIntegratedWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the managed general style from before the appearance guidance', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-current-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousPreAppearanceWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.description, DEFAULT_WRITING_STYLE.description)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the baseline managed general style', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-baseline-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create(previousDefaultWritingStyle())
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.description, DEFAULT_WRITING_STYLE.description)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the untouched previous default without overwriting later user edits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create({
      name: '通用叙事',
      description: '清晰、贴近角色、对白有层次，具有轻小说式的可读性。',
      content: `没有其他明确要求时，采用贴近主角所见所闻的第三人称叙事。叙述范围跟随当前视角和用户明确指示，不随意跳入其他角色内心。对白使用双引号，段落自然紧凑。

## 语言与节奏

整体保持清晰、贴近角色、轻盈而有推动力的小说叙事。以日常、易读的语言和短至中等长度的句子为主，根据场景的重要性放慢或加快；不要为了轻快而把危险、悲伤或严肃的边界写得轻浮。

## 场景呈现

让叙述、动作、环境与对白共同推进场景，不要把正文写成聊天记录。优先使用直接的动词和具体细节；细节应承载情绪、线索、关系、身份、场所质感或行为后果。描写保持选择性和功能性，避免对外貌、物件或环境做清单式堆砌。

## 对白与人物

让对白承载压力、个性和潜台词。角色可以回避、打断、间接回答、误解或留下未说出口的部分；重要角色的声音应彼此可辨。轻松感可以来自时机、反差、尴尬、误解或人物性格，但不要强塞笑话、密集抖机灵或网络梗，也不要用幽默抹平真实后果。

## 情绪与信息

先通过选择、停顿、目光、距离、沉默、物件和行为变化呈现情绪与意义，再考虑是否需要直接点明。让吸引、难堪、受伤、不信任与释然通过事件逐步累积，不用套话式情绪标签替代过程。世界信息只在与当前场景相关时，通过正在发生的事情自然显露，避免成段说明。

## 修辞与避免

比喻保持简短、具体、自然；不要为普通动作强加只求深刻的华丽句子。避免重复俏皮话、为推进而制造的误会、作者说教、模板化网络表达、堆叠抽象概念、对称口号、励志总结、反复使用的修辞对照，以及解释自身意义的文字。

成稿应亲近、鲜活、流畅：有轻小说式的可读性和人物感，但不浅薄、仓促、过度活跃、甜腻、煽情或故作深沉。`,
    })
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.description, DEFAULT_WRITING_STYLE.description)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)

    const customized = await styles.update(migrated.id, { name: '通用叙事', description: '用户已调整', content: '保留用户自己的文风要求。' }, migrated.revision)
    const kept = await styles.ensureDefault()
    assert.equal(kept.id, customized.id)
    assert.equal(kept.revision, customized.revision)
    assert.equal(kept.content, '保留用户自己的文风要求。')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('continues to migrate the first untouched managed default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-first-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create({
      name: '通用叙事',
      description: '贴近角色视角、对白清晰，适合多数互动故事。',
      content: `没有其他明确要求时，采用贴近主角所见所闻的第三人称叙事。

对白使用双引号，段落保持自然。使用能够承载情绪、线索、关系或场所质感的具体细节推进场景。`,
    })
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('adds the initial style once to an existing library and does not recreate it after deletion', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-existing-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const custom = await styles.create({ name: '已有文风', content: '保留已有写法。' })
    const seeded = await styles.ensureDefault()
    assert.equal(seeded.name, DEFAULT_WRITING_STYLE.name)
    assert.notEqual(seeded.id, custom.id)
    assert.equal((await styles.list()).total, 2)
    assert.equal((await styles.ensureDefault()).id, seeded.id)
    await styles.delete(seeded.id, seeded.revision)
    const remaining = await styles.ensureDefault()
    assert.equal(remaining.id, custom.id)
    assert.equal((await styles.list()).total, 1)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('creates, updates and lists reusable writing styles', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const created = await styles.create({ name: '电影感', description: '悬疑场景', content: '使用克制的近景描写。' })
    const stored = await styles.get(created.id)
    assert.equal(stored.content, '使用克制的近景描写。')
    const updated = await styles.update(created.id, { name: '电影感', description: '悬疑与动作场景', content: '使用近景描写，减少解释。' }, stored.revision)
    assert.equal(updated.revision, 2)
    assert.deepEqual((await styles.list()).items.map(item => item.name), ['电影感'])
    await assert.rejects(styles.update(created.id, { name: '冲突', content: '内容' }, 1), error => error.code === 'REVISION_CONFLICT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects non-canonical writing-style fields instead of silently discarding them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-native-schema-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    await assert.rejects(
      styles.create({ name: '冷峻', instructions: '使用短句。', content: '使用短句。' }),
      error => error.code === 'INVALID_REQUEST' && /unknown field "instructions"/.test(error.message),
    )
    const created = await styles.create({ name: '冷峻', content: '使用短句。' })
    await assert.rejects(
      styles.update(created.id, { name: '冷峻', content: '使用短句。', requirements: ['克制'] }, created.revision),
      error => error.code === 'INVALID_REQUEST' && /unknown field "requirements"/.test(error.message),
    )
    assert.equal((await styles.get(created.id)).revision, created.revision)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('agent writing-style guidance requires the exact canonical body', async () => {
  const guidance = await readFile(new URL('../skills/rp-guide-writing-style/SKILL.md', import.meta.url), 'utf8')
  assert.match(guidance, /pass exactly `value: \{ name, description\?, content \}`/)
  assert.match(guidance, /Unlisted fields such as `instructions`, `requirements`, or `style` are rejected/)
})

test('deletes a writing style through the service and browser Remote', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-delete-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const direct = await styles.create({ name: '待删除', content: '这项内容将被删除。' })
    assert.deepEqual(await styles.delete(direct.id, direct.revision), { id: direct.id })
    await assert.rejects(styles.get(direct.id), error => error.code === 'ASSET_NOT_FOUND')

    const throughRpc = await styles.create({ name: '通过接口删除', content: '确认后删除。' })
    const updated = await styles.update(throughRpc.id, { name: '通过接口删除', content: '内容刚刚更新。' }, throughRpc.revision)
    await assert.rejects(dispatchBrowser(styles, 'delete', { id: throughRpc.id, expectedRevision: throughRpc.revision }), error => error.code === 'REVISION_CONFLICT')
    assert.deepEqual(await dispatchBrowser(styles, 'delete', { id: throughRpc.id, expectedRevision: updated.revision }), { id: throughRpc.id })
    assert.equal((await styles.list()).total, 0)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('expands selected live styles in Session order into independently movable prompt sources', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-source-'))
  const ctx = new Context()
  let source
  let bindings = []
  ctx.provide('rpRuntime', { registerContextSource(value) { source = value; return () => {} } })
  ctx.provide('rpSessions', { get() { return { resources: { writingStyles: bindings } } } })
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const first = await styles.create({ name: '冷峻', description: '适合悬疑场景。', content: '短句，少解释。' })
    const second = await styles.create({ name: '诗性', description: '适合抒情场景。', content: '使用具象意象。' })
    bindings = [{ id: second.id }, { id: first.id }]
    const value = await source.prepare({ agent: {} })
    assert.deepEqual(value.sources.map(item => item.label), ['诗性', '冷峻'])
    assert.deepEqual(value.sources.map(item => item.text), ['使用具象意象。', '短句，少解释。'])
    assert.deepEqual(value.sources.map(item => item.id), [`rp.writing-style:${second.id}`, `rp.writing-style:${first.id}`])
    assert.deepEqual(value.sources.map(item => item.defaultSlot.id), value.sources.map(item => item.id))
    assert.deepEqual(value.sources.map(item => item.defaultSlot.label), ['诗性', '冷峻'])
    assert.deepEqual(value.sources.map(item => item.defaultSlot.order), [20, 20.001])
    assert.deepEqual(value.sources.map(item => item.diagnostics.selectionOrder), [1, 2])
    assert.ok(value.sources.every(item => !/适合悬疑场景|适合抒情场景|revision|position|count/.test(item.text)))
    assert.equal(source.defaultSlot.locked, undefined)
    assert.equal(source.id, 'rp.writing-style')
    assert.deepEqual(source.defaultSlot, { id: 'writing-style', label: '文风', order: 20 })
    assert.deepEqual(source.legacySlotIds, ['writing-style', 'prompt-bottom'])
    assert.deepEqual(source.legacySourceIds, ['rp.writing-style'])
    assert.equal(source.order, 20)
    assert.deepEqual(await styles.resolveBindings([first.id, second.id]), [{ id: first.id }, { id: second.id }])
    await assert.rejects(styles.resolveBindings([first.id, first.id]), error => error.code === 'INVALID_REQUEST')
    await styles.delete(second.id, second.revision)
    const withDeletedBinding = await source.prepare({ agent: {} })
    assert.deepEqual(withDeletedBinding.sources.map(item => item.id), [`rp.writing-style:${first.id}`])
    assert.equal(withDeletedBinding.sources[0].diagnostics.selectionOrder, 1)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('enforces complete text and per-session selection limits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-limit-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, { libraryDir: root, maxTextCharacters: 8, maxStylesPerSession: 1, exposeBrowser: false })
  try {
    const exact = await styles.create({ name: '甲', content: '1234567' })
    await assert.rejects(styles.create({ name: '甲', content: '12345678' }), error => error.code === 'LIMIT_EXCEEDED')
    await assert.rejects(styles.resolveBindings([exact.id, '00000000-0000-0000-0000-000000000001']), error => error.code === 'LIMIT_EXCEEDED')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('initialization can be disposed without registering effects on an inactive context', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-lifecycle-'))
  const ctx = new Context()
  const gate = Promise.withResolvers()
  const started = Promise.withResolvers()
  const registered = Promise.withResolvers()
  const originalEnsureDefault = RpWritingStyles.prototype.ensureDefault
  let handler
  let disposed = false
  let fiber
  RpWritingStyles.prototype.ensureDefault = async function () {
    started.resolve()
    await gate.promise
    return originalEnsureDefault.call(this)
  }
  ctx.provide('rpRemote', {
      register(path, next) {
        assert.equal(path, '/rp-writing-styles')
        handler = next
        registered.resolve()
        return () => { disposed = true }
      },
  })
  try {
    fiber = ctx.plugin({ name: 'rp-writing-style-lifecycle-test', apply }, { ...configFor(root), exposeBrowser: true })
    await Promise.all([started.promise, registered.promise])
    let requestSettled = false
    const request = handler('list', { limit: 10 }).then(value => {
      requestSettled = true
      return value
    })
    await Promise.resolve()
    assert.equal(requestSettled, false, 'RPC must wait for writing-style initialization')

    const disposal = fiber.dispose()
    gate.resolve()
    const response = await request
    assert.equal(response.value.value.total, 1)
    await disposal
    await fiber.await()
    assert.equal(disposed, true)
  } finally {
    RpWritingStyles.prototype.ensureDefault = originalEnsureDefault
    gate.resolve()
    if (fiber?.uid !== null) await fiber.dispose()
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('browser entry provides creation, editing and reduced-motion behavior', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /'aria-label': '文风'/)
  assert.match(client, /'创建你的第一种文风'/)
  assert.match(client, /'新建文风'/)
  assert.match(client, /reducedMotion: 'user'/)
  assert.match(client, /rp-assets\.writing-style-entry/)
  assert.match(client, /className: css\.listToolbar/)
  assert.match(client, /className: compact \? `\$\{css\.dialog\} \$\{css\.compactDialog\}`/)
  assert.match(styles, /\.content>:last-child\{flex:1;min-width:0;min-height:0;overflow:hidden;/)
  assert.match(styles, /\.empty,\.state\{[^}]*height:100%;[^}]*flex:1;[^}]*justify-content:center;/)
  assert.match(styles, /\.list\{width:min\(680px,100%\);gap:6px;/)
  assert.match(styles, /\.row\{grid-template-columns:36px minmax\(0,1fr\) auto;gap:10px;min-height:60px;/)
  assert.match(styles, /\.compactDialog\{width:min\(760px,calc\(100vw - 48px\)\);height:min\(520px,/)
  assert.match(client, /export const inject = \['slots', 'rpRemote', 'rpAssetEditors'\]/)
  assert.match(client, /ctx\.rpAssetEditors\.register\('writingStyle', WritingStyleSessionEditor\)/)
  assert.match(client, /function WritingStyleSessionEditor/)
  assert.match(client, /h\(WritingStyleEditor/)
  assert.match(client, /'删除文风'/)
  assert.match(client, /function WritingStyleRow/)
  assert.match(client, /h\(Menu, \{/)
  assert.match(client, /\{ id: 'delete', label: '删除文风', danger: true \}/)
  assert.match(client, /IconEllipsisOutline16/)
  assert.match(client, /IconTrashOutline16/)
  assert.match(client, /function DeleteWritingStyleDialog/)
  assert.match(client, /rpc\(connection, 'delete', \{ id: target\.id, expectedRevision: target\.revision \}\)/)
  assert.match(client, /仍在使用它的对话可能无法继续生成回复/)
  assert.match(client, /onDelete: draft\.id === null \? undefined/)
  assert.match(client, /function WritingStyleEditor\(\{ draft, onDraft, onBack, onSave, onDelete/)
  assert.match(styles, /\.rowWrap\{display:grid;grid-template-columns:minmax\(0,1fr\) 36px;/)
  assert.match(styles, /\.moreAction\{display:inline-flex;width:32px;height:32px;/)
  assert.match(styles, /\.deleteDialog\{width:min\(460px,/)
  assert.match(styles, /\.deleteSummary\{display:flex;flex-direction:column;/)
})
