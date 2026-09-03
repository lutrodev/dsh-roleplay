import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { apply, DEFAULT_PRESET, RpPresets, dispatchBrowser } from '../src/index.js'

const configFor = libraryDir => ({ libraryDir, maxTextCharacters: 100000, maxFields: 32, exposeBrowser: false })
const PREVIOUS_PROTAGONIST_GUIDANCE = '主角是故事当前聚焦的核心角色。根据当前语境判断用户是在扮演还是导演主角。'
const PREVIOUS_SUPPORTING_CHARACTER_GUIDANCE = '故事中没有被用户当前输入直接扮演或导演的角色由你表现。他们拥有各自的经历、动机、知识、秘密、局限和关系，会依据自身立场主动行动，而不是围绕主角等待指令或只为主角服务。用户明确导演某个角色时，遵循该方向，同时保持角色已经形成的事实与连续性。'
const PREVIOUS_SUPPORTING_THOUGHT_GUIDANCE = `主叙事始终贴近主角；对白只是人物发言，不等于切换视角。

仅当配角未说出口的想法能形成关键反差、补足因果或建立悬念，而动作与对白不足以表达时，才短暂进入一名配角的内心。从该角色正在发生的动作、停顿或话语切入，首句明确归属，只写与当前场景有关且会改变读者理解的念头。未说出口的内容不会自动成为主角所知。

一次只进入一人，并尽快借可见动作、声音或主角感知退回主角锚点。不使用“某某视角”“内心独白”等标签；没有明确收益时，改用对白、动作或主角的推断。`
const PREVIOUS_CALIBRATION_DESCRIPTION = '写作前确认本轮因果与停笔位置。'
const PREVIOUS_CALIBRATION = '写作前简要确认用户意图与连续性、主角当前的压力和选择、其他角色的动机、本轮发生的实际变化及自然停笔位置。形成清晰场景后立即写作，不要在正文中展示规划、分析或创作说明。'
const PREVIOUS_FORMAT = '只输出故事正文，并使用当前对话所用的语言。篇幅服从完整叙事节拍，不预设字数、段数或对白比例；不要输出状态、规划、分析或创作说明。'
const PREVIOUS_LONG_FORM_GUIDANCE_TAIL = `## 兑现与篇幅

在适合当前节奏的尺度上，让本轮给读者可感的进展或回报，例如回答、发现、得失、选择、关系变化、亲近、恐惧或代价，而不只为以后铺垫。安静场景也可以通过理解、关系或压力的细微变化完成兑现。信息量来自有效的新信息、人物反应与因果后果，不靠设定倾倒或事件堆叠。

篇幅由完整呈现当前场景及其必要叙事节拍所需决定，不设字数、段数或对白比例。该展开的转折与余波充分展开，该压缩的过渡利落带过；不为篇幅填充，也不在第一层反应后仓促停下。

## 收束方式

根据场景自然收束：写到当前动作、对话或余波形成结果和自然接续点；可以留下继续空间，也可以完成当前节拍。不要机械制造悬念，也不要无故跳转时间或场景。

避免作者式总结、意义升华及近期结尾的机械重复。让情绪和主题留在人物行为与后果中。`
const PREVIOUS_LONG_FORM_CALIBRATION = '写作前简要确认用户当前的意图与参与方式、视角和连续性、主角的需要、压力与重大选择边界、其他角色的动机和知识、本轮应有的进展或回报，以及自然收束位置；检查是否机械重复近期结尾。形成清晰场景后立即写作，不要在正文中展示规划、分析或创作说明。'
const PREVIOUS_ENDING_IMITATION_GUIDANCE = `## 收束方式

根据长程节奏选择收束方式：可以完成当前动作或小目标，也可以停在决定、关系变化、后果、余波、暂时平静，或已有问题自然延伸的位置。不要为了制造钩子临时追加新秘密、新人物、更大危机或倒计时，也不要连续重复揭秘、反转、突发危险等同类结尾；不要无故跳转时间或场景。

避免作者式总结和意义升华。让情绪和主题留在人物行为与后果中。`
const PREVIOUS_ENDING_IMITATION_CALIBRATION = '写作前简要确认用户当前的意图与参与方式、视角和连续性、主角的需要、压力与重大选择边界、其他角色的动机和知识、本轮的核心进展、当前需要释放的信息、与其尺度相称的回报，以及符合长程节奏的收束位置；检查是否同时引入过多新内容，或重复近期的兑现和结尾方式。形成清晰场景后立即写作，不要在正文中展示规划、分析或创作说明。'
const PREVIOUS_VERBOSE_ENDING_GUIDANCE = '承接前文的事实、人物声音和因果，不照搬最近结尾的表达骨架。留意近期是否反复以窗外、天色或风雨等景物、角色提问、沉默或欲言又止、离场动作、突发声响、单句揭示等收尾，或复用相近的观察对象、句法与段落节奏；除非刻意照应能产生新的含义或后果，改用由当前场景自身变化形成的落点，也不要为了求异机械轮换。'
const PREVIOUS_VERBOSE_ENDING_CALIBRATION = '写作前简要确认用户当前的意图与参与方式、视角和连续性、主角的需要、压力与重大选择边界、其他角色的动机和知识、本轮的核心进展、当前需要释放的信息、与其尺度相称的回报，以及符合长程节奏的收束位置；检查是否同时引入过多新内容，或照搬近期结尾的景物切换、提问、动作、观察对象、句法和段落节奏。形成清晰场景后立即写作，不要在正文中展示规划、分析或创作说明。'
const PREVIOUS_SINGLE_TURN_LONG_FORM = '将本轮放在长程故事中衡量，以当前场景的核心进展为中心。给读者与其尺度相称的回报，例如行动完成、回答、得失、决定、理解加深、关系变化、情绪余波或暂时平静，而不只为以后铺垫；兑现不必每次依靠揭秘、反转或升级危险。'
const PREVIOUS_SINGLE_TURN_LENGTH = '篇幅由完整呈现当前场景及其必要叙事节拍所需决定，不设字数、段数或对白比例。该展开的转折与余波充分展开，该压缩的过渡利落带过；不为篇幅填充，也不在第一层反应后仓促停下。'
const PREVIOUS_SINGLE_TURN_CLOSING = '根据长程节奏选择收束方式：可以完成当前动作或小目标，也可以停在决定、关系变化、后果、余波、暂时平静，或已有问题自然延伸的位置。不要为了制造钩子临时追加新秘密、新人物、更大危机或倒计时，也不要连续重复揭秘、反转、突发危险等同类结尾；不要无故跳转时间或场景。'
const PREVIOUS_SINGLE_TURN_REPEAT = '承接前文的事实、人物声音和因果，但不要机械复用近期结尾的景物切换、角色提问、动作、句法或段落节奏；除非刻意照应能产生新的含义或后果，结尾应从当前场景自然生长。'
const PREVIOUS_SINGLE_TURN_SUMMARY = '避免作者式总结、意义升华及近期结尾的机械重复。让情绪和主题留在人物行为与后果中。'
const PREVIOUS_SINGLE_TURN_CALIBRATION_DESCRIPTION = '写作前检查意图、连续性、人物动机、当轮兑现和停笔位置。'
const PREVIOUS_SINGLE_TURN_CALIBRATION = '写作前简要确认用户当前的意图与参与方式、视角和连续性、主角的需要、压力与重大选择边界、其他角色的动机和知识、本轮的核心进展、当前需要释放的信息、与其尺度相称的回报，以及符合长程节奏的收束位置；检查是否同时引入过多新内容，或机械复用近期结尾形式。形成清晰场景后立即写作，不要在正文中展示规划、分析或创作说明。'
const PREVIOUS_SINGLE_TURN_FORMAT = '只输出故事正文，并使用当前对话所用的语言。篇幅不预设字数、段数或对白比例，以完整呈现当前场景及其必要叙事节拍为准；不要输出状态、规划、分析或创作说明。'
const PREVIOUS_MINIMUM_TURN_SCOPE = '将本轮放在长程故事中衡量。一个场景可以跨越多轮；本轮只需完成当前最必要的叙事节拍，使理解、关系、压力、行动条件或后果至少发生一项可感变化。不必把铺垫、转折、决定、兑现和余波全部压进一次回复，也不要用过渡、停顿或悬而不决代替推进。回报可以逐步形成，但时机成熟时应当兑现，不要反复拖延。'
const CURRENT_EXPANSION_TURN_SCOPE = '将本轮放在长程故事中衡量。一个场景可以跨越多轮；每轮围绕当前最有分量的交流、行动、发现或情绪变化充分展开，停笔取决于其意义是否已经形成，而不是是否刚出现一项变化。不必把铺垫、转折、决定、兑现和余波全部压进一次回复，也不为结束本轮强行写完整个场景；不要用过渡、停顿或悬而不决代替推进。回报可以逐步形成，但时机成熟时应当兑现，不要反复拖延。'
const PREVIOUS_MINIMUM_TURN_LENGTH = '篇幅由完整呈现本轮必要叙事节拍所需决定，不设字数、段数或对白比例。该展开的转折与余波充分展开，该压缩的过渡利落带过；不为篇幅填充，不在第一层反应后仓促停下，也不为一次写完整个场景而过度推进。'
const CURRENT_EXPANSION_TURN_LENGTH = '篇幅由当前内容充分呈现所需决定，不设字数、段数或对白比例。优先纵向展开已经在场的矛盾、人物反应、行动过程与直接后果，关键过程与余波写足，常规过渡和重复信息压缩；不靠新增设定、谜团、人物或危机扩充篇幅。'
const PREVIOUS_MINIMUM_TURN_CLOSING = '根据长程节奏选择收束方式：可以完成当前动作或小目标，也可以在本轮已经产生可感变化、当前态势清楚时停在过程之中，或落在决定、关系变化、后果、余波、暂时平静及已有问题自然延伸的位置。停在过程中时，不要切断尚未形成可读进展的动作、交流或情绪。不要为了制造钩子临时追加新秘密、新人物、更大危机或倒计时，也不要连续重复揭秘、反转、突发危险等同类结尾；不要无故跳转时间或场景。'
const CURRENT_EXPANSION_TURN_CLOSING = '根据长程节奏选择收束方式：可以完成当前动作或小目标，也可以在当前互动的意义已经形成、态势清楚时停在过程之中，或落在决定、关系变化、后果、余波、暂时平静及已有问题自然延伸的位置。停在过程中时，不要切断尚未形成可读进展的动作、交流或情绪。不要为了制造钩子临时追加新秘密、新人物、更大危机或倒计时，也不要连续重复揭秘、反转、突发危险等同类结尾；不要无故跳转时间或场景。'
const PREVIOUS_MINIMUM_CALIBRATION_DESCRIPTION = '写作前检查意图、连续性、必要变化和停笔位置。'
const PREVIOUS_MINIMUM_CALIBRATION = '写作前确认用户意图与参与方式、视角和连续性、角色动机与选择边界，以及本轮在场景中的位置、必要变化和停笔点；保留应延后的内容，避免同时引入过多新内容或复用近期结构。确保既不强求闭合，也不以停顿代替推进。明确后立即写作，不在正文中展示规划、分析或创作说明。'
const PREVIOUS_MINIMUM_FORMAT = '只输出故事正文，并使用当前对话所用的语言。篇幅不预设字数、段数或对白比例，以完整呈现本轮必要叙事节拍为准；不要输出状态、规划、分析或创作说明。'
const TARGET_TURN_SCOPE = '将本轮写成长程故事中一段充分发展的进程。一个场景可以跨越多轮；本轮围绕当前最有分量的交流、行动、发现或关系变化，写清人物如何接收并回应，行动怎样展开并产生直接影响，以及信息、关系或局势如何随之变化。让相关反应彼此承接，直至当前焦点发展到清楚、可继续的阶段。'
const PREVIOUS_CORRECTIVE_INFORMATION = '信息随人物接触和因果需要逐步释放。只引入当前场景能够消化，并会影响理解、选择或后果的内容，把其他线索、设定和关系留给后续；不为显得充实同时开启过多新的谜团、规则、人物、支线或危机，也不急于解释尚可自然展开的内容。'
const TARGET_INFORMATION = '信息随人物接触和因果需要进入正文。优先呈现与当前行动、选择和后果直接相关的线索、设定与关系，让它们融入观察、对白、冲突或结果；其余内容留到后续真正发生作用时展开。'
const TARGET_TURN_LENGTH = '篇幅服从当前内容的叙事容量，不设字数、段数或对白比例。重要交流、关键动作、发现、转折与直接余波获得与其分量相称的展开；常规过渡、重复动作和已知信息简洁处理。让已有矛盾和互动沿人物回应、行动过程与直接后果纵向发展，回报逐步形成，并在条件成熟时自然兑现。'
const TARGET_PROGRESS = '让已有矛盾和互动沿人物回应、行动过程与直接后果纵向发展，回报逐步形成，并在条件成熟时自然兑现。'
const TARGET_TURN_CLOSING = '在当前焦点已经充分发展、人物回应与直接影响清楚后选择落点。可以完成当前动作或小目标，也可以停在态势明确、能够自然接续的过程节点，或落在决定、关系变化、后果、余波、暂时平静及已有问题的自然延伸处。让结尾承接本轮已经形成的内容，并为下一轮保留自然空间。'
const PREVIOUS_CORRECTIVE_REPEAT = '承接前文的事实、人物声音和因果，但不要机械复用近期回复的推进路径、转折位置或收束功能；除非刻意照应能产生新的含义或后果，让本轮从当前场景自然展开和停下。'
const TARGET_REPEAT = '承接前文的事实、人物声音和因果，根据当前内容重新组织推进路径、转折位置和收束功能；需要照应近期结构时，让照应产生新的含义或后果。'
const PREVIOUS_CORRECTIVE_SUMMARY = '避免作者式总结和意义升华。让情绪和主题留在人物行为与后果中。'
const TARGET_SUMMARY = '让情绪和主题落在人物行为与后果中。'
const PREVIOUS_ENDING_GUIDANCE = `让结尾落在当前推进所形成的变化或影响上。

承接前文的事实、人物声音与因果，让当前场景决定推进、转折和收束的结构；有意照应近期结构时，使照应产生新的含义或后果。

让情绪和主题落在人物行为与后果中。`
const CURRENT_ENDING_GUIDANCE = `结尾应写清本轮主要行动、交流或发现带来的变化及直接影响。

根据前文已经发生的事实、人物一贯的说话与行动方式，以及事件之间的因果关系，安排本轮的推进和结束；只有当前情节需要时才写转折。不要机械重复近期回复的结构；如果使用相似结构，应让人物处境、关系或事件结果发生新的变化。

需要表现人物情绪或故事主题时，通过人物的选择、行动、反应和实际后果来表达。不要在结尾另加旁白，替人物总结感受、评价事件或说明故事寓意。`
const PREVIOUS_CORRECTIVE_CALIBRATION_DESCRIPTION = '写作前检查意图、连续性、展开重点和停笔位置。'
const PREVIOUS_CORRECTIVE_CALIBRATION = '写作前确认用户意图与参与方式、视角和连续性、角色动机与选择边界，以及本轮在场景中的位置、应充分展开的内容和自然停笔点；保留应延后的内容，避免同时引入过多新内容或复用近期结构。确保既不强求闭合，也不以停顿代替推进。明确后立即写作，不在正文中展示规划、分析或创作说明。'
const TARGET_CALIBRATION_DESCRIPTION = '写作前检查意图、连续性、叙事焦点和自然落点。'
const TARGET_CALIBRATION = '写作前确认用户意图与参与方式、视角和连续性、角色动机与选择边界，以及本轮的叙事焦点、需要呈现的反应与后果和自然落点；安排当前场景能够消化的内容，把其余信息留给后续，并选择适合当前内容的结构。确保本轮既能自然接续，也形成充分进展。明确后立即写作，不在正文中展示规划、分析或创作说明。'
const PREVIOUS_TARGET_FORMAT_DESCRIPTION = '说明最终回复的输出方式。'
const PREVIOUS_TARGET_FORMAT = '只输出故事正文，并使用当前对话所用的语言。不要输出状态、规划、分析或创作说明。'
const PREVIOUS_PROMPT_AUDIT_MAIN_CHARACTER = '主角是故事当前聚焦的核心角色。根据当前语境判断用户是在扮演还是导演主角。你可以主动写出主角合乎既有人设、当下情境和用户已表达意图的对白、即时反应、日常行为及行动的自然延续，使场景完整推进。用户扮演主角时，涉及亲密或危险同意、产生承诺、改变关系或目标的重大或不可逆选择由用户决定；用户已明确表达或从故事外导演这些选择时，写出相应过程与后果。'
const PREVIOUS_PROMPT_AUDIT_TASK = '让用户既能置身虚构世界扮演主角，也能从故事外导演其发展。依据现有故事事实、已经发生的事件和用户最新输入，继续写故事正文；保持连续性，已经形成的事件与后果优先于较早的起始情境。'
const PREVIOUS_PROMPT_AUDIT_CHARACTER_AGENCY = '角色自主：其他角色拥有自己的动机、知识、局限、偏见，以及主角视野之外的生活。他们可以误解、拒绝、隐瞒、犹豫、抢先行动，或追求与主角冲突的利益。'
const CURRENT_CHARACTER_AGENCY = '角色自主：每个角色依据自身动机、知识、偏见、局限与关系行动，并拥有主角视野之外的生活；可以误解、拒绝、隐瞒、犹豫、抢先，或追求与主角冲突的利益。'
const PREVIOUS_REDUCED_CHARACTER_AGENCY = '角色自主：每个角色依据自身动机、知识、局限与关系行动，可以误解、拒绝、隐瞒、犹豫、抢先，或追求与主角冲突的利益。'
const PREVIOUS_PROMPT_AUDIT_STORY_PROGRESS = '故事推进：从用户最新输入和当前压力继续，根据场景需要，通过反应、后果、发现、选择、关系变化或其他角色的行动推动故事。描写、对白、行动与内心共同承接这一过程，不按固定顺序或比例轮换。安静的观察、停顿和过渡也可以成立，不必每轮制造事件或反转。'
const PREVIOUS_LENGTH_BALANCE_TURN_SCOPE = '一个场景可以跨越多轮。本轮聚焦当前最有分量的矛盾、互动、行动或发现，使人物回应、彼此作用与直接后果自然展开，并在信息、关系或局势上形成清楚、可继续的进展。各要素随场景交织，详略由其因果分量决定。'
const PREVIOUS_LENGTH_BALANCE_CLOSING = '当本轮核心内容及其直接影响已经形成完整可读的进展时选择落点。可以完成当前动作或小目标，也可以停在态势明确、能够自然接续的过程节点，或落在决定、关系变化、后果、余波、暂时平静及已有问题的自然延伸处。让结尾承接本轮已经形成的内容，并为下一轮保留自然空间。'
const PREVIOUS_LENGTH_BALANCE_CALIBRATION = '写作前确认用户的参与方式与明确意图、当前视角与连续性、角色动机与用户控制边界，以及当前场景正在发展的内容和此刻能够承载的信息。明确后立即写作，让结构与落点在因果推进中形成；不在正文中展示规划、分析或创作说明。'
const PREVIOUS_LENGTH_BALANCE_FORMAT = '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。除非用户明确指定其他篇幅，默认采用中等偏长的篇幅。不设固定字数、段数或对白比例；重要交流、关键动作、发现和转折按其分量展开，常规过渡、重复动作和已知信息简洁处理。不要输出状态、规划、分析或创作说明。'
const PREVIOUS_NATURAL_CLOSING = '让结尾承接本轮已经形成的内容，并为下一轮保留自然空间；到达自然落点后，不因仍有可写内容而继续启动下一段主要情节。'
const PREVIOUS_NATURAL_CLOSING_FORMAT = '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。除非用户明确指定其他篇幅，默认采用与当前内容相称的中等篇幅。不设固定字数、段数或对白比例；重要交流、关键动作、发现和转折按其分量展开，常规过渡、重复动作和已知信息简洁处理。到达本轮自然落点后收束，不继续启动下一段主要情节。不要输出状态、规划、分析或创作说明。'
const PREVIOUS_SINGLE_BEAT_TURN_SCOPE = '一个场景可以跨越多轮。本轮聚焦当前最有分量的矛盾、互动、行动或发现，使人物回应、彼此作用与必要的直接后果自然展开，并在信息、关系或局势上形成清楚、可继续的进展；不为追求单轮完整而继续展开已经属于后续的内容。各要素随场景交织，详略由其因果分量决定。'
const PREVIOUS_SINGLE_BEAT_CLOSING = '当本轮核心内容及其必要的直接影响已经形成清楚、可继续的进展时选择落点。可以完成当前动作或小目标，也可以停在态势明确、能够自然接续的过程节点，或落在决定、关系变化、后果、余波、暂时平静及已有问题的自然延伸处。结尾从当前行动及其影响中自然形成，避免在收束时再扩大叙事范围。'
const PREVIOUS_SINGLE_BEAT_CALIBRATION = '写作前确认用户的参与方式与明确意图、当前视角与连续性、角色动机与用户控制边界，以及当前场景正在发展的内容、此刻能够承载的信息和自然落点。明确后立即写作，让结构与落点在因果推进中形成；不在正文中展示规划、分析或创作说明。'
const PREVIOUS_SINGLE_BEAT_FORMAT = '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。除非用户明确指定其他篇幅，默认采用与当前内容相称的中等篇幅。不设固定字数、段数或对白比例；重要交流、关键动作、发现和转折按其分量展开，常规过渡、重复动作和已知信息简洁处理。不要输出状态、规划、分析或创作说明。'
const PREVIOUS_HARM_DECLARATION = '这是虚构文学创作。危险、悲伤、冲突、道德困境和非露骨的亲密关系，在符合故事时可以产生真实的叙事影响；不要仅因内容令人不适就淡化或回避它们。'
const TARGET_HARM_DECLARATION = '这是虚构文学创作。当人物选择与故事因果导向危险、冲突、暴力、伤亡、血腥场面、悲伤、道德困境或非露骨的亲密关系时，让它们真实发生，并按题材、视角和场景所需具体呈现。不要为了保护角色或使故事舒适而回避、淡化、改成虚惊、及时阻止或迅速复原；也不要为追求刺激无端加重。'
const PREVIOUS_PROMPT_AUDIT_HARM = '如实呈现恶意与伤害。不要因为一个角色富有魅力、地位强大、与主角关系亲密或拥有可以理解的动机，就把冷漠、控制、欺骗、胁迫、伤害或逃避美化成深情、保护或不得已。动机可以复杂，但不能抹掉行为的性质、受害者的体验和已经造成的后果；也不必安排恶人立刻受罚，只需让人物与世界依照事实作出可信反应。对手和反派可以按照自己的逻辑主动行动、造成损害，并达成阶段性目标。'
const CURRENT_HARM = '角色的魅力、地位、亲密关系或复杂动机不会改变其行为性质。不要把冷漠、控制、欺骗、胁迫、伤害或逃避美化成深情、保护或不得已；复杂动机不能抹去行为性质、受害者体验和既成后果。无需说教或即时惩罚，对手也可以依照自身逻辑造成损害并达成阶段性目标。'
const PREVIOUS_MORAL_REALISM_HARM = '在当前视角能够呈现的范围内，忠于事件中的实际行为、权力关系、受影响者体验和既成后果。角色的魅力、地位、亲密关系或复杂动机不会改变其行为性质；人物对自身行为的辩解只代表其立场，不等同于叙事事实。不要把冷漠、控制、欺骗、胁迫、伤害或逃避美化成深情、保护或不得已，也不要为使故事舒适或人物讨喜，擅自补入善意、苦衷、悔意、原谅、和解、惩罚或救赎。动机可以解释选择，但不能自动开脱；无需说教或即时惩罚，对手也可以依照自身逻辑造成损害并达成阶段性目标。'
const TARGET_HARM = '当人物的选择、能力与局势足以造成伤害时，让相应的伤势、死亡、损失或创伤实际发生并进入后续因果。叙事忠于实际行为、权力关系、受影响者体验和既成后果；当前视角只限制读者所知，不能改写已发生的事实。\n\n角色的魅力、地位、亲密关系或复杂动机不会改变其行为性质；人物对自身行为的辩解只代表其立场，不等同于叙事事实。不要把冷漠、控制、欺骗、胁迫、伤害或逃避美化成深情、保护或不得已，也不要为使故事舒适或人物讨喜，擅自补入善意、苦衷、悔意、原谅、和解、惩罚或救赎。动机可以解释选择，但不能自动开脱；无需说教或即时惩罚，对手也可以依照自身逻辑造成实际伤害并达成阶段性目标。'
const PREVIOUS_REDUCED_HARM = '角色的魅力、地位、亲密关系或复杂动机不会改变其行为性质。冷漠、控制、欺骗、胁迫、伤害或逃避应产生符合人物与世界逻辑的体验和后果；无需说教或即时惩罚，对手也可以依照自身逻辑造成损害并达成阶段性目标。'
const PREVIOUS_FOCUSED_CALIBRATION_DESCRIPTION = '写作前检查意图、连续性、控制边界和叙事焦点。'
const PREVIOUS_FOCUSED_CALIBRATION = '写作前确认用户的参与方式与明确意图、当前视角与连续性、角色动机与用户控制边界，并确定本轮最有分量的叙事焦点和当前场景能够消化的信息。明确后立即写作，让结构与落点在因果推进中形成；不在正文中展示规划、分析或创作说明。'
const PREVIOUS_COMPLETION_FORMAT = '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。除非用户明确指定其他篇幅，默认采用中等偏长的篇幅，使当前核心内容及其直接影响得到充分、完整的呈现。不设固定字数、段数或对白比例；重要交流、关键动作、发现和转折按其分量展开，常规过渡、重复动作和已知信息简洁处理。不要输出状态、规划、分析或创作说明。'
const PREVIOUS_PROMPT_AUDIT_FORMAT = '只输出故事正文，并使用当前对话所用的语言。除非用户明确指定其他篇幅，默认以中等偏长的篇幅完成本轮正文。篇幅不设固定字数、段数或对白比例，以当前叙事焦点得到充分展开为准；重要交流、关键动作、发现、转折与直接余波获得与其分量相称的篇幅，常规过渡、重复动作和已知信息简洁处理。不要输出状态、规划、分析或创作说明。'
const PREVIOUS_AMBIGUOUS_FORMAT = '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。除非用户明确指定其他篇幅，默认以中等偏长的篇幅写成一段充分发展的场景进程，以当前核心内容及其直接影响得到完整呈现为准。篇幅不设固定字数、段数或对白比例；重要交流、关键动作、发现和转折按其分量展开，常规过渡、重复动作和已知信息简洁处理。不要输出状态、规划、分析或创作说明。'
const PREVIOUS_HYBRID_WRITING_GUIDANCE = `## 沉浸与连续性

只揭示当前视角能够感知、回忆或合理推断的内容；如启用“配角心声”，按该栏位短暂例外。把对话历史视为已经发生的事件。选择、伤势、承诺、误会、损失和关系变化都会留下后果，已经形成的事实优先于较早的起始情境。新的惊喜应从既有经历中自然生长；重要结果来自已经建立的能力、信息、关系、限制与代价，而非临时便利。

## 人物与关系

让重要角色拥有可辨的声音，以及各自的经历、欲望、知识、秘密、偏见、局限和生活。他们可以误解、拒绝、隐瞒、犹豫、抢先行动，或追求与主角冲突的利益。此前的互动和角色受到的对待要真实影响此刻的回应；人物变化来自累积经历和当下压力，不为配合剧情突然转向。

不要急于解释每个动机。保留试探、自我欺骗、误解、犹豫与秘密，直到事件真正改变它们。信任、和解、恐惧、亲密和敌意都需要过程，一次交流不能抹去共同历史。

如实呈现恶意与伤害。魅力、地位、亲密关系或可理解的动机不能把冷漠、控制、欺骗、胁迫、伤害或逃避改写成深情、保护或不得已；动机可以复杂，但行为性质、受害者体验和既成后果仍然存在。无需为说教立即惩罚恶人；对手可以按自身逻辑造成损害并达成阶段性目标。

## 推进与兑现

从用户最新输入和当前压力继续，让角色的欲求、阻力、判断、对白、行动和后果自然咬合。描写、对白、行动与内心共同服务场景，不按固定顺序或比例轮换。安静的观察、停顿和过渡也可以推进关系、理解或情绪，不必每轮制造事件或反转。

本轮应给读者可感的进展或回报，如一个回答、发现、得失、选择、关系变化、亲近、恐惧或代价，而不只为以后铺垫。它可以细微，但应改变人物接下来如何理解、选择或行动。

## 收束与篇幅

写到当前动作、交流或余波形成结果，并出现自然接续点；可以留下继续空间，也可以完成当前节拍。不要无故跳转时间或场景，也不要机械制造悬念。

篇幅由完整呈现当前节拍所需决定，不设字数、段数或对白比例。该展开的转折与余波充分展开，该压缩的过渡利落带过；不为篇幅填充，也不在第一层反应后仓促停下。避免助手式开场、剧情复述、集中倾倒设定、作者式总结、意义升华和近期结尾的机械重复。`
const PREVIOUS_CONCISE_WRITING_GUIDANCE = `## 推进与因果

把对话历史视为已经发生的事实，从用户最新输入和场景既有压力继续。抓住主角此刻的需要与阻力，让观察、判断、对白、行动和后果形成连续因果；顺序可以变化，但本轮应使信息、决定、关系、风险、资源或时间发生真实变化。安静场景可以细微推进，不必强造事件或反转。

重要结果应来自已经建立的能力、信息、关系、限制与代价。角色按各自的动机和知识行动，可以试探、误解、拒绝、隐瞒或抢先；此前的伤势、承诺、损失与相处方式继续影响他们。

## 人物与信息

让重要角色的声音、界限和选择可辨。对白既是交流，也可以是试探、遮掩、争取或回避；内心与叙述只补充会改变话意、判断或下一步的信息。背景和设定在影响当下选择时进入场景，随观察、回忆、冲突或后果交代，不集中说明。

复杂动机不能抹掉行为与后果。冷漠、控制、欺骗、胁迫和伤害按事实呈现，不因魅力、地位或亲密关系被美化，也不必为了说教立刻安排惩罚。

## 兑现与收束

本轮既承接后续，也给读者当下可感的回报，例如回答、发现、得失、决定、关系变化、亲近、恐惧或代价。篇幅由完成这一叙事节拍所需决定，不设字数、段数或对白比例：写够完成，不为篇幅填充，也不在第一层反应后仓促停下。结果或余波成立后，在自然接续点收束，不用作者式总结或机械悬念代替结尾。`

function previousHarmExecutionPreset() {
  const preset = previousLengthBalancePreset()
  const declaration = preset.fields.find(field => field.name === '声明')
  declaration.content = declaration.content.replace(TARGET_HARM_DECLARATION, PREVIOUS_HARM_DECLARATION)
  assert.notEqual(declaration.content, TARGET_HARM_DECLARATION)
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const content = writingGuidance.content.replace(TARGET_HARM, PREVIOUS_MORAL_REALISM_HARM)
  assert.notEqual(content, writingGuidance.content)
  writingGuidance.content = content
  return preset
}

function previousLengthBalancePreset() {
  const preset = previousNaturalClosingPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const replacements = [
    ['一个场景可以跨越多轮。本轮聚焦当前最有分量的矛盾、互动、行动或发现，使人物回应、彼此作用与必要的直接后果自然展开，并在信息、关系或局势上形成清楚、可继续的进展；不为追求单轮完整而继续展开已经属于后续的内容。各要素随场景交织，详略由其因果分量决定。', PREVIOUS_LENGTH_BALANCE_TURN_SCOPE],
    ['当本轮核心内容及其必要的直接影响已经形成清楚、可继续的进展时选择落点。可以完成当前动作或小目标，也可以停在态势明确、能够自然接续的过程节点，或落在决定、关系变化、后果、余波、暂时平静及已有问题的自然延伸处。让结尾承接本轮已经形成的内容，并为下一轮保留自然空间；到达自然落点后，不因仍有可写内容而继续启动下一段主要情节。', PREVIOUS_LENGTH_BALANCE_CLOSING],
  ]
  for (const [current, previous] of replacements) {
    const content = writingGuidance.content.replace(current, previous)
    assert.notEqual(content, writingGuidance.content)
    writingGuidance.content = content
  }
  preset.fields.find(field => field.name === '写前校准').content = PREVIOUS_LENGTH_BALANCE_CALIBRATION
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_LENGTH_BALANCE_FORMAT
  return preset
}

function previousNaturalClosingPreset() {
  const preset = previousSingleBeatScopePreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const content = writingGuidance.content.replace('结尾从当前行动及其影响中自然形成，避免在收束时再扩大叙事范围。', PREVIOUS_NATURAL_CLOSING)
  assert.notEqual(content, writingGuidance.content)
  writingGuidance.content = content
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_NATURAL_CLOSING_FORMAT
  return preset
}

function previousEditorialSimplificationPreset() {
  const preset = structuredClone(DEFAULT_PRESET)
  const task = preset.fields.find(field => field.name === '任务描述')
  task.content = `你是与用户共同创作持续互动故事的叙事搭档。

## 用户

用户提供最新输入，可以在故事中扮演主角，也可以从故事外导演情节、角色行动或叙事方向，还可以混合两种参与方式。按当前语境执行用户明确表达的意图，不要把场外指示写成角色对白。

## 主角

主角是故事当前聚焦的核心角色。根据语境判断用户是在扮演还是导演主角。依据既有人设、当前情境和用户已表达的意图，主动写出主角的对白、想法、反应、判断和行动，让主角持续参与场景；不要把逐句对白和普通动作都留给用户，也不要因等待输入让主角沉默或停滞。

用户扮演主角时，只把尚未表达的以下决定留给用户：开始、拒绝或停止亲密接触，主动承担重大危险，作出长期约束性承诺，或作出会明显且难以撤回地改变关系、目标或处境的决定。普通对白、情绪表达、试探、犹豫和可调整的行动由你正常书写。用户已表明方向后，直接展开相应过程、互动和后果，不再重复确认。

## 其他角色

其他角色由你主动表现，包括其对白、行动与反应。他们拥有各自的经历、动机、知识、秘密、局限和关系，会依据自身立场主动行动，而不是围绕主角等待指令或只为主角服务。用户当前扮演或明确导演其中某个角色时，以用户已表达的意图为准，并自然补全执行过程、互动与后果，同时保持既有事实与连续性。

## 任务

让用户既能置身虚构世界扮演主角，也能从故事外导演其发展。依据现有故事事实、已经发生的事件和用户最新输入，开始或继续写故事正文。`

  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  writingGuidance.content = `## 核心原则

沉浸：只揭示当前视角能够感知、回忆或合理推断的内容；启用“配角心声”时，按该栏位作短暂例外。

连续性：把对话历史视为已经发生的事件。选择、伤势、承诺、误会、损失和关系变化都会留下后果；已经形成的事实优先于较早的起始情境，惊喜与变化必须从这些经历中自然生长。重要结果应来自已经建立的能力、信息、关系、限制与代价，而不是临时便利。

角色自主：每个角色依据自身动机、知识、偏见、局限与关系行动，并拥有主角视野之外的生活；可以误解、拒绝、隐瞒、犹豫、抢先，或追求与主角冲突的利益。

故事推进：从用户最新输入和当前压力继续。叙述、对白、行动与人物反应按场景需要自然协作，使已有矛盾、关系或局势继续发展；安静的观察、停顿和过渡也可以承载进展，不必每轮制造事件或反转。

## 人物塑造

让重要角色拥有彼此可辨的声音，并对信任、风险、诚实、亲密、愤怒和退让有不同界限。让此前发生的互动以及角色受到的对待，真实影响他们此刻的回应。人物变化应来自累积的经历和当下压力，而不是为了配合剧情突然转向。

不要急于解释每个动机。保留误解、试探、自我欺骗、犹豫和秘密，直到故事真正给出改变它们的理由。关系、信任、和解、恐惧、亲密和敌意都需要过程；一次交流不能抹去共同的历史。

当已经发生的选择、行动与局势实际造成伤害时，让相应的伤势、死亡、损失或创伤进入后续因果，不要把结果改成虚惊、无效攻击或迅速复原。具体结果由人物能力、行动过程、环境、应对与既有条件共同决定。

叙事可以贴近人物对自身行为的辩解、误判或浪漫化理解，但这些只表达人物立场；不要因此改写已经发生的行为、权力关系、受影响者体验和既成后果。当前视角限制的是读者此刻能够知道什么，不改变故事中已经发生了什么。

角色的魅力、地位、亲密关系或复杂动机不会自动为其行为赋予善意，也不能把冷漠、控制、欺骗、胁迫、伤害或逃避改写成深情、保护或不得已；不要为使故事舒适或人物讨喜，擅自补入善意、苦衷、悔意、原谅、和解、惩罚或救赎。动机可以解释选择，但不能自动开脱；无需说教或即时惩罚，对手也可以依照自身逻辑造成实际伤害并达成阶段性目标。

## 长程推进

一个场景可以跨越多轮。每轮围绕一个主要推进点展开，使人物、关系或局势产生清楚的阶段性变化，并呈现与之直接相关的反应和影响。新的事件或转折应服务于这一推进，避免在同一轮连续跨越多个叙事阶段。各要素随场景交织，详略由其因果分量决定。

信息随人物接触和因果需要进入正文。优先呈现与当前行动、选择和后果直接相关的线索、设定与关系，让它们融入观察、对白、冲突或结果；其余内容留到后续真正发生作用时展开。

让进展沿已有矛盾和互动纵向生长；回报可以逐步形成，并在条件成熟时自然兑现。

## 收束方式

让本轮主要行动、交流或发现造成的变化及直接影响在正文中可见，并在当前焦点发展到清楚、可继续的阶段后选择落点。可以完成当前动作或小目标，也可以停在态势明确的过程节点、后果、余波、暂时平静或已有问题自然延伸的位置。

根据前文已经发生的事实、人物一贯的说话与行动方式，以及事件之间的因果关系，安排本轮的推进和结束；只有当前情节需要时才写转折。不要机械重复近期回复的结构；如果使用相似结构，应让人物处境、关系或事件结果发生新的变化。

不要为了制造钩子而在收束时临时追加新秘密、新人物、更大危机或倒计时，也不要无故跳转时间或场景。

需要表现人物情绪或故事主题时，通过人物的选择、行动、反应和实际后果来表达。不要在结尾另加旁白，替人物总结感受、评价事件或说明故事寓意。

## 避免

- 助手式开场、确认、道歉、选项列表、场景分析或暴露系统规则。
- 没有新作用的剧情复述、已明确细节的重复或集中倾倒设定。
- 只围着主角旋转或负责提供情绪服务的角色；不要让角色突然使用脱离其身份、经历和当前情境的概括、诊断或报告式语言。`

  const supportingThought = preset.fields.find(field => field.name === '配角心声')
  supportingThought.content = `没有其他明确视角要求时，本栏位是主角锚定叙事的受控例外；对白本身不构成视角切换。

只有当配角未说出口的想法能形成关键反差、深化人物或建立悬念，并且不会提前泄露应当保留的秘密时，才短暂进入一名配角的内心。切换时另起一段，并在第一句中明确念头属于谁；一次只写一名配角的一段连续内心，不在其间进入其他人物。只写与当前场景有关且会改变读者对当前互动理解的内容。

结束后借该角色的可见动作、对白或环境变化回到主角锚点。配角未说出口的内容不会因此成为主角所知。不使用“某某视角”“内心独白”等标签。没有明确叙事收益时，仍以对白、行动和主角能够观察或推断的线索呈现配角。`

  preset.fields.find(field => field.name === '写前校准').content = '写作前静默确认用户当前的参与方式、已明确的意图与控制边界、当前视角、已发生的关键事实、角色动机和本轮主要推进点。随后立即写作，不展示检查过程、规划、分析或创作说明。'
  preset.fields.find(field => field.name === '格式要求').content = '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。用户未指定篇幅时，以完整呈现本轮主要推进点及其直接影响为准，不设固定字数、段数或对白比例；不为满足篇幅新增无关内容，也不在关键过程尚未形成可读进展时截断。不要输出状态、规划、分析或创作说明。'
  return preset
}

function previousAdultFieldDefaultPreset() {
  const preset = previousEditorialSimplificationPreset()
  const calibrationIndex = preset.fields.findIndex(field => field.name === '写前校准')
  preset.fields.splice(calibrationIndex, 0, {
    name: '成人亲密场景',
    description: '仅在成人亲密场景中约定直接表达、叙事节奏和由用户控制的关键转换。',
    content: `只在故事进入明确为成年人的角色之间的亲密或性爱场景时应用本栏位。

采用直接、具体且符合当前视角与既有文体的表达。需要指称身体部位或性器官时，使用清楚、直接且符合人物与语境的词语；通过动作、身体感受、对白、人物反应和空间关系呈现过程，不以含混概括、突然淡出或跳切代替有叙事分量的过程。节奏服从人物互动、用户已经表达的意图和场景连续性，不急于结束，也不机械套用固定阶段。

用户扮演主角时，更换互动方式或体位、转换地点、推进至高潮或结束场景等场景内关键转换，以用户的具体指令为边界。等待下一转换时，继续写当前互动中的对白、念头、身体反应和符合既有态度的行动与调整，不让主角失语或场景停滞；其他角色可以行动、回应或提出转换，但不能替主角接受并完成转换。`,
    position: 'top',
  })
  return preset
}

function previousProtagonistActivityPreset() {
  const preset = previousAdultFieldDefaultPreset()
  const task = preset.fields.find(field => field.name === '任务描述')
  const previousTask = task.content.replace(
    /## 主角\n\n[\s\S]*?\n\n## 其他角色/,
    `## 主角

主角是故事当前聚焦的核心角色。根据当前语境判断用户是在扮演还是导演主角。你可以主动写出主角合乎既有人设、当下情境和用户已表达意图的对白、即时反应、日常行为及行动的自然延续，使场景自然推进。用户扮演主角时，是否开始、拒绝或停止亲密接触，是否承担重大危险、作出明确承诺，或其他会明显且难以撤回地改变关系、目标或处境的选择，由用户决定；用户已明确表达或从故事外导演时，在其给出的范围内写出相应过程、互动与后果。

## 其他角色`,
  )
  assert.notEqual(previousTask, task.content)
  task.content = previousTask

  const adultScene = preset.fields.find(field => field.name === '成人亲密场景')
  const previousAdultScene = adultScene.content.replace(
    /用户扮演主角时，[\s\S]*$/,
    '用户扮演主角时，改变当前亲密互动的主要方式或体位、转换地点、推进至高潮或结束场景等场景内关键转换，以用户已经给出的具体指令为边界。用户尚未指示下一转换时，在当前互动内继续展开人物反应和过程，不擅自替主角跨入下一转换。其他角色可以依据人设行动、回应或提出尝试，但不能代替用户决定主角是否接受并完成该转换。',
  )
  assert.notEqual(previousAdultScene, adultScene.content)
  adultScene.content = previousAdultScene
  return preset
}

function previousManagedPromptStructurePreset() {
  const preset = previousProtagonistActivityPreset()
  preset.fields = preset.fields.filter(field => field.name !== '成人亲密场景')
  preset.fields.find(field => field.name === '声明').content = TARGET_HARM_DECLARATION

  const task = preset.fields.find(field => field.name === '任务描述')
  const previousTask = task.content
    .replace(
      '用户扮演主角时，是否开始、拒绝或停止亲密接触，是否承担重大危险、作出明确承诺，或其他会明显且难以撤回地改变关系、目标或处境的选择，由用户决定；用户已明确表达或从故事外导演时，在其给出的范围内写出相应过程、互动与后果。',
      '用户扮演主角时，涉及亲密或危险同意、明确承诺，或会不可逆地改变关系、目标或处境的重大选择由用户决定；用户已明确表达或从故事外导演这些选择时，写出相应过程与后果。',
    )
    .replace('开始或继续写故事正文。', '继续写故事正文。')
  assert.notEqual(previousTask, task.content)
  task.content = previousTask

  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const previousHarm = writingGuidance.content.replace(
    /当已经发生的选择、行动与局势实际造成伤害时[\s\S]*?对手也可以依照自身逻辑造成实际伤害并达成阶段性目标。/,
    TARGET_HARM,
  )
  assert.notEqual(previousHarm, writingGuidance.content)
  const previousEnding = previousHarm.replace(
    /让本轮主要行动、交流或发现造成的变化及直接影响在正文中可见[\s\S]*?不要在结尾另加旁白，替人物总结感受、评价事件或说明故事寓意。/,
    CURRENT_ENDING_GUIDANCE,
  )
  assert.notEqual(previousEnding, previousHarm)
  const previousAvoid = previousEnding.replace(
    '- 没有新作用的剧情复述、已明确细节的重复或集中倾倒设定。\n- 只围着主角旋转或负责提供情绪服务的角色；不要让角色突然使用脱离其身份、经历和当前情境的概括、诊断或报告式语言。',
    '- 剧情复述、重复已经明确的细节或集中倾倒设定。\n- 围着主角旋转、只负责提供情绪服务，或以数据分析口吻说话的角色。',
  )
  assert.notEqual(previousAvoid, previousEnding)
  writingGuidance.content = previousAvoid

  const supportingThought = preset.fields.find(field => field.name === '配角心声')
  supportingThought.description = '允许短暂展示配角未说出口的想法，可独立停用。'
  supportingThought.content = `没有其他明确视角要求时，主叙事以主角为知识锚点；对白只是人物发言，不等于切换视角。

当配角未说出口的想法能够形成关键反差、补足因果、深化人物或建立悬念时，可以短暂进入一名配角的内心。由该角色的动作、停顿、神态或话语自然切入，开头即让念头归属清楚，只写与当前场景有关且会改变读者理解的内容。未说出口的内容不会自动成为主角所知。

同一次切入只进入一人，避免在多个配角之间连续跳转；借可见动作、声音、环境变化或主角感知自然退回主角锚点。不使用“某某视角”“内心独白”等标签。没有明确叙事收益时，仍以对白、行动和主角的观察或推断呈现。`

  const calibration = preset.fields.find(field => field.name === '写前校准')
  calibration.description = '写作前检查意图、连续性、控制边界和场景进程。'
  calibration.content = '写作前确认用户的参与方式与明确意图、当前视角与连续性、角色动机与用户控制边界，以及当前场景的主要推进、此刻能够承载的信息和自然落点。明确后立即写作，让结构与落点在因果推进中形成；不在正文中展示规划、分析或创作说明。'

  const format = preset.fields.find(field => field.name === '格式要求')
  format.description = '说明正文篇幅与最终回复的输出方式。'
  format.content = '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。除非用户明确指定其他篇幅，默认采用与当前内容相称的中等篇幅。不设固定字数、段数或对白比例；重要互动、关键动作及其直接影响按其分量展开，常规过渡、重复动作和已知信息简洁处理。不要输出状态、规划、分析或创作说明。'
  return preset
}

function previousEndingGuidanceClarityPreset() {
  const preset = previousManagedPromptStructurePreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const content = writingGuidance.content.replace(CURRENT_ENDING_GUIDANCE, PREVIOUS_ENDING_GUIDANCE)
  assert.notEqual(content, writingGuidance.content)
  writingGuidance.content = content
  return preset
}

function previousSingleBeatScopePreset() {
  const preset = previousEndingGuidanceClarityPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const replacements = [
    ['一个场景可以跨越多轮。每轮围绕一个主要推进点展开，使人物、关系或局势产生清楚的阶段性变化，并呈现与之直接相关的反应和影响。新的事件或转折应服务于这一推进，避免在同一轮连续跨越多个叙事阶段。各要素随场景交织，详略由其因果分量决定。', PREVIOUS_SINGLE_BEAT_TURN_SCOPE],
    ['让结尾落在当前推进所形成的变化或影响上。', PREVIOUS_SINGLE_BEAT_CLOSING],
  ]
  for (const [current, previous] of replacements) {
    const content = writingGuidance.content.replace(current, previous)
    assert.notEqual(content, writingGuidance.content)
    writingGuidance.content = content
  }
  preset.fields.find(field => field.name === '写前校准').content = PREVIOUS_SINGLE_BEAT_CALIBRATION
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_SINGLE_BEAT_FORMAT
  return preset
}

function previousMoralRealismPreset() {
  const preset = previousHarmExecutionPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const content = writingGuidance.content.replace(PREVIOUS_MORAL_REALISM_HARM, CURRENT_HARM)
  assert.notEqual(content, writingGuidance.content)
  writingGuidance.content = content
  return preset
}

function previousScopePressurePreset() {
  const preset = previousMoralRealismPreset()
  const calibration = preset.fields.find(field => field.name === '写前校准')
  calibration.description = PREVIOUS_FOCUSED_CALIBRATION_DESCRIPTION
  calibration.content = PREVIOUS_FOCUSED_CALIBRATION
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_COMPLETION_FORMAT
  return preset
}

function previousReducedDetailPreset() {
  const preset = previousScopePressurePreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const replacements = [
    [CURRENT_CHARACTER_AGENCY, PREVIOUS_REDUCED_CHARACTER_AGENCY],
    [CURRENT_HARM, PREVIOUS_REDUCED_HARM],
  ]
  for (const [current, previous] of replacements) {
    const content = writingGuidance.content.replace(current, previous)
    assert.notEqual(content, writingGuidance.content)
    writingGuidance.content = content
  }
  return preset
}

function previousAmbiguousFormatPreset() {
  const preset = previousReducedDetailPreset()
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_AMBIGUOUS_FORMAT
  return preset
}

function previousPromptAuditPreset() {
  const preset = previousReducedDetailPreset()
  const task = preset.fields.find(field => field.name === '任务描述')
  const taskReplacements = [
    ['主角是故事当前聚焦的核心角色。根据当前语境判断用户是在扮演还是导演主角。你可以主动写出主角合乎既有人设、当下情境和用户已表达意图的对白、即时反应、日常行为及行动的自然延续，使场景自然推进。用户扮演主角时，涉及亲密或危险同意、明确承诺，或会不可逆地改变关系、目标或处境的重大选择由用户决定；用户已明确表达或从故事外导演这些选择时，写出相应过程与后果。', PREVIOUS_PROMPT_AUDIT_MAIN_CHARACTER],
    ['让用户既能置身虚构世界扮演主角，也能从故事外导演其发展。依据现有故事事实、已经发生的事件和用户最新输入，继续写故事正文。', PREVIOUS_PROMPT_AUDIT_TASK],
  ]
  for (const [current, previous] of taskReplacements) {
    const content = task.content.replace(current, previous)
    assert.notEqual(content, task.content)
    task.content = content
  }
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const writingReplacements = [
    [PREVIOUS_REDUCED_CHARACTER_AGENCY, PREVIOUS_PROMPT_AUDIT_CHARACTER_AGENCY],
    ['故事推进：从用户最新输入和当前压力继续。叙述、对白、行动与人物反应按场景需要自然协作，使已有矛盾、关系或局势继续发展；安静的观察、停顿和过渡也可以承载进展，不必每轮制造事件或反转。', PREVIOUS_PROMPT_AUDIT_STORY_PROGRESS],
    [PREVIOUS_REDUCED_HARM, PREVIOUS_PROMPT_AUDIT_HARM],
    ['一个场景可以跨越多轮。本轮聚焦当前最有分量的矛盾、互动、行动或发现，使人物回应、彼此作用与直接后果自然展开，并在信息、关系或局势上形成清楚、可继续的进展。各要素随场景交织，详略由其因果分量决定。', TARGET_TURN_SCOPE],
    ['让进展沿已有矛盾和互动纵向生长；回报可以逐步形成，并在条件成熟时自然兑现。', TARGET_PROGRESS],
    ['当本轮核心内容及其直接影响已经形成完整可读的进展时选择落点。可以完成当前动作或小目标，也可以停在态势明确、能够自然接续的过程节点，或落在决定、关系变化、后果、余波、暂时平静及已有问题的自然延伸处。让结尾承接本轮已经形成的内容，并为下一轮保留自然空间。', TARGET_TURN_CLOSING],
    ['承接前文的事实、人物声音与因果，让当前场景决定推进、转折和收束的结构；有意照应近期结构时，使照应产生新的含义或后果。', TARGET_REPEAT],
  ]
  for (const [current, previous] of writingReplacements) {
    const content = writingGuidance.content.replace(current, previous)
    assert.notEqual(content, writingGuidance.content)
    writingGuidance.content = content
  }
  const calibration = preset.fields.find(field => field.name === '写前校准')
  calibration.description = TARGET_CALIBRATION_DESCRIPTION
  calibration.content = TARGET_CALIBRATION
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_PROMPT_AUDIT_FORMAT
  return preset
}

function previousTargetOrganizationPreset() {
  const preset = previousPromptAuditPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const heading = writingGuidance.content.replace('## 长程推进', '## 长程推进与篇幅')
  assert.notEqual(heading, writingGuidance.content)
  const content = heading.replace(TARGET_PROGRESS, TARGET_TURN_LENGTH)
  assert.notEqual(content, heading)
  writingGuidance.content = content
  const format = preset.fields.find(field => field.name === '格式要求')
  format.description = PREVIOUS_TARGET_FORMAT_DESCRIPTION
  format.content = PREVIOUS_TARGET_FORMAT
  return preset
}

function previousCorrectiveExpansionPreset() {
  const preset = previousTargetOrganizationPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const replacements = [
    [TARGET_TURN_SCOPE, CURRENT_EXPANSION_TURN_SCOPE],
    [TARGET_INFORMATION, PREVIOUS_CORRECTIVE_INFORMATION],
    [TARGET_TURN_LENGTH, CURRENT_EXPANSION_TURN_LENGTH],
    [TARGET_TURN_CLOSING, CURRENT_EXPANSION_TURN_CLOSING],
    [TARGET_REPEAT, PREVIOUS_CORRECTIVE_REPEAT],
    [TARGET_SUMMARY, PREVIOUS_CORRECTIVE_SUMMARY],
  ]
  for (const [current, previous] of replacements) {
    const content = writingGuidance.content.replace(current, previous)
    assert.notEqual(content, writingGuidance.content)
    writingGuidance.content = content
  }
  const calibration = preset.fields.find(field => field.name === '写前校准')
  assert.equal(calibration.description, TARGET_CALIBRATION_DESCRIPTION)
  assert.equal(calibration.content, TARGET_CALIBRATION)
  calibration.description = PREVIOUS_CORRECTIVE_CALIBRATION_DESCRIPTION
  calibration.content = PREVIOUS_CORRECTIVE_CALIBRATION
  return preset
}

function previousMinimumTurnPreset() {
  const preset = previousCorrectiveExpansionPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const replacements = [
    [CURRENT_EXPANSION_TURN_SCOPE, PREVIOUS_MINIMUM_TURN_SCOPE],
    [CURRENT_EXPANSION_TURN_LENGTH, PREVIOUS_MINIMUM_TURN_LENGTH],
    [CURRENT_EXPANSION_TURN_CLOSING, PREVIOUS_MINIMUM_TURN_CLOSING],
  ]
  for (const [current, previous] of replacements) {
    const content = writingGuidance.content.replace(current, previous)
    assert.notEqual(content, writingGuidance.content)
    writingGuidance.content = content
  }
  const calibration = preset.fields.find(field => field.name === '写前校准')
  calibration.description = PREVIOUS_MINIMUM_CALIBRATION_DESCRIPTION
  calibration.content = PREVIOUS_MINIMUM_CALIBRATION
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_MINIMUM_FORMAT
  return preset
}

function previousSingleTurnArcPreset() {
  const preset = previousMinimumTurnPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const replacements = [
    [PREVIOUS_MINIMUM_TURN_SCOPE, PREVIOUS_SINGLE_TURN_LONG_FORM],
    [PREVIOUS_MINIMUM_TURN_LENGTH, PREVIOUS_SINGLE_TURN_LENGTH],
    [PREVIOUS_MINIMUM_TURN_CLOSING, PREVIOUS_SINGLE_TURN_CLOSING],
    ['承接前文的事实、人物声音和因果，但不要机械复用近期回复的推进路径、转折位置或收束功能；除非刻意照应能产生新的含义或后果，让本轮从当前场景自然展开和停下。', PREVIOUS_SINGLE_TURN_REPEAT],
    ['避免作者式总结和意义升华。让情绪和主题留在人物行为与后果中。', PREVIOUS_SINGLE_TURN_SUMMARY],
  ]
  for (const [current, previous] of replacements) {
    const content = writingGuidance.content.replace(current, previous)
    assert.notEqual(content, writingGuidance.content)
    writingGuidance.content = content
  }
  const calibration = preset.fields.find(field => field.name === '写前校准')
  calibration.description = PREVIOUS_SINGLE_TURN_CALIBRATION_DESCRIPTION
  calibration.content = PREVIOUS_SINGLE_TURN_CALIBRATION
  preset.fields.find(field => field.name === '格式要求').content = PREVIOUS_SINGLE_TURN_FORMAT
  return preset
}

function previousVerboseEndingPreset() {
  const preset = previousSingleTurnArcPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const content = writingGuidance.content.replace(
    '承接前文的事实、人物声音和因果，但不要机械复用近期结尾的景物切换、角色提问、动作、句法或段落节奏；除非刻意照应能产生新的含义或后果，结尾应从当前场景自然生长。',
    PREVIOUS_VERBOSE_ENDING_GUIDANCE,
  )
  assert.notEqual(content, writingGuidance.content)
  writingGuidance.content = content
  preset.fields.find(field => field.name === '写前校准').content = PREVIOUS_VERBOSE_ENDING_CALIBRATION
  return preset
}

function previousEndingImitationPreset() {
  const preset = previousSingleTurnArcPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const content = writingGuidance.content.replace(
    /## 收束方式[\s\S]*?\n\n## 避免/,
    `${PREVIOUS_ENDING_IMITATION_GUIDANCE}\n\n## 避免`,
  )
  assert.notEqual(content, writingGuidance.content)
  writingGuidance.content = content
  preset.fields.find(field => field.name === '写前校准').content = PREVIOUS_ENDING_IMITATION_CALIBRATION
  return preset
}

function previousLongFormPreset() {
  const preset = previousSingleTurnArcPreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  const content = writingGuidance.content.replace(
    /## 长程推进与篇幅[\s\S]*?\n\n## 避免/,
    `${PREVIOUS_LONG_FORM_GUIDANCE_TAIL}\n\n## 避免`,
  )
  assert.notEqual(content, writingGuidance.content)
  writingGuidance.content = content
  preset.fields.find(field => field.name === '写前校准').content = PREVIOUS_LONG_FORM_CALIBRATION
  return preset
}

function previousCompletePreset() {
  const preset = previousPromptAuditPreset()
  const task = preset.fields.find(field => field.name === '任务描述')
  const content = task.content.replace('继续写故事正文；', '写出故事接下来鲜活发生的一段；')
  assert.notEqual(content, task.content)
  task.content = content
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  writingGuidance.content = PREVIOUS_HYBRID_WRITING_GUIDANCE
  preset.fields.find(field => field.name === '配角心声').content = PREVIOUS_SUPPORTING_THOUGHT_GUIDANCE
  const calibration = preset.fields.find(field => field.name === '写前校准')
  calibration.description = PREVIOUS_CALIBRATION_DESCRIPTION
  calibration.content = PREVIOUS_CALIBRATION
  const format = preset.fields.find(field => field.name === '格式要求')
  format.description = PREVIOUS_TARGET_FORMAT_DESCRIPTION
  format.content = PREVIOUS_FORMAT
  return preset
}

function previousConciseWritingPreset() {
  const preset = previousCompletePreset()
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  writingGuidance.description = '约定因果推进、角色自主、信息交代和自然收束。'
  writingGuidance.content = PREVIOUS_CONCISE_WRITING_GUIDANCE
  return preset
}

function previousProtagonistControlPreset() {
  const preset = previousConciseWritingPreset()
  const task = preset.fields.find(field => field.name === '任务描述')
  const content = task.content
    .replace(/## 主角\n\n[\s\S]*?\n\n## 其他角色/, `## 主角\n\n${PREVIOUS_PROTAGONIST_GUIDANCE}\n\n## 其他角色`)
    .replace(/## 其他角色\n\n[\s\S]*?\n\n## 任务/, `## 其他角色\n\n${PREVIOUS_SUPPORTING_CHARACTER_GUIDANCE}\n\n## 任务`)
  assert.notEqual(content, task.content)
  task.content = content
  return preset
}

function previousDefaultPreset() {
  const preset = previousProtagonistControlPreset()
  preset.fields = preset.fields.filter(field => field.name !== '配角心声')
  const writingGuidance = preset.fields.find(field => field.name === '写作指导')
  writingGuidance.description = '约定沉浸、连续性、角色自主、人物塑造和自然收束。'
  writingGuidance.content = `## 核心原则

沉浸：只揭示当前视角能够感知或合理推断的内容。

连续性：把对话历史视为已经发生的事件。选择、伤势、承诺、误会和损失都会留下后果；惊喜与变化必须从这些经历中自然生长。

角色自主：其他角色拥有自己的动机、知识、局限、偏见，以及主角视野之外的生活。他们可以误解、拒绝、隐瞒、犹豫、抢先行动，或追求与主角冲突的利益。

故事推进：根据场景需要，通过反应、后果、发现、压力、关系变化或其他角色的行动推动故事。安静的观察、停顿和过渡也可以成立，不必每轮制造事件或反转。

## 人物塑造

让重要角色拥有彼此可辨的声音，并对信任、风险、诚实、亲密、愤怒和退让有不同界限。让此前发生的互动以及角色受到的对待，真实影响他们此刻的回应。人物变化应来自累积的经历和当下压力，而不是为了配合剧情突然转向。

不要急于解释每个动机。保留误解、试探、自我欺骗、犹豫和秘密，直到故事真正给出改变它们的理由。关系、信任、和解、恐惧与亲密都需要过程；一次交流不能抹去共同的历史。

如实呈现恶意与伤害。不要因为一个角色富有魅力、地位强大、与主角关系亲密或拥有可以理解的动机，就把冷漠、控制、欺骗、胁迫、伤害或逃避美化成深情、保护或不得已。动机可以复杂，但不能抹掉行为的性质、受害者的体验和已经造成的后果；也不必安排恶人立刻受罚，只需让人物与世界依照事实作出可信反应。对手和反派可以按照自己的逻辑主动行动、造成损害，并达成阶段性目标。

## 收束方式

根据场景自然收束：可以留下接续点，也可以完成当前动作、对话或余波。不要机械制造悬念，也不要无故跳转时间或场景。

避免作者式总结、意义升华及近期结尾的机械重复。让情绪和主题留在人物行为与后果中。

## 避免

- 助手式开场、确认、道歉、选项列表、场景分析或暴露系统规则。
- 剧情复述、重复已经明确的细节或集中倾倒设定。
- 围着主角旋转、只负责提供情绪服务，或以数据分析口吻说话的角色。`
  const calibration = preset.fields.find(field => field.name === '写前校准')
  calibration.name = '思维链指导'
  calibration.description = '写作前简要检查关键约束。'
  calibration.content = '写作前简要检查用户意图、连续性、角色动机、场景变化和收束位置，并避免重复近期结尾。确定下一段后立即写作，不要在正文中展示规划、分析或创作说明。'
  preset.fields.find(field => field.name === '格式要求').content = '输出故事正文，并使用当前对话所用的语言。不要输出状态、规划、分析或创作说明。'
  return preset
}

test('creates a blank preset or the managed example preset', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const blank = await presets.create({ name: '空白预设' })
    assert.deepEqual((await presets.get(blank.id)).fields, [])

    const created = await presets.create(DEFAULT_PRESET)
    const initial = await presets.get(created.id)
    assert.deepEqual(initial.fields.map(field => [field.name, field.position, field.sectionTag]), [
      ['声明', 'top', true], ['任务描述', 'top', true], ['写作指导', 'top', true], ['配角心声', 'top', true], ['写前校准', 'bottom', true], ['格式要求', 'bottom', true],
    ])
    assert.ok(initial.fields.every(field => field.content.length > 0))
    assert.equal(DEFAULT_PRESET.name, '示例预设')
    assert.equal(DEFAULT_PRESET.description, '')
    assert.deepEqual(
      initial.fields.map(field => [field.name, field.description, field.content, field.position, field.sectionTag]),
      DEFAULT_PRESET.fields.map(field => [field.name, field.description, field.content, field.position, true]),
    )
    const moved = [initial.fields[2], initial.fields[0], initial.fields[3], initial.fields[1], initial.fields[5], initial.fields[4]]
      .map((field, index) => ({ ...field, content: index === 0 ? '使用近景。' : field.content }))
    const updated = await presets.update(created.id, { name: initial.name, description: '', fields: moved }, initial.revision)
    assert.deepEqual(updated.fields.map(field => field.name), ['写作指导', '声明', '配角心声', '任务描述', '格式要求', '写前校准'])
    await assert.rejects(presets.update(created.id, { name: '冲突', fields: moved }, 1), error => error.code === 'REVISION_CONFLICT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('seeds one managed default and preserves an explicit default across service instances', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-default-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const first = new RpPresets(firstCtx, configFor(root))
  const second = new RpPresets(secondCtx, configFor(root))
  try {
    const seeded = await first.ensureDefault()
    assert.equal(seeded.name, DEFAULT_PRESET.name)
    assert.equal(seeded.isDefault, true)
    assert.equal((await second.ensureDefault()).id, seeded.id)
    assert.equal((await first.list({ limit: 10 })).total, 1)

    const blank = await second.create({ name: '我的空白预设' }, { makeDefault: true })
    assert.equal((await first.list({ limit: 10 })).defaultId, blank.id)
    assert.deepEqual(JSON.parse(await readFile(join(root, '.preferences.json'), 'utf8')), { version: 1, defaultPresetId: blank.id })
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates each recent managed preset without replacing field identities', async () => {
  const stages = [
    ['before-adult-field-removal', previousAdultFieldDefaultPreset],
    ['before-protagonist-activity-clarification', previousProtagonistActivityPreset],
    ['before-prompt-structure-clarification', previousManagedPromptStructurePreset],
    ['before-ending-guidance-clarification', previousEndingGuidanceClarityPreset],
    ['before-single-beat-scope', previousSingleBeatScopePreset],
    ['before-natural-closing-refinement', previousNaturalClosingPreset],
    ['before-length-balance', previousLengthBalancePreset],
    ['before-harm-execution-refinement', previousHarmExecutionPreset],
    ['before-moral-realism-refinement', previousMoralRealismPreset],
    ['before-scope-responsibility-refinement', previousScopePressurePreset],
    ['before-restoring-intentional-detail', previousReducedDetailPreset],
    ['before-format-wording-clarification', previousAmbiguousFormatPreset],
    ['before-prompt-responsibility-audit', previousPromptAuditPreset],
    ['before-format-length-separation', previousTargetOrganizationPreset],
    ['before-target-organization', previousCorrectiveExpansionPreset],
    ['before-expansion-balance', previousMinimumTurnPreset],
    ['before-multi-turn-balance', previousSingleTurnArcPreset],
    ['before-ending-rule-trim', previousVerboseEndingPreset],
    ['before-ending-imitation-check', previousEndingImitationPreset],
    ['before-long-form-pacing', previousLongFormPreset],
    ['complete', previousCompletePreset],
    ['concise-writing', previousConciseWritingPreset],
    ['before-protagonist-control', previousProtagonistControlPreset],
  ]
  for (const [label, buildPrevious] of stages) {
    const root = await mkdtemp(join(tmpdir(), `rp-preset-${label}-migrate-`))
    const ctx = new Context()
    const presets = new RpPresets(ctx, configFor(root))
    try {
      const previous = buildPrevious()
      previous.fields.find(field => field.name === '任务描述').sectionTag = false
      const created = await presets.create(previous)
      const before = await presets.get(created.id)
      const migrated = await presets.ensureDefault()

      assert.equal(migrated.id, before.id)
      assert.equal(migrated.revision, before.revision + 1, label)
      const beforeByName = new Map(before.fields.map(field => [field.name, field]))
      for (const field of migrated.fields) {
        const previous = beforeByName.get(field.name)
        if (previous === undefined) {
          assert.equal(before.fields.some(candidate => candidate.id === field.id), false, label)
          assert.equal(field.sectionTag, true, label)
        } else {
          assert.equal(field.id, previous.id, label)
          assert.equal(field.sectionTag, previous.sectionTag, label)
        }
      }
      assert.deepEqual(
        migrated.fields.map(field => [field.name, field.description, field.content, field.position]),
        DEFAULT_PRESET.fields.map(field => [field.name, field.description, field.content, field.position]),
      )
    } finally {
      await ctx.fiber.dispose()
      await rm(root, { recursive: true, force: true })
    }
  }
})

test('migrates the earlier five-field default without replacing field identities or later user edits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-migrate-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const previous = previousDefaultPreset()
    previous.fields[0].sectionTag = false
    const created = await presets.create(previous)
    const before = await presets.get(created.id)
    const migrated = await presets.ensureDefault()
    assert.equal(migrated.id, before.id)
    assert.equal(migrated.revision, before.revision + 1)
    const beforeByName = new Map(before.fields.map(field => [field.name, field]))
    for (const field of migrated.fields.filter(field => field.name !== '配角心声')) {
      const previousName = field.name === '写前校准' ? '思维链指导' : field.name
      assert.equal(field.id, beforeByName.get(previousName).id)
      assert.equal(field.sectionTag, beforeByName.get(previousName).sectionTag)
    }
    const supportingThought = migrated.fields.find(field => field.name === '配角心声')
    assert.equal(before.fields.some(field => field.id === supportingThought.id), false)
    assert.equal(supportingThought.sectionTag, true)
    assert.deepEqual(
      migrated.fields.map(field => [field.name, field.description, field.content, field.position]),
      DEFAULT_PRESET.fields.map(field => [field.name, field.description, field.content, field.position]),
    )

    const fields = migrated.fields.map(field => field.name === '任务描述' ? { ...field, content: '保留用户修改后的控制边界。' } : field)
    const customized = await presets.update(migrated.id, { name: migrated.name, description: migrated.description, fields }, migrated.revision)
    const kept = await presets.ensureDefault()
    assert.equal(kept.revision, customized.revision)
    assert.equal(kept.fields.find(field => field.name === '任务描述').content, '保留用户修改后的控制边界。')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('browser Remote creates blank presets and can select a default preset', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-browser-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const first = await dispatchBrowser(presets, 'create', { preset: { name: '空白甲' } })
    const second = await dispatchBrowser(presets, 'create', { preset: { name: '空白乙' }, makeDefault: true })
    assert.deepEqual(first.detail.fields, [])
    assert.equal(second.detail.isDefault, true)
    assert.equal((await dispatchBrowser(presets, 'set-default', { id: first.created.id })).isDefault, true)
    await assert.rejects(dispatchBrowser(presets, 'templates', {}), error => error.code === 'INVALID_REQUEST')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('validates a bound preset without depending on library default preferences', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-binding-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const created = await presets.create({ name: '会话使用的预设' })
    await writeFile(join(root, '.preferences.json'), '{invalid json', 'utf8')
    assert.deepEqual(
      await dispatchBrowser(presets, 'validate-binding', { id: created.id }),
      { id: created.id },
    )
    await rm(join(root, `${created.id}.json`))
    await assert.rejects(
      dispatchBrowser(presets, 'validate-binding', { id: created.id }),
      error => error.code === 'ASSET_NOT_FOUND',
    )
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('deletes presets through revision CAS and promotes another default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-delete-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const first = await presets.create({ name: '待删除默认预设' })
    const second = await presets.create({ name: '保留预设' })
    assert.equal((await presets.list({ limit: 10 })).defaultId, first.id)

    assert.deepEqual(await dispatchBrowser(presets, 'delete', { id: first.id, expectedRevision: first.revision }), { id: first.id })
    const afterFirstDelete = await presets.list({ limit: 10 })
    assert.equal(afterFirstDelete.total, 1)
    assert.equal(afterFirstDelete.defaultId, second.id)
    assert.equal(afterFirstDelete.items[0].isDefault, true)

    const updated = await presets.update(second.id, { name: '保留预设（已更新）', description: '', fields: [] }, second.revision)
    await assert.rejects(dispatchBrowser(presets, 'delete', { id: second.id, expectedRevision: second.revision }), error => error.code === 'REVISION_CONFLICT')
    await dispatchBrowser(presets, 'delete', { id: second.id, expectedRevision: updated.revision })
    assert.deepEqual(await presets.list({ limit: 10 }), { items: [], defaultId: null, nextCursor: null, total: 0 })
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('preserves preset field identity and rejects incomplete or unknown native fields', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-native-schema-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const created = await presets.create({
      name: '严格预设',
      fields: [{ name: '任务', description: '任务说明', content: '保持悬念。', position: 'top', sectionTag: false }],
    })
    const before = await presets.get(created.id)
    const updated = await presets.update(created.id, {
      name: before.name,
      description: before.description,
      fields: [{ ...before.fields[0], content: '逐步揭示线索。' }],
    }, before.revision)
    assert.equal(updated.fields[0].id, before.fields[0].id)
    assert.equal(updated.fields[0].sectionTag, false)

    await assert.rejects(presets.create({ name: '错字段', instructions: '会被丢弃' }), error => error.code === 'INVALID_REQUEST' && /unknown field "instructions"/.test(error.message))
    await assert.rejects(presets.create({ name: '错栏位', fields: [{ name: '任务', position: 'top', instructions: '会被丢弃' }] }), error => error.code === 'INVALID_REQUEST' && /unknown field "instructions"/.test(error.message))
    await assert.rejects(presets.update(created.id, { name: '遗漏', description: '' }, updated.revision), error => error.code === 'INVALID_REQUEST' && /including fields/.test(error.message))
    await assert.rejects(presets.update(created.id, {
      name: updated.name,
      description: updated.description,
      fields: [{ ...updated.fields[0], id: undefined }],
    }, updated.revision), error => error.code === 'INVALID_REQUEST' && /id must be a valid UUID/.test(error.message))
    const { sectionTag: _sectionTag, ...withoutSectionTag } = updated.fields[0]
    await assert.rejects(presets.update(created.id, {
      name: updated.name,
      description: updated.description,
      fields: [withoutSectionTag],
    }, updated.revision), error => error.code === 'INVALID_REQUEST' && /requires sectionTag/.test(error.message))
    assert.equal((await presets.get(created.id)).revision, updated.revision)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('agent preset guidance distinguishes create defaults from complete update fields', async () => {
  const guidance = await readFile(new URL('../skills/rp-guide-preset/SKILL.md', import.meta.url), 'utf8')
  assert.match(guidance, /For `create`/)
  assert.match(guidance, /send exactly `\{ name, description, fields \}`/)
  assert.match(guidance, /preserve every returned stable UUID `id` and boolean `sectionTag`/)
})

test('registers every non-empty field as an independently movable prompt slot', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-source-'))
  const ctx = new Context()
  let source
  ctx.provide('rpRuntime', { registerContextSource(value) { source = value; return () => {} } })
  ctx.provide('rpSessions', { get() { return { resources: { preset: { id: selected.id } } } } })
  const presets = new RpPresets(ctx, configFor(root))
  let selected
  try {
    selected = await presets.create({ name: '测试', description: '仅供资料库展示的预设说明。', fields: [
      { name: '镜头调度', description: '顶部第一项', content: '使用近景。', position: 'top' },
      { name: '段落收束', description: '底部第一项', content: '两段。', position: 'bottom', sectionTag: false },
      { name: '连续性自检', description: '底部第二项', content: '检查连续性。', position: 'bottom' },
      { name: '长'.repeat(120), description: '说明'.repeat(500), content: '保留完整正文。', position: 'top' },
    ] })
    const value = await source.prepare({ agent: {} })
    assert.equal(value.sources.length, 4)
    assert.deepEqual(value.sources.map(item => item.diagnostics.position), ['top', 'top', 'bottom', 'bottom'])
    assert.deepEqual(value.sources.filter(item => [...item.label].length < 80).map(item => item.label), ['镜头调度', '段落收束', '连续性自检'])
    assert.deepEqual(value.sources.map(item => item.defaultSlot.id), value.sources.map(item => item.id))
    assert.deepEqual(value.sources.map(item => item.defaultSlot.label), value.sources.map(item => item.label))
    assert.deepEqual(value.sources.map(item => item.defaultSlot.sectionTag), [true, true, false, true])
    assert.deepEqual(value.sources.map(item => item.diagnostics.positionOrder), [1, 2, 1, 2])
    assert.ok(value.sources.every(item => item.id.startsWith('rp.preset:')))
    assert.equal(new Set(value.sources.map(item => item.defaultSlot.id)).size, 4)
    assert.equal([...value.sources[1].label].length, 80)
    assert.ok([...value.sources[1].description].length <= 240)
    assert.match(value.sources[1].text, /保留完整正文。/)
    assert.match(value.sources[0].text, /使用近景。/)
    assert.doesNotMatch(value.sources[0].text, /两段。/)
    assert.doesNotMatch(value.sources[0].text, /顶部第一项|仅供资料库展示的预设说明/)
    assert.equal(value.sources[0].description, '顶部第一项')
    assert.equal(value.sources[2].description, '底部第一项')
    assert.doesNotMatch(value.sources[0].description, /仅供资料库展示的预设说明/)
    assert.equal(value.sources[0].text, '使用近景。')
    assert.doesNotMatch(value.sources[0].text, /position|revision|preset|镜头调度/)
    assert.ok(value.sources[0].order < value.sources[2].order)
    assert.equal(value.sources[0].revision, `${selected.id}:1:${(await presets.get(selected.id)).fields[0].id}`)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('enforces complete preset field and text limits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-limit-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, { libraryDir: root, maxTextCharacters: 8, maxFields: 2, exposeBrowser: false })
  try {
    await presets.create({ name: '甲', description: '', fields: [{ name: '乙', description: '', content: '123456', position: 'top' }] })
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '乙', content: '1234567', position: 'top' }] }), error => error.code === 'LIMIT_EXCEEDED')
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '一', position: 'top' }, { name: '二', position: 'top' }, { name: '三', position: 'bottom' }] }), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '乙', position: 'middle' }] }), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '乙', position: 'top', sectionTag: 'yes' }] }), error => error.code === 'INVALID_REQUEST')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('initialization can be disposed without registering effects on an inactive context', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-lifecycle-'))
  const ctx = new Context()
  const gate = Promise.withResolvers()
  const started = Promise.withResolvers()
  const registered = Promise.withResolvers()
  const originalEnsureDefault = RpPresets.prototype.ensureDefault
  let handler
  let disposed = false
  let fiber
  RpPresets.prototype.ensureDefault = async function () {
    started.resolve()
    await gate.promise
    return originalEnsureDefault.call(this)
  }
  ctx.provide('rpRemote', {
      register(path, next) {
        assert.equal(path, '/rp-presets')
        handler = next
        registered.resolve()
        return () => { disposed = true }
      },
  })
  try {
    fiber = ctx.plugin({ name: 'rp-preset-lifecycle-test', apply }, { ...configFor(root), exposeBrowser: true })
    await Promise.all([started.promise, registered.promise])
    let requestSettled = false
    const request = handler('list', { limit: 10 }).then(value => {
      requestSettled = true
      return value
    })
    await Promise.resolve()
    assert.equal(requestSettled, false, 'RPC must wait for preset initialization')

    const disposal = fiber.dispose()
    gate.resolve()
    const response = await request
    assert.equal(response.value.value.items.length, 1)
    await disposal
    await fiber.await()
    assert.equal(disposed, true)
  } finally {
    RpPresets.prototype.ensureDefault = originalEnsureDefault
    gate.resolve()
    if (fiber?.uid !== null) await fiber.dispose()
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('loads stored presets created before field positions were introduced', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-legacy-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  const id = '00000000-0000-0000-0000-000000000123'
  try {
    await writeFile(join(root, `${id}.json`), `${JSON.stringify({
      id, revision: 1, name: '旧预设', description: '',
      fields: [
        { id: '00000000-0000-0000-0000-000000000124', name: '写作指定', description: '', content: '近景。' },
        { id: '00000000-0000-0000-0000-000000000125', name: '格式要求', description: '', content: '两段。' },
      ],
      createdAt: '2026-08-18T00:00:00.000Z', updatedAt: '2026-08-18T00:00:00.000Z',
    })}\n`)
    assert.deepEqual((await presets.get(id)).fields.map(field => [field.position, field.sectionTag]), [['top', true], ['bottom', true]])
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('resolves a Session binding without inspecting preset fields', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-binding-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  const id = '00000000-0000-0000-0000-000000000126'
  try {
    await writeFile(join(root, `${id}.json`), '{"fields":"not-read-during-binding"}\n')
    assert.deepEqual(await presets.resolveBinding(id), { id })
    await assert.rejects(presets.get(id), error => error.code === 'ASSET_CORRUPT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('preset editor opens one blank creation flow without client-side fixed fields', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  for (const label of ['声明', '任务描述', '写作指导', '配角心声', '写前校准', '思维链指导', '格式要求']) assert.doesNotMatch(client, new RegExp(label))
  assert.doesNotMatch(client, /DEFAULT_FIELDS/)
  assert.doesNotMatch(client, /rpc\(connection, 'templates', \{\}\)/)
  assert.doesNotMatch(client, /function PresetCreateChooser|createChooser|templateCard|空白预设/)
  assert.match(client, /const create = \(\) => \{ setDraft\(newPresetDraft\(\)\); setView\('edit'\)/)
  assert.match(client, /mode === 'create' \? newPresetDraft\(\) : null/)
  assert.match(client, /fields: \(preset\?\.fields \?\? \[\]\)/)
  assert.match(client, /id: 'set-default', label: '设为默认'/)
  assert.match(client, /\{ id: 'delete', label: '删除预设', danger: true \}/)
  assert.match(client, /rpc\(connection, 'delete', \{ id: target\.id, expectedRevision: target\.revision \}\)/)
  assert.match(client, /function DeletePresetDialog/)
  assert.match(client, /h\(Menu, \{/)
  assert.match(client, /IconEllipsisOutline16/)
  assert.match(client, /IconTrashOutline16/)
  assert.match(client, /'新增栏位'/)
  assert.match(client, /'创建你的第一个预设'/)
  assert.match(client, /className: css\.emptyIcon/)
  assert.match(client, /className: css\.primaryButton.*'新建预设'/)
  assert.match(client, /className: css\.listToolbar/)
  assert.match(client, /className: compact \? `\$\{css\.dialog\} \$\{css\.compactDialog\}`/)
  assert.match(client, /Reorder\.Group/)
  assert.match(client, /FIELD_POSITIONS/)
  assert.match(client, /'aria-label': `\$\{field\.name \|\| '新栏位'\}的位置`/)
  assert.match(client, /mergePositionOrder/)
  assert.match(client, /'aria-label': '上移栏位'/)
  assert.match(client, /'aria-label': '下移栏位'/)
  assert.doesNotMatch(styles, /createChooser|templateCard/)
  assert.match(client, /function SectionTagSwitch/)
  assert.match(client, /role: 'switch'/)
  assert.match(client, /'分组标签'/)
  assert.match(client, /className: css\.sectionTagCompact/)
  assert.match(client, /控制新会话是否默认添加分组标签；会话内仍可单独调整。/)
  assert.doesNotMatch(client, /className: css\.sectionTagControl/)
  assert.match(client, /onUpdate\(field\.id, 'sectionTag', value\)/)
  assert.match(client, /reducedMotion: 'user'/)
  assert.match(client, /useWorkbenchModal\(open\)/)
  assert.match(client, /ref: dialogRef, tabIndex: -1, className: css\.shell/)
  assert.match(client, /h\(IconChecklistOutline14, \{ size: wide \? 16 : 18 \}\), wide \? h\('span'/)
  assert.doesNotMatch(client, /IconListPenOutline16/)
  assert.doesNotMatch(client, /IconAgentPresetOutline16/)
  assert.doesNotMatch(client, /className: css\.triggerIcon/)
  assert.match(styles, /\.trigger\{display:flex;align-items:center;gap:8px;width:calc\(100% \+ 8px\);height:34px;/)
  assert.match(styles, /\.emptyIcon\{display:flex;width:56px;height:56px;/)
  assert.match(styles, /\.content>:last-child\{flex:1;min-width:0;min-height:0;overflow:hidden;/)
  assert.match(styles, /\.empty\{height:100%;box-sizing:border-box;flex:1;min-height:0;/)
  assert.match(styles, /\.list\{width:min\(680px,100%\);gap:6px;/)
  assert.match(styles, /\.row\{grid-template-columns:36px minmax\(0,1fr\) auto;gap:10px;min-height:60px;/)
  assert.match(styles, /\.compactDialog\{width:min\(760px,calc\(100vw - 48px\)\);height:min\(520px,/)
  assert.match(styles, /\.editorBody\{overscroll-behavior:contain\}/)
  assert.match(styles, /\.positionGroup\{margin-top:14px\}/)
  assert.match(styles, /\.moreAction\{/)
  assert.match(styles, /\.rowWrap\{display:grid;grid-template-columns:minmax\(0,1fr\) 36px;align-items:center;box-sizing:border-box;border:1px solid transparent;/)
  assert.match(styles, /\.rowWrap\[data-default="true"\]\{border-color:/)
  assert.doesNotMatch(styles, /\.rowWrap\[data-default="true"\]\{box-shadow:/)
  assert.match(styles, /\.deleteDialog\{/)
  assert.match(styles, /\.deleteSummary\{/)
  assert.match(styles, /\.positionGroup \.fieldGrid\{grid-template-columns:minmax\(92px,\.55fr\) 1fr 1\.5fr\}/)
  assert.match(styles, /\.sectionTagCompact\{/)
  assert.match(styles, /\.fieldCardHeader \.sectionTagSwitch\[aria-checked="true"\]/)
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)\{\.fieldCardHeader \.sectionTagSwitch\{transition:none\}\}/)
  assert.match(client, /export const inject = \['slots', 'rpRemote', 'rpAssetEditors'\]/)
  assert.match(client, /ctx\.rpAssetEditors\.register\('preset', PresetSessionEditor\)/)
  assert.match(client, /function PresetSessionEditor/)
  assert.match(client, /h\(PresetEditor/)
})
